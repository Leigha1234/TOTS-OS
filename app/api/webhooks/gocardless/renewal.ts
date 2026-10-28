import { createClient } from '@supabase/supabase-js';

export const ORGANISATION_ID = '2c96d537-2be4-4917-8982-e7491300f15f';
export function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
export function database() {
  return createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export type Event = { id: string; resource_type: string; action: string;
  created_at?: string; links?: { subscription?: string; payment?: string; mandate?: string } };
export type Subscription = { id: string; status: string; interval: number;
  interval_unit: string; start_date: string; day_of_month?: number | null;
  metadata?: Record<string, string>; links: { mandate: string };
  upcoming_payments?: { charge_date: string; amount: number }[] };
export type Payment = { id: string; status: string; charge_date: string;
  created_at: string; amount: number; amount_refunded?: number; currency: string;
  links: { subscription?: string; mandate?: string } };

async function gc<T>(path: string): Promise<T> {
  const environment = (process.env.GOCARDLESS_ENVIRONMENT || 'live').toLowerCase();
  if (!['live', 'sandbox'].includes(environment)) throw new Error('Invalid GoCardless environment');
  const base = environment === 'sandbox' ? 'https://api-sandbox.gocardless.com' : 'https://api.gocardless.com';
  const response = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${env('GOCARDLESS_ACCESS_TOKEN')}`,
      'GoCardless-Version': '2015-07-06', Accept: 'application/json' },
    cache: 'no-store', signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`GoCardless GET failed (${response.status})`);
  return response.json();
}
function date(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid processor date');
  const result = new Date(`${value}T12:00:00.000Z`);
  if (result.toISOString().slice(0, 10) !== value) throw new Error('Invalid calendar date');
  return result;
}
function monthDate(index: number, day: number) {
  const year = Math.floor(index / 12), month = index % 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, day === -1 ? last : Math.min(day, last), 12));
}
// Billing policy: one nominal calendar interval per successful recurring payment.
// Collection rolling to Monday does not move the member's anniversary to Monday.
// Only the monthly schedules used by the uploaded migration are supported.
export function paidPeriod(sub: Subscription, payment: Payment) {
  if (sub.interval_unit !== 'monthly' || !Number.isInteger(sub.interval) || sub.interval < 1 || sub.interval > 12)
    throw new Error('Unsupported recurrence; manual review required');
  const anchor = date(sub.start_date), charged = date(payment.charge_date);
  const day = sub.day_of_month ?? anchor.getUTCDate();
  if (!Number.isInteger(day) || (day !== -1 && (day < 1 || day > 31))) throw new Error('Invalid anniversary');
  const origin = anchor.getUTCFullYear() * 12 + anchor.getUTCMonth();
  const current = charged.getUTCFullYear() * 12 + charged.getUTCMonth();
  const cycle = Math.floor((current - origin) / sub.interval);
  const candidates = [cycle - 1, cycle, cycle + 1].filter(n => n >= 0).map(n => ({
    index: origin + n * sub.interval, start: monthDate(origin + n * sub.interval, day),
  })).filter(x => {
    const days = (charged.getTime() - x.start.getTime()) / 86400000;
    return day === -1 ? days >= -7 && days <= 0 : days >= 0 && days <= 7;
  });
  if (candidates.length !== 1) throw new Error('Payment cannot be safely assigned to a billing cycle');
  return { start: candidates[0].start.toISOString(),
    end: monthDate(candidates[0].index + sub.interval, day).toISOString() };
}
export function paymentSnapshot(sub: Subscription, payments: Payment[], today: string) {
  const due = payments.filter(p => p.links.subscription === sub.id && p.charge_date <= today);
  const good = due.filter(p => ['confirmed', 'paid_out'].includes(p.status) && !(p.amount_refunded ?? 0));
  const periods = good.map(p => ({ p, period: paidPeriod(sub, p) })).sort((a, b) => b.period.end.localeCompare(a.period.end));
  const latest = periods[0];
  // Historical failed attempts must not block a newer successful renewal.
  // Chargebacks/refunds are never automatically dismissed by later payments.
  const issue = due.some(p => p.status === 'charged_back' || (p.amount_refunded ?? 0) > 0
    || (['failed', 'cancelled'].includes(p.status)
      && (!latest || p.charge_date >= latest.p.charge_date)));
  return { latest, issue };
}
async function paymentsFor(id: string) {
  const result: Payment[] = [];
  let after: string | undefined;
  const deadline = Date.now() + 15000;
  for (let page = 0; page < 100; page++) {
    if (Date.now() >= deadline) throw new Error('Payment history request budget exceeded');
    const query = new URLSearchParams({ subscription: id, limit: '100' });
    if (after) query.set('after', after);
    const body = await gc<{ payments: Payment[]; meta: { cursors: { after?: string } } }>(`/payments?${query}`);
    result.push(...body.payments);
    after = body.meta.cursors.after;
    if (!after) return result;
  }
  throw new Error('Payment history pagination limit reached');
}
export async function reconcile(event: Event) {
  const admin = database();
  let subscriptionId = event.links?.subscription;
  if (event.resource_type === 'payments') {
    if (!event.links?.payment) throw new Error('Payment event has no payment ID');
    const body = await gc<{ payments: Payment }>(`/payments/${encodeURIComponent(event.links.payment)}`);
    subscriptionId = body.payments.links.subscription;
    if (!subscriptionId) return; // A one-off payment must never renew a membership.
  }
  let rows: any[] = [];
  if (subscriptionId) {
    const { data, error } = await admin.from('store_subscriptions').select('*')
      .eq('organisation_id', ORGANISATION_ID).eq('external_subscription_id', subscriptionId);
    if (error) throw error;
    if ((data?.length || 0) > 1) throw new Error('Ambiguous subscription identity');
    rows = data || [];
    if (!rows.length) {
      const { subscriptions: sub } = await gc<{ subscriptions: Subscription }>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
      if (sub.metadata?.organisation_id === ORGANISATION_ID)
        throw new Error('MTC processor subscription has no linked TOTS record');
      return; // Other organisations sharing this GoCardless endpoint.
    }
  } else if (event.resource_type === 'mandates' && event.links?.mandate) {
    // All memberships for this mandate, never an arbitrary limit(1).
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await admin.from('store_subscriptions').select('*')
        .eq('organisation_id', ORGANISATION_ID).eq('external_mandate_id', event.links.mandate)
        .order('id').range(offset, offset + 99);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < 100) break;
    }
  }
  for (const row of rows) {
    if (row.billing_provider !== 'gocardless') throw new Error('Provider identity mismatch');
    const id = row.external_subscription_id;
    if (!id) throw new Error('Linked GoCardless subscription ID missing');
    const observedAt = new Date().toISOString(); // Before API fetch, for stale-snapshot ordering.
    const { subscriptions: sub } = await gc<{ subscriptions: Subscription }>(`/subscriptions/${encodeURIComponent(id)}`);
    if (sub.id !== id || (sub.metadata?.tots_subscription_id && sub.metadata.tots_subscription_id !== row.id)
      || (sub.metadata?.organisation_id && sub.metadata.organisation_id !== ORGANISATION_ID)
      || (row.external_mandate_id && sub.links.mandate !== row.external_mandate_id))
      throw new Error('Processor subscription identity mismatch');
    const [{ mandates: mandate }, payments] = await Promise.all([
      gc<{ mandates: { status: string } }>(`/mandates/${encodeURIComponent(sub.links.mandate)}`), paymentsFor(id),
    ]);
    if (payments.some(p => p.links.subscription !== id || !Number.isInteger(p.amount)
      || p.amount <= 0 || p.currency.toLowerCase() !== String(row.currency || 'gbp').toLowerCase()))
      throw new Error('Unexpected payment amount/currency/subscription; manual review required');
    const snapshot = paymentSnapshot(sub, payments, observedAt.slice(0, 10));
    const issue = snapshot.issue || ['failed', 'cancelled', 'expired'].includes(mandate.status);
    const next = (sub.upcoming_payments || []).map(p => p.charge_date).sort()
      .find(d => d >= observedAt.slice(0, 10));
    const { error } = await admin.rpc('mtc_apply_gc_snapshot', {
      p_id: row.id, p_external: id, p_observed: observedAt,
      p_event: event.id, p_issue: issue, p_processor_status: sub.status,
      p_verified: mandate.status === 'active',
      p_start: snapshot.latest?.period.start ?? null,
      p_end: snapshot.latest?.period.end ?? null,
      p_payment_at: snapshot.latest ? `${snapshot.latest.p.charge_date}T12:00:00.000Z` : null,
      p_amount: snapshot.latest?.p.amount ?? null,
      p_next: next ? `${next}T12:00:00.000Z` : null,
    });
    if (error) throw error;
    const endpoint = new URL(env('TOTS_MTC_MEMBERSHIP_SYNC_URL'));
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('Invalid MTC sync URL');
    // Always deliver after the DB update, including duplicate events/retries.
    const response = await fetch(endpoint, {
      method: 'POST', headers: { Authorization: `Bearer ${env('TOTS_MTC_INTEGRATION_SECRET')}`,
        'Content-Type': 'application/json' },
      body: JSON.stringify({ billingSubscriptionId: row.id }),
      cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    const body = await response.json();
    if (!response.ok || body.success !== true) throw new Error(`MTC billing sync failed (${response.status})`);
  }
}
