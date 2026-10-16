import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ORGANISATION_ID = '2c96d537-2be4-4917-8982-e7491300f15f'
const ACCOUNT_ID = 'acct_1ULLnG1LoZ4IqUbK'

function sameSecret(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const secret = process.env.TOTS_MTC_INTEGRATION_SECRET
  if (!secret || !sameSecret(req.headers.get('x-mtc-integration-secret') || '', secret)) {
    return fail('Unauthorized integration request', 401)
  }

  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!dbUrl || !dbKey || !stripeKey) return fail('Billing integration is not configured', 503)

  let input: { email?: unknown; returnOrigin?: unknown }
  try { input = await req.json() } catch { return fail('Invalid request', 400) }
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Invalid member email', 400)

  // Only allow redirecting to the known MTC app origin; never trust an arbitrary URL.
  const configuredAppUrl = process.env.MTC_MEMBERSHIP_SYNC_URL
  if (!configuredAppUrl) return fail('MTC origin is not configured', 503)
  let appOrigin: string
  try {
    appOrigin = new URL(configuredAppUrl).origin
    const suppliedOrigin = new URL(String(input.returnOrigin || '')).origin
    if (suppliedOrigin !== appOrigin) return fail('Invalid return origin', 400)
    if (new URL(appOrigin).protocol !== 'https:') return fail('HTTPS required', 400)
  } catch { return fail('Invalid return origin configuration', 503) }

  const admin = createClient(dbUrl, dbKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: subscriptions, error } = await admin.from('store_subscriptions')
    .select('id,organisation_id,customer_email,stripe_account_id,stripe_customer_id,metadata')
    .eq('organisation_id', ORGANISATION_ID)
    .ilike('customer_email', email)
  if (error) return fail('Unable to verify membership', 500)

  const canonical = (subscriptions || []).filter((row) =>
    row.metadata?.mtc_canonical_membership === true &&
    row.metadata?.mtc_duplicate_record !== true
  )
  if (canonical.length !== 1) return fail('Membership requires manual billing review', 409)
  const member = canonical[0]
  if (member.stripe_account_id !== ACCOUNT_ID) return fail('Membership Stripe account mismatch', 409)

  const stripe = new Stripe(stripeKey)
  let customerId = member.stripe_customer_id as string | null
  try {
    // A customer ID from TeamUp must NOT be reused without checking it on the destination account.
    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId, {}, { stripeAccount: ACCOUNT_ID })
        if (customer.deleted || customer.email?.trim().toLowerCase() !== email) return fail('Customer needs billing review', 409)
      } catch (err) {
        const stripeErr = err as { code?: string }
        if (stripeErr.code !== 'resource_missing') throw err
        customerId = null
      }
    }

    // Safely establish a customer in the destination account, without creating a charge or subscription.
    if (!customerId) {
      const matches = await stripe.customers.list({ email, limit: 10 }, { stripeAccount: ACCOUNT_ID })
      const exact = matches.data.filter((c) => !c.deleted && c.email?.trim().toLowerCase() === email)
      if (exact.length > 1) return fail('Multiple billing customers require review', 409)
      const customer = exact[0] || await stripe.customers.create({ email, metadata: { mtc_tots_subscription_id: member.id } }, { stripeAccount: ACCOUNT_ID })
      customerId = customer.id
      const { data: updated, error: updateError } = await admin.from('store_subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('id', member.id)
        .eq('organisation_id', ORGANISATION_ID)
        .select('id')
        .single()
      if (updateError || !updated) return fail('Unable to link destination billing customer', 500)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customerId,
      payment_method_types: ['card'],
      success_url: `${appOrigin}/account?payment_method=returned`,
      cancel_url: `${appOrigin}/account?payment_method=cancelled`,
      metadata: { purpose: 'mtc_card_setup', tots_subscription_id: member.id },
    }, { stripeAccount: ACCOUNT_ID })
    if (!session.url) return fail('Unable to create secure setup session', 500)
    return NextResponse.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('TOTS-OS MTC card setup failed:', err)
    return fail('Unable to create card setup. Contact MTC.', 502)
  }
}
