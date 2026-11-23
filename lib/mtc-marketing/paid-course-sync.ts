import { createClient } from '@supabase/supabase-js';
import { MTC_CREDIT_ORGANISATION_ID, resolveMtcCreditSku } from '@/lib/integrations/mtc/credit-products';

const courseBySku: Record<string, string> = {
  'MTC-HYROX-BEGINNER-4WK': 'beginner_hyrox',
  'MTC-CROSSFIT-BEGINNER-4WK': 'beginner_crossfit',
  'MTC-MUMFIT-BEGINNER-4WK': 'mum_fit',
};
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

/** Best-effort, post-payment sync; failures never affect fulfilment or Stripe acknowledgement. */
export async function syncPaidMtcCoursesSafely(orderId: string): Promise<void> {
  if (process.env.MTC_COURSE_PURCHASE_SYNC_ENABLED !== 'true') return;
  try {
    const lookupUrl = process.env.MTC_COURSE_CUSTOMER_LOOKUP_URL;
    const receiverUrl = process.env.MTC_COURSE_PURCHASE_RECEIVER_URL;
    const secret = process.env.TOTS_MTC_INTEGRATION_SECRET;
    const safeEndpoint = (value: string | undefined): boolean => {
      if (!value) return false;
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'https:' ||
          (process.env.NODE_ENV !== 'production' && parsed.protocol === 'http:' &&
            ['localhost', '127.0.0.1'].includes(parsed.hostname));
      } catch { return false; }
    };
    if (!secret || !safeEndpoint(lookupUrl) || !safeEndpoint(receiverUrl)) {
      throw new Error('Course sync configuration incomplete');
    }
    const { data: order, error: orderError } = await db.from('store_orders')
      .select('id,organisation_id,customer_email,customer_name,payment_status,paid_at').eq('id', orderId).maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.organisation_id !== MTC_CREDIT_ORGANISATION_ID || order.payment_status !== 'paid') return;
    const email = typeof order.customer_email === 'string' ? order.customer_email.trim().toLowerCase() : '';
    if (!email) return;
    const { data: items, error: itemsError } = await db.from('store_order_items')
      .select('product_id,sku,quantity').eq('order_id', orderId);
    if (itemsError) throw itemsError;
    const courses = new Set<string>();
    for (const item of items ?? []) {
      const sku = resolveMtcCreditSku({ organisationId: order.organisation_id, productId: item.product_id, sku: item.sku });
      if (sku && courseBySku[sku] && Number(item.quantity) > 0) courses.add(courseBySku[sku]);
    }
    if (!courses.size) return;
    // One purchase event per order: current receiver has unique(organisation_id, order_id).
    // Mixed-course baskets must be reviewed rather than silently attributing to one course.
    if (courses.size !== 1) { console.warn('[MTC COURSE SYNC] Mixed-course basket needs manual review', orderId); return; }
    const headers = { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' };
    const lookup = await fetch(lookupUrl!, { method: 'POST', headers, body: JSON.stringify({ email, invite: false }), cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!lookup.ok) throw new Error(`MTC customer lookup returned ${lookup.status}`);
    const customer = await lookup.json() as { status?: string; mtc_user_id?: string; marketing_opt_in?: boolean };
    if (customer.status === 'invited' || customer.status === 'not_found') {
      console.info('[MTC COURSE SYNC] Account invitation pending; no marketing event staged', orderId);
      return;
    }
    if (customer.status !== 'existing' || !customer.mtc_user_id) throw new Error('Customer could not be resolved');
    const response = await fetch(receiverUrl!, { method: 'POST', headers, cache: 'no-store', signal: AbortSignal.timeout(8000), body: JSON.stringify({
      order_id: orderId, mtc_user_id: customer.mtc_user_id, email,
      name: order.customer_name ?? '', course_type: [...courses][0],
      paid_at: order.paid_at ?? new Date().toISOString(), marketing_opt_in: customer.marketing_opt_in === true,
    }) });
    if (!response.ok) throw new Error(`Course receiver returned ${response.status}`);
  } catch (error) { console.error('[MTC COURSE SYNC] Post-payment sync failed', orderId, error); }
}
