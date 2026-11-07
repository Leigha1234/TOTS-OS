import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_USER_ID = "f0524a73-0559-467f-9465-095e43c3952e";
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const normal = (value: unknown) => String(value ?? "").trim().toLowerCase();
const string = (value: unknown) => typeof value === "string" ? value : "";
const validStatuses = new Set(["active", "trialing", "past_due", "unpaid", "paused", "canceled", "incomplete", "incomplete_expired"]);

export async function GET(req: Request) {
  try {
    const header = req.headers.get("authorization") ?? "";
    if (!header.toLowerCase().startsWith("bearer ")) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const { data: auth, error: authError } = await supabaseAdmin.auth.getUser(header.slice(7).trim());
    if (authError || !auth.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    if (auth.user.id !== ADMIN_USER_ID) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [{ data: orgs, error: orgError }, { data: members, error: memberError }] = await Promise.all([
      supabaseAdmin.from("organisations").select("*").limit(10000),
      supabaseAdmin.from("organisation_members").select("*").limit(10000),
    ]);
    if (orgError || memberError) throw new Error(orgError?.message || memberError?.message);
    const orgById = new Map((orgs ?? []).map(o => [String(o.id), o]));
    const orgByCustomer = new Map<string, Record<string, any>>();
    for (const org of orgs ?? []) {
      for (const field of ["stripe_customer_id", "billing_stripe_customer_id", "stripe_customer"]) {
        if (string(org[field])) orgByCustomer.set(string(org[field]), org);
      }
    }
    // Modules provisioned in ORBI, used to cross-check the modules purchased in Stripe.
    const { data: assignedModules, error: modulesError } = await supabaseAdmin
      .from("organisation_modules").select("organisation_id,module_key").limit(10000);
    // Some older deployments may not have this table; Stripe metadata remains authoritative for purchases.
    if (modulesError) console.warn("[ORBI ADMIN] Organisation module lookup unavailable", modulesError.message);
    const assignedByOrg = new Map<string, string[]>();
    for (const row of assignedModules ?? []) {
      const id = string(row.organisation_id);
      const key = string(row.module_key);
      if (id && key) assignedByOrg.set(id, [...(assignedByOrg.get(id) ?? []), key]);
    }
    const memberCount = new Map<string, number>();
    for (const member of members ?? []) {
      const id = string(member.organisation_id);
      if (id && member.user_id) memberCount.set(id, (memberCount.get(id) ?? 0) + 1);
    }

    const knownPriceIds = new Set([
      process.env.STRIPE_PRICE_STANDARD,
      process.env.STRIPE_PRICE_PROFESSIONAL,
      process.env.STRIPE_PRICE_ELITE,
    ].filter((v): v is string => Boolean(v)));
    const rows: Array<Record<string, unknown>> = [];
    const productNames = new Map<string, string>();
    let cursor: string | undefined;
    let pages = 0;
    do {
      const page = await stripe.subscriptions.list({
        limit: 100,
        status: "all",
        ...(cursor ? { starting_after: cursor } : {}),
        expand: ["data.customer"],
      });
      for (const sub of page.data) {
        if (!validStatuses.has(sub.status)) continue;
        const customer = typeof sub.customer === "string" ? null : sub.customer;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "";
        const meta = sub.metadata ?? {};
        const orgId = string(meta.organisation_id);
        const org = (orgId && orgById.get(orgId)) || orgByCustomer.get(customerId) || null;
        // Stripe disallows deeply nested product expansion in subscription lists.
        // Fetch distinct product names separately and cache them for this request.
        const productIds = [...new Set(sub.items.data.map(item =>
          typeof item.price.product === "string" ? item.price.product : item.price.product?.id
        ).filter((id): id is string => Boolean(id)))];
        await Promise.all(productIds.filter(id => !productNames.has(id)).map(async id => {
          const product = await stripe.products.retrieve(id);
          productNames.set(id, product.deleted ? "" : product.name);
        }));
        const items = sub.items.data.map(item => {
          const price = item.price;
          const product = typeof price.product === "string" ? null : price.product;
          const productName = product && !product.deleted ? product.name : productNames.get(typeof price.product === "string" ? price.product : price.product?.id ?? "") ?? "";
          const interval = price.recurring?.interval ?? null;
          const intervalCount = Math.max(1, price.recurring?.interval_count ?? 1);
          const amount = price.unit_amount ?? 0;
          const quantity = item.quantity ?? 1;
          const monthlyPence = interval === "year" ? amount * quantity / (12 * intervalCount)
            : interval === "month" ? amount * quantity / intervalCount
            : interval === "week" ? amount * quantity * 52 / (12 * intervalCount)
            : interval === "day" ? amount * quantity * 365 / (12 * intervalCount)
            : 0;
          return { name: productName || price.nickname || price.id, priceId: price.id, quantity, monthlyPence, currency: price.currency };
        });
        const isKnownPrice = items.some(i => knownPriceIds.has(i.priceId));
        const isNamedOrbi = items.some(i => /\b(tots[- ]?os|orbi)\b/i.test(i.name));
        const isOrbiMetadata = Boolean(meta.registration_id || meta.subscription_tier || meta.billing_package || meta.billing_model || meta.modules || meta.module_keys);
        // Only platform subscriptions matching ORBI signals; connected-account Store subscriptions are not included by Stripe's platform listing.
        if (!(isKnownPrice || isNamedOrbi || isOrbiMetadata)) continue;
        const currency = items[0]?.currency ?? "gbp";
        // Both ORBI SaaS checkout routes write `modules` (comma-separated) to subscription metadata.
        // `module_keys` is retained as a backwards-compatible fallback.
        const rawModules = string(meta.modules || meta.module_keys);
        const purchasedModules = [...new Set(rawModules.split(/[;,|]/).map(v => v.trim()).filter(Boolean))];
        const provisionedModules = org ? [...new Set(assignedByOrg.get(String(org.id)) ?? [])] : [];
        const moduleDiscrepancy = purchasedModules.length && org &&
          purchasedModules.some(key => !provisionedModules.includes(key))
          ? "Purchased module not provisioned in organisation_modules" : null;
        const grossMonthlyPence = items.reduce((sum, item) => sum + item.monthlyPence, 0);
        const billable = sub.status === "active" || sub.status === "past_due" || sub.status === "unpaid";
        const organisationStatus = normal(org?.subscription_status);
        const mismatch = !org ? "Stripe subscription not linked to an organisation" :
          billable && ["free", "trial", "trialing", "canceled", "cancelled"].includes(organisationStatus) ? "Stripe/Supabase status mismatch" : null;
        rows.push({
          subscriptionId: sub.id,
          customerId,
          customerName: customer && !customer.deleted ? customer.name || customer.email || "Unknown customer" : "Unknown customer",
          email: customer && !customer.deleted ? customer.email : null,
          organisationId: org?.id ?? null,
          organisationName: org?.name ?? null,
          organisationStatus: org?.subscription_status ?? null,
          memberCount: org ? (memberCount.get(String(org.id)) ?? 0) : 0,
          status: sub.status,
          currency,
          monthlyAmount: Math.round(grossMonthlyPence) / 100,
          countsTowardsMrr: sub.status === "active", // excludes trials, overdue and cancelled subscriptions
          products: items.map(({ name, priceId, quantity }) => ({ name, priceId, quantity })),
          metadata: { billingModel: meta.billing_model ?? null, billingPackage: meta.billing_package ?? null, tier: meta.subscription_tier ?? null, moduleKeys: meta.module_keys ?? null },
          nextBillingAt: null,
          discrepancy: mismatch || moduleDiscrepancy,
          purchasedModules,
          provisionedModules,
          moduleSource: purchasedModules.length ? "stripe_subscription_metadata" : "not_specified",
          modulesMatch: purchasedModules.length && org ? !moduleDiscrepancy : null,
        });
      }
      pages++;
      cursor = page.has_more ? page.data[page.data.length - 1]?.id : undefined;
    } while (cursor && pages < 20);
    const active = rows.filter(r => r.status === "active");
    const mrrByCurrency: Record<string, number> = {};
    for (const row of active) {
      const currency = String(row.currency);
      mrrByCurrency[currency] = Math.round(((mrrByCurrency[currency] ?? 0) + Number(row.monthlyAmount)) * 100) / 100;
    }
    return NextResponse.json({
      customers: rows,
      summary: { activeSubscriptions: active.length, payingCustomers: new Set(active.map(r => String(r.customerId))).size, mrrByCurrency, discrepancies: rows.filter(r => r.discrepancy).length },
      complete: !cursor,
      note: "MRR is gross recurring list-price value before discounts, taxes or refunds. Only active subscriptions are counted. Stripe is read-only.",
      generatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[ORBI ADMIN] Stripe billing report failed", error);
    return NextResponse.json({ error: "Unable to load Stripe billing report" }, { status: 500 });
  }
}
