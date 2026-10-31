import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ModuleKey = 'core' | 'clientsProjects' | 'finance' | 'social' | 'email' | 'store';
type LegacyTier = 'standard' | 'professional' | 'elite';
const MODULE_KEYS: ModuleKey[] = ['core', 'clientsProjects', 'finance', 'social', 'email', 'store'];
const clean = (v: unknown) => typeof v === 'string' ? v.trim() : '';
const tier = (v: unknown): LegacyTier | null => {
  const t = clean(v).toLowerCase();
  return t === 'standard' || t === 'elite' ? t : t === 'professional' || t === 'premium' ? 'professional' : null;
};
const future = (v: unknown) => {
  const s = clean(v);
  const n = s ? Date.parse(s) : NaN;
  return Number.isFinite(n) && n > Date.now();
};
const paid = (v: unknown) => ['active', 'trialing'].includes(clean(v).toLowerCase());
const fail = (reason: string, status: number, response: NextResponse) => {
  const result = NextResponse.json({ allowed: false, reason }, { status, headers: { 'Cache-Control': 'no-store' } });
  response.cookies.getAll().forEach(cookie => result.cookies.set(cookie));
  return result;
};

export async function GET() {
  const response = NextResponse.next();
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anon || !service) {
      console.error('Account access: Supabase environment variables missing');
      return fail('server_error', 503, response);
    }
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items: { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }[]) => {
          items.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options); } catch { /* request cookie store may be immutable */ }
            response.cookies.set(name, value, options);
          });
        },
      },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Account access auth error:', authError.message);
      const invalid = /refresh token not found|invalid refresh token|session not found|invalid jwt|jwt expired/i.test(authError.message);
      return fail(invalid ? 'unauthenticated' : 'auth_unavailable', invalid ? 401 : 503, response);
    }
    if (!user) return fail('unauthenticated', 401, response);

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profile, error: profileError } = await admin.from('profiles')
      .select('organisation_id, subscription_tier, is_subscribed').eq('id', user.id).maybeSingle();
    if (profileError) {
      console.error('Access profile lookup failed:', profileError);
      return fail('lookup_failed', 503, response);
    }
    let organisationId: string | null = profile?.organisation_id ?? null;
    if (!organisationId) {
      const { data, error } = await admin.from('organisation_members').select('organisation_id')
        .eq('user_id', user.id).limit(1).maybeSingle();
      if (error) { console.error('Access membership lookup failed:', error); return fail('lookup_failed', 503, response); }
      organisationId = data?.organisation_id ?? null;
    }
    if (!organisationId) {
      const { data, error } = await admin.from('user_organisations').select('organisation_id')
        .eq('user_id', user.id).limit(1).maybeSingle();
      // Legacy installations may not have this table. Do not treat a missing table as lost access.
      if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
        console.error('Access user_organisations lookup failed:', error);
        return fail('lookup_failed', 503, response);
      }
      organisationId = data?.organisation_id ?? null;
    }
    if (!organisationId) {
      const { data, error } = await admin.from('organisations').select('id')
        .eq('created_by', user.id).limit(1).maybeSingle();
      if (error) { console.error('Access legacy org lookup failed:', error); return fail('lookup_failed', 503, response); }
      organisationId = data?.id ?? null;
    }
    if (!organisationId) return fail('organisation_not_found', 403, response);

    const { data: org, error: orgError } = await admin.from('organisations').select(`
      id, name, subscription_tier, subscription_status, access_status,
      billing_model, billing_package, clarity_ai_tier, billing_version,
      store_enabled, beta_grace_ends_at, retention_trial_ends_at
    `).eq('id', organisationId).maybeSingle();
    if (orgError) { console.error('Access organisation lookup failed:', orgError); return fail('lookup_failed', 503, response); }
    if (!org) return fail('organisation_not_found', 403, response);

    const orgTier = tier(org.subscription_tier);
    const profileTier = tier(profile?.subscription_tier);
    const rawModel = clean(org.billing_model).toLowerCase();
    const billingModel = rawModel === 'modular' ? 'modular' : rawModel === 'legacy_tier' ? 'legacy_tier' : (orgTier || profileTier) ? 'legacy_tier' : 'unknown';
    const billingPackage = billingModel === 'legacy_tier' ? 'legacy' : clean(org.billing_package).toLowerCase() === 'complete' ? 'complete' : 'modular';
    const ai = clean(org.clarity_ai_tier).toLowerCase();
    const clarityAiTier = ['starter', 'plus', 'pro'].includes(ai) ? ai : 'none';
    const billingVersion = clean(org.billing_version) || (billingModel === 'modular' ? 'v2' : 'legacy');

    let activeModules: ModuleKey[] = [];
    if (billingModel === 'modular') {
      const { data, error } = await admin.from('organisation_modules')
        .select('module_key, status').eq('organisation_id', org.id).eq('status', 'active');
      if (error) {
        // Do not turn a temporary entitlement database failure into a permanent denial.
        console.error('Access module lookup failed:', error);
        return fail('lookup_failed', 503, response);
      }
      activeModules = [...new Set((data ?? []).map(row => row.module_key)
        .filter((key): key is ModuleKey => MODULE_KEYS.includes(key as ModuleKey)))];
    }

    const legacyPaidActive = billingModel === 'legacy_tier' && !!(orgTier || profileTier) && paid(org.subscription_status);
    const modularPaidActive = billingModel === 'modular' && paid(org.subscription_status);
    const legacyProfilePaidActive = billingModel === 'legacy_tier' && profile?.is_subscribed === true && !!profileTier;
    const betaGraceActive = clean(org.subscription_status).toLowerCase() === 'beta' && future(org.beta_grace_ends_at);
    const retentionTrialActive = clean(org.subscription_status).toLowerCase() === 'trial' && future(org.retention_trial_ends_at);
    const allowed = legacyPaidActive || modularPaidActive || legacyProfilePaidActive || betaGraceActive || retentionTrialActive;
    const reason = modularPaidActive ? 'modular_subscription_active'
      : legacyPaidActive ? 'legacy_subscription_active'
      : legacyProfilePaidActive ? 'legacy_profile_subscription_active'
      : betaGraceActive ? 'beta_grace_active'
      : retentionTrialActive ? 'retention_trial_active' : 'access_expired';
    const accessStatus = allowed ? 'active' : 'restricted';

    // Read-only endpoint: do not mutate access_status during GET. Billing/webhook logic
    // should update it separately, preventing refresh-time database writes and races.
    const result = NextResponse.json({
      allowed, reason, userId: user.id, organisationId: org.id, organisationName: org.name,
      billingModel, billingPackage, billingVersion, subscriptionTier: orgTier,
      subscriptionStatus: org.subscription_status, accessStatus,
      modules: activeModules, activeModules,
      hasCore: activeModules.includes('core'),
      hasClientsProjects: activeModules.includes('clientsProjects'),
      hasFinance: activeModules.includes('finance'),
      hasSocial: activeModules.includes('social'),
      hasEmail: activeModules.includes('email'),
      hasStore: activeModules.includes('store'),
      clarityAiTier, hasClarityAi: clarityAiTier !== 'none',
      profileSubscriptionTier: profileTier, profileSubscribed: profile?.is_subscribed ?? false,
      legacyPaidActive, modularPaidActive, profilePaidActive: legacyProfilePaidActive,
      betaGraceActive, retentionTrialActive,
      betaGraceEndsAt: org.beta_grace_ends_at,
      retentionTrialEndsAt: org.retention_trial_ends_at,
      storeEnabled: Boolean(org.store_enabled),
    }, { status: allowed ? 200 : 403, headers: { 'Cache-Control': 'no-store' } });
    response.cookies.getAll().forEach(cookie => result.cookies.set(cookie));
    return result;
  } catch (error) {
    console.error('Account access check failed:', error);
    return fail('server_error', 503, response);
  }
}
