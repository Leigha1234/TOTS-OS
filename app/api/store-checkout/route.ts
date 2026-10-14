import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  prepareMonthlySupportCheckout,
  MONTHLY_SUPPORT_SETUP_ID,
} from "@/lib/monthly-support-checkout";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
if (!supabaseServiceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is missing");

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = new Stripe(stripeSecretKey);

type SellingModel = "physical" | "digital_download" | "digital_delivery" | "collect" | "customisable" | "request_to_order" | "service";
type PurchaseType = "one_off" | "subscription";
type BillingInterval = "week" | "month" | "year";
type BeneficiaryMode = "none" | "single_adult" | "couple" | "child" | "child_plus_adult";
type BeneficiaryType = "adult" | "child";
type CheckoutCartItem = { productId: string; quantity: number; customUnitPrice?: number };
type CheckoutBeneficiary = {
  productId?: string; slotKey?: string;
  beneficiaryType?: BeneficiaryType | string; isPrimary?: boolean;
  firstName?: string; lastName?: string;
  email?: string | null; phone?: string | null; relationshipToPayer?: string | null;
};
type CheckoutRequest = {
  storeSlug: string; items: CheckoutCartItem[]; discountCode?: string;
  customer?: { name?: string; email?: string; phone?: string };
  beneficiaries?: CheckoutBeneficiary[];
};
type StoreSettingsRow = {
  id: string; organisation_id: string; slug: string;
  store_name: string | null; is_live: boolean | null;
};
type StoreStripeAccountRow = {
  id: string; organisation_id: string; stripe_account_id: string;
  charges_enabled: boolean; payouts_enabled: boolean;
  details_submitted: boolean; onboarding_complete: boolean;
  default_currency: string; created_at: string | null; updated_at: string | null;
};
type StoreProductRow = {
  id: string; organisation_id: string; name: string; slug: string;
  description: string | null; sku: string | null; category: string | null;
  selling_model: SellingModel | string | null;
  purchase_type: PurchaseType | string | null;
  billing_interval: BillingInterval | string | null;
  external_system: string | null; external_plan_code: string | null;
  beneficiary_mode: BeneficiaryMode | string | null;
  family_addon_eligible?: boolean | null;
  family_addon_discount?: number | string | null;
  family_addon_requires_couples?: boolean | null;
  stripe_product_id: string | null; stripe_price_id: string | null;
  price: number | string; compare_at_price: number | string | null;
  stock: number; inventory_quantity: number; track_inventory: boolean;
  is_active: boolean; status: string; image_url: string | null;
};
type StoreDiscountRow = {
  id: string; organisation_id: string; code: string; discount_type: string;
  value: number | string; minimum_order_amount: number | string | null;
  maximum_discount_amount: number | string | null;
  usage_limit: number | null; times_used: number | null;
  starts_at: string | null; expires_at: string | null; is_active: boolean | null;
  created_at: string | null; updated_at: string | null;
};
type ValidatedLine = { product: StoreProductRow; quantity: number; unitPrice: number; total: number };
type ValidatedDiscount = { discount: StoreDiscountRow; amount: number };
type BeneficiarySpec = {
  productId: string; slotKey: string; beneficiaryType: BeneficiaryType;
  isPrimary: boolean; relationshipToPayer: string; title: string; emailRequired: boolean;
};
type ValidatedBeneficiary = {
  organisation_id: string; order_id: string; product_id: string; slot_key: string;
  beneficiary_type: BeneficiaryType; first_name: string; last_name: string;
  email: string | null; phone: string | null; relationship_to_payer: string | null;
  is_primary: boolean; updated_at: string;
};

function cleanString(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function cleanLimitedString(value: unknown, maxLength: number) { return cleanString(value).slice(0, maxLength); }
function cleanEmail(value: unknown) { return cleanString(value).toLowerCase(); }
function isValidEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function safeQuantity(value: unknown) { const n = Number(value); return Number.isFinite(n) ? Math.floor(n) : 0; }
function safeNumber(value: unknown, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function moneyRound(value: number) { return Number(value.toFixed(2)); }
function priceToPence(value: number) { return Math.round(value * 100); }

// ROOTED CUSTOMER-SELECTED DONATIONS
const ROOTED_DIRECT_DONATION_SLUG = "rooted-direct-donation";
const MIN_ROOTED_DONATION = 1;
const MAX_ROOTED_DONATION = 5000;
function supportsCustomUnitPrice(product: StoreProductRow) {
  return cleanString(product.slug).toLowerCase() === ROOTED_DIRECT_DONATION_SLUG;
}
function validateCustomUnitPrice(product: StoreProductRow, value: unknown) {
  if (!supportsCustomUnitPrice(product)) return null;
  const amount = safeNumber(value, 0);
  if (amount < MIN_ROOTED_DONATION || amount > MAX_ROOTED_DONATION) {
    throw new Error(`Choose a donation between £${MIN_ROOTED_DONATION.toFixed(2)} and £${MAX_ROOTED_DONATION.toFixed(2)}.`);
  }
  return moneyRound(amount);
}
function generateOrderNumber() {
  return `TOTS-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

const VALID_SELLING_MODELS: SellingModel[] = ["physical", "digital_download", "digital_delivery", "collect", "customisable", "request_to_order", "service"];
function getSellingModel(product: StoreProductRow): SellingModel {
  const value = cleanString(product.selling_model).toLowerCase();
  return VALID_SELLING_MODELS.includes(value as SellingModel) ? value as SellingModel : "physical";
}
function isPhysicalProduct(product: StoreProductRow) { return getSellingModel(product) === "physical"; }
function blocksDirectCheckout(product: StoreProductRow) {
  const model = getSellingModel(product);
  return model === "customisable" || model === "request_to_order";
}
function getPurchaseType(product: StoreProductRow): PurchaseType {
  return cleanString(product.purchase_type).toLowerCase() === "subscription" ? "subscription" : "one_off";
}
function isSubscriptionProduct(product: StoreProductRow) { return getPurchaseType(product) === "subscription"; }
function getBillingInterval(product: StoreProductRow): BillingInterval | null {
  const value = cleanString(product.billing_interval).toLowerCase();
  return value === "week" || value === "month" || value === "year" ? value : null;
}
function getBeneficiaryMode(product: StoreProductRow): BeneficiaryMode {
  const value = cleanString(product.beneficiary_mode).toLowerCase();
  return value === "single_adult" || value === "couple" || value === "child" || value === "child_plus_adult" ? value : "none";
}
function isMtcMembershipProduct(product: StoreProductRow) {
  return isSubscriptionProduct(product) && cleanString(product.external_system).toLowerCase() === "mtc" &&
    Boolean(cleanString(product.external_plan_code)) && getBeneficiaryMode(product) !== "none";
}
function isCouplesMembershipProduct(product: StoreProductRow) {
  const sku = cleanString(product.sku).toUpperCase();
  const planCode = cleanString(product.external_plan_code).toUpperCase();
  return isMtcMembershipProduct(product) && (getBeneficiaryMode(product) === "couple" || sku.startsWith("MTC-COUPLE-") || planCode.startsWith("COUPLE_"));
}
function isFamilyKidsAddonProduct(product: StoreProductRow) {
  const sku = cleanString(product.sku).toUpperCase();
  const planCode = cleanString(product.external_plan_code).toUpperCase();
  const standardKidsPlan = ["MTC-KID-1PW", "MTC-KID-2PW", "MTC-KID-3PW"].includes(sku) || ["KID_1PW", "KID_2PW", "KID_3PW"].includes(planCode);
  const hasAdultOpenGym = sku.includes("OPEN-GYM") || planCode.includes("OPEN_GYM") || getBeneficiaryMode(product) === "child_plus_adult";
  return isMtcMembershipProduct(product) && getBeneficiaryMode(product) === "child" && product.family_addon_eligible === true &&
    product.family_addon_requires_couples === true && standardKidsPlan && !hasAdultOpenGym;
}
function getFamilyAddonUnitPrice(product: StoreProductRow) {
  const configuredDiscount = Number(product.family_addon_discount);
  const discount = Number.isFinite(configuredDiscount) && configuredDiscount > 0 ? configuredDiscount : 5;
  return moneyRound(Math.max(0, Number(product.price) - discount));
}

// AUTHORITATIVE MTC BENEFICIARY SPECIFICATIONS
function buildBeneficiarySpecs(line: ValidatedLine): BeneficiarySpec[] {
  const product = line.product;
  if (!isMtcMembershipProduct(product)) return [];
  const mode = getBeneficiaryMode(product);
  const specs: BeneficiarySpec[] = [];
  for (let index = 0; index < line.quantity; index += 1) {
    if (mode === "single_adult") specs.push({
      productId: product.id, slotKey: `${product.id}:${index}:adult:1`, beneficiaryType: "adult", isPrimary: true,
      relationshipToPayer: "self", title: line.quantity > 1 ? `${product.name} membership ${index + 1}` : product.name, emailRequired: true,
    });
    if (mode === "couple") specs.push(
      { productId: product.id, slotKey: `${product.id}:${index}:adult:1`, beneficiaryType: "adult", isPrimary: true, relationshipToPayer: "self", title: `${product.name} — Adult 1`, emailRequired: true },
      { productId: product.id, slotKey: `${product.id}:${index}:adult:2`, beneficiaryType: "adult", isPrimary: false, relationshipToPayer: "partner", title: `${product.name} — Adult 2`, emailRequired: true },
    );
    if (mode === "child") specs.push({
      productId: product.id, slotKey: `${product.id}:${index}:child:1`, beneficiaryType: "child", isPrimary: true,
      relationshipToPayer: "child", title: `${product.name} — Child`, emailRequired: false,
    });
    if (mode === "child_plus_adult") specs.push(
      { productId: product.id, slotKey: `${product.id}:${index}:adult:1`, beneficiaryType: "adult", isPrimary: true, relationshipToPayer: "self", title: `${product.name} — Adult`, emailRequired: true },
      { productId: product.id, slotKey: `${product.id}:${index}:child:1`, beneficiaryType: "child", isPrimary: false, relationshipToPayer: "child", title: `${product.name} — Child`, emailRequired: false },
    );
  }
  return specs;
}
function validateBeneficiaries({requestedBeneficiaries, validatedLines, organisationId, orderId}: {
  requestedBeneficiaries: CheckoutBeneficiary[]; validatedLines: ValidatedLine[]; organisationId: string; orderId: string;
}): ValidatedBeneficiary[] {
  const expectedSpecs = validatedLines.flatMap(buildBeneficiarySpecs);
  if (!expectedSpecs.length) {
    if (requestedBeneficiaries.length) throw new Error("Membership details were supplied for an order that does not require them.");
    return [];
  }
  if (requestedBeneficiaries.length !== expectedSpecs.length) throw new Error("The membership details supplied do not match the membership being purchased.");
  const bySlot = new Map<string, CheckoutBeneficiary>();
  for (const requested of requestedBeneficiaries) {
    const slotKey = cleanString(requested?.slotKey);
    if (!slotKey || !cleanString(requested?.productId)) throw new Error("One of the membership members is missing its product reference.");
    if (bySlot.has(slotKey)) throw new Error("Duplicate membership member details were submitted.");
    bySlot.set(slotKey, requested);
  }
  return expectedSpecs.map(spec => {
    const requested = bySlot.get(spec.slotKey);
    if (!requested) throw new Error(`Membership details are missing for ${spec.title}.`);
    if (cleanString(requested.productId) !== spec.productId) throw new Error("The submitted membership member does not match the selected product.");
    const firstName = cleanLimitedString(requested.firstName, 100);
    const lastName = cleanLimitedString(requested.lastName, 100);
    const email = cleanEmail(requested.email).slice(0, 320);
    const phone = cleanLimitedString(requested.phone, 50);
    if (!firstName || !lastName) throw new Error(`Enter the first and last name for ${spec.title}.`);
    if (spec.emailRequired && !email) throw new Error(`Enter an email address for ${spec.title}.`);
    if (email && !isValidEmail(email)) throw new Error(`Enter a valid email address for ${spec.title}.`);
    // Do not trust beneficiary type, relationship or primary status from the browser.
    return {
      organisation_id: organisationId, order_id: orderId, product_id: spec.productId, slot_key: spec.slotKey,
      beneficiary_type: spec.beneficiaryType, first_name: firstName, last_name: lastName, email: email || null,
      phone: phone || null, relationship_to_payer: spec.relationshipToPayer, is_primary: spec.isPrimary, updated_at: new Date().toISOString(),
    };
  });
}

function getBaseUrl(req: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  const origin = req.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  const host = req.headers.get("host");
  if (host) return `${host.includes("localhost") ? "http" : "https"}://${host}`;
  return "https://www.tots-os.co.uk";
}
function getAvailableQuantity(product: StoreProductRow) {
  if (product.track_inventory === false) return null;
  if (typeof product.inventory_quantity === "number") return product.inventory_quantity;
  if (typeof product.stock === "number") return product.stock;
  return null;
}
function isPercentageDiscount(value: string) { return ["percentage", "percent", "percentage_off", "percent_off", "%"].includes(value.trim().toLowerCase()); }
function isFixedDiscount(value: string) { return ["fixed", "fixed_amount", "fixed_value", "amount", "amount_off", "value"].includes(value.trim().toLowerCase()); }
async function validateDiscount({organisationId, code, subtotal}: {organisationId: string; code: string; subtotal: number}): Promise<ValidatedDiscount> {
  const normalisedCode = cleanString(code).toUpperCase();
  if (!normalisedCode) throw new Error("Enter a discount code.");
  const {data, error} = await supabaseAdmin.from("store_discounts")
    .select("id,organisation_id,code,discount_type,value,minimum_order_amount,maximum_discount_amount,usage_limit,times_used,starts_at,expires_at,is_active,created_at,updated_at")
    .eq("organisation_id", organisationId).ilike("code", normalisedCode).limit(1).maybeSingle();
  if (error) { console.error("[TOTS STORE] Discount lookup failed:", error); throw new Error("The discount code could not be checked."); }
  if (!data) throw new Error("This discount code is invalid.");
  const discount = data as StoreDiscountRow;
  if (discount.is_active !== true) throw new Error("This discount code is no longer active.");
  const now = new Date();
  if (discount.starts_at) { const d = new Date(discount.starts_at); if (!Number.isNaN(d.getTime()) && now < d) throw new Error("This discount code is not active yet."); }
  if (discount.expires_at) { const d = new Date(discount.expires_at); if (!Number.isNaN(d.getTime()) && now > d) throw new Error("This discount code has expired."); }
  if (discount.usage_limit !== null && discount.usage_limit > 0 && (discount.times_used || 0) >= discount.usage_limit) throw new Error("This discount code has reached its usage limit.");
  const minimum = safeNumber(discount.minimum_order_amount, 0);
  if (minimum > 0 && subtotal < minimum) throw new Error(`This discount requires a minimum spend of £${minimum.toFixed(2)}.`);
  const value = safeNumber(discount.value, 0);
  if (value <= 0) throw new Error("This discount code has an invalid value.");
  let amount = 0;
  if (isPercentageDiscount(discount.discount_type)) {
    if (value > 100) throw new Error("This percentage discount has an invalid value.");
    amount = subtotal * value / 100;
  } else if (isFixedDiscount(discount.discount_type)) amount = value;
  else throw new Error("This discount code has an unsupported discount type.");
  const maximum = safeNumber(discount.maximum_discount_amount, 0);
  if (maximum > 0) amount = Math.min(amount, maximum);
  amount = Math.max(0, moneyRound(Math.min(amount, subtotal)));
  if (amount <= 0) throw new Error("This discount code does not apply to this order.");
  return {discount, amount};
}

async function getConnectedStripeAccount(organisationId: string) {
  const {data, error} = await supabaseAdmin.from("store_stripe_accounts")
    .select("id,organisation_id,stripe_account_id,charges_enabled,payouts_enabled,details_submitted,onboarding_complete,default_currency,created_at,updated_at")
    .eq("organisation_id", organisationId).maybeSingle();
  if (error) { console.error("[TOTS STORE] Stripe connection lookup failed:", error); throw error; }
  return data as StoreStripeAccountRow | null;
}
async function validateConnectedStripeAccount(connection: StoreStripeAccountRow) {
  const accountId = cleanString(connection.stripe_account_id);
  if (!accountId) throw new Error("This store has not connected Stripe yet.");
  let account: Stripe.Account;
  try {
    const result = await stripe.accounts.retrieve(accountId);
    if ("deleted" in result && result.deleted) throw new Error("STRIPE_ACCOUNT_MISSING");
    account = result as Stripe.Account;
  } catch (error: unknown) {
    console.error("[TOTS STORE] Stripe account lookup failed:", error);
    const se = error as {code?: string; statusCode?: number};
    const missing = (error instanceof Error && error.message === "STRIPE_ACCOUNT_MISSING") || se?.code === "resource_missing" || se?.statusCode === 404;
    if (missing) {
      const {error: deleteError} = await supabaseAdmin.from("store_stripe_accounts").delete().eq("organisation_id", connection.organisation_id).eq("stripe_account_id", accountId);
      if (deleteError) console.error("[TOTS STORE] Could not remove stale Stripe connection:", deleteError);
      throw new Error("This store's Stripe connection is no longer available. The business needs to reconnect Stripe.");
    }
    throw new Error("The store's connected Stripe account could not be verified.");
  }
  const detailsSubmitted = account.details_submitted === true;
  const chargesEnabled = account.charges_enabled === true;
  const payoutsEnabled = account.payouts_enabled === true;
  const {error: syncError} = await supabaseAdmin.from("store_stripe_accounts").update({
    charges_enabled: chargesEnabled, payouts_enabled: payoutsEnabled, details_submitted: detailsSubmitted,
    onboarding_complete: detailsSubmitted && chargesEnabled && payoutsEnabled,
    default_currency: cleanString(account.default_currency).toLowerCase() || connection.default_currency || "gbp", updated_at: new Date().toISOString(),
  }).eq("id", connection.id).eq("organisation_id", connection.organisation_id);
  if (syncError) console.warn("[TOTS STORE] Stripe account state sync failed:", syncError);
  if (!detailsSubmitted) throw new Error("This store has not finished setting up Stripe yet.");
  if (!chargesEnabled) throw new Error("This store cannot currently accept Stripe payments. The business needs to check its Stripe account requirements.");
  return account;
}

async function ensureRecurringStripePrice({product, stripeAccountId, currency}: {product: StoreProductRow; stripeAccountId: string; currency: string}) {
  const interval = getBillingInterval(product);
  if (!interval) throw new Error(`${product.name} is a subscription but does not have a billing interval.`);
  const unitAmount = priceToPence(Number(product.price));
  if (unitAmount <= 0) throw new Error(`${product.name} does not have a valid subscription price.`);
  const savedPriceId = cleanString(product.stripe_price_id);
  if (savedPriceId) {
    try {
      const saved = await stripe.prices.retrieve(savedPriceId, {stripeAccount: stripeAccountId});
      if (saved.active === true && saved.currency.toLowerCase() === currency.toLowerCase() && saved.unit_amount === unitAmount && saved.recurring?.interval === interval) return saved.id;
    } catch (error) { console.warn("[TOTS STORE] Saved recurring Stripe price could not be reused:", {productId: product.id, stripePriceId: savedPriceId, error}); }
  }
  let stripeProductId = cleanString(product.stripe_product_id);
  if (stripeProductId) {
    try { const result = await stripe.products.retrieve(stripeProductId, {stripeAccount: stripeAccountId}); if ("deleted" in result && result.deleted) stripeProductId = ""; }
    catch { stripeProductId = ""; }
  }
  const productMetadata = {
    tots_product_id: product.id, organisation_id: product.organisation_id, purchase_type: "subscription", billing_interval: interval,
    external_system: cleanString(product.external_system), external_plan_code: cleanString(product.external_plan_code),
    beneficiary_mode: getBeneficiaryMode(product), tots_source: "store",
  };
  const productParams = {name: product.name, description: product.description || undefined, metadata: productMetadata};
  if (!stripeProductId) {
    stripeProductId = (await stripe.products.create(productParams, {stripeAccount: stripeAccountId})).id;
  } else {
    try { await stripe.products.update(stripeProductId, productParams, {stripeAccount: stripeAccountId}); }
    catch (error) { console.warn("[TOTS STORE] Existing Stripe product metadata could not be refreshed:", error); }
  }
  const stripePrice = await stripe.prices.create({product: stripeProductId, currency, unit_amount: unitAmount, recurring: {interval}, metadata: productMetadata}, {stripeAccount: stripeAccountId});
  const {error: saveError} = await supabaseAdmin.from("store_products").update({stripe_product_id: stripeProductId, stripe_price_id: stripePrice.id}).eq("id", product.id).eq("organisation_id", product.organisation_id);
  if (saveError) {
    console.error("[TOTS STORE] Recurring Stripe IDs could not be saved:", saveError);
    throw new Error(`Stripe created the recurring price for ${product.name}, but TOTS-OS could not save the Stripe references.`);
  }
  product.stripe_product_id = stripeProductId;
  product.stripe_price_id = stripePrice.id;
  return stripePrice.id;
}
async function deleteConnectedCoupon(couponId: string | null, stripeAccountId: string | null) {
  if (!couponId || !stripeAccountId) return;
  try { await stripe.coupons.del(couponId, {stripeAccount: stripeAccountId}); }
  catch (error) { console.error("[TOTS STORE] Connected Stripe coupon cleanup failed:", error); }
}
async function deletePendingOrder(orderId: string | null) {
  if (!orderId) return;
  try {
    const {error} = await supabaseAdmin.from("store_orders").delete().eq("id", orderId).eq("payment_status", "pending");
    if (error) console.error("[TOTS STORE] Pending order cleanup failed:", error);
  } catch (error) { console.error("[TOTS STORE] Pending order cleanup failed:", error); }
}

export async function POST(req: Request) {
  let createdOrderId: string | null = null;
  let createdCouponId: string | null = null;
  let connectedStripeAccountId: string | null = null;
  let stripeCheckoutCreated = false;
  try {
    const body = await req.json() as CheckoutRequest;
    const storeSlug = cleanString(body.storeSlug).toLowerCase();
    const requestedDiscountCode = cleanString(body.discountCode).toUpperCase();
    const requestedItems = Array.isArray(body.items) ? body.items : [];
    const requestedBeneficiaries = Array.isArray(body.beneficiaries) ? body.beneficiaries : [];
    if (!storeSlug) return NextResponse.json({error: "Store slug is required."}, {status: 400});
    if (!requestedItems.length) return NextResponse.json({error: "Your basket is empty."}, {status: 400});

    const {data: storeData, error: storeError} = await supabaseAdmin.from("store_settings").select("id,organisation_id,slug,store_name,is_live").eq("slug", storeSlug).maybeSingle();
    if (storeError) { console.error("[TOTS STORE] Store lookup failed:", storeError); return NextResponse.json({error: "The store could not be loaded."}, {status: 500}); }
    if (!storeData) return NextResponse.json({error: "Store not found."}, {status: 404});
    const store = storeData as StoreSettingsRow;
    if (store.is_live !== true) return NextResponse.json({error: "This store is not currently accepting orders."}, {status: 400});
    const organisationId = store.organisation_id;
    const stripeConnection = await getConnectedStripeAccount(organisationId);
    if (!stripeConnection) return NextResponse.json({error: "This store has not connected Stripe yet and cannot currently accept payments.", stripeRequired: true}, {status: 400});
    connectedStripeAccountId = cleanString(stripeConnection.stripe_account_id) || null;
    if (!connectedStripeAccountId) return NextResponse.json({error: "This store has not connected Stripe yet and cannot currently accept payments.", stripeRequired: true}, {status: 400});
    let connectedAccount: Stripe.Account;
    try { connectedAccount = await validateConnectedStripeAccount(stripeConnection); }
    catch (error) { return NextResponse.json({error: error instanceof Error ? error.message : "This store cannot currently accept Stripe payments."}, {status: 400}); }
    const checkoutCurrency = cleanString(connectedAccount.default_currency).toLowerCase() || "gbp";

    const quantityByProduct = new Map<string, number>();
    const customUnitPriceByProduct = new Map<string, number>();
    for (const item of requestedItems) {
      const productId = cleanString(item?.productId);
      const quantity = safeQuantity(item?.quantity);
      if (!productId || quantity <= 0) continue;
      quantityByProduct.set(productId, (quantityByProduct.get(productId) || 0) + quantity);
      const requestedCustomUnitPrice = safeNumber(item?.customUnitPrice, 0);
      if (requestedCustomUnitPrice > 0) {
        const existing = customUnitPriceByProduct.get(productId);
        if (existing !== undefined && moneyRound(existing) !== moneyRound(requestedCustomUnitPrice)) return NextResponse.json({error: "The same product cannot be submitted with different custom prices."}, {status: 400});
        customUnitPriceByProduct.set(productId, moneyRound(requestedCustomUnitPrice));
      }
    }
    const productIds = Array.from(quantityByProduct.keys());
    if (!productIds.length) return NextResponse.json({error: "Your basket contains no valid items."}, {status: 400});
    const {data: productRows, error: productError} = await supabaseAdmin.from("store_products")
      .select("id,organisation_id,name,slug,description,sku,category,selling_model,purchase_type,billing_interval,external_system,external_plan_code,beneficiary_mode,family_addon_eligible,family_addon_discount,family_addon_requires_couples,stripe_product_id,stripe_price_id,price,compare_at_price,stock,inventory_quantity,track_inventory,is_active,status,image_url")
      .eq("organisation_id", organisationId).in("id", productIds);
    if (productError) { console.error("[TOTS STORE] Product checkout lookup failed:", productError); return NextResponse.json({error: "The products in your basket could not be verified."}, {status: 500}); }
    const products = (productRows || []) as StoreProductRow[];
    const validatedLines: ValidatedLine[] = [];
    const hasCouplesMembershipRequested = products.filter(isCouplesMembershipProduct).length === 1;
    for (const productId of productIds) {
      const product = products.find(row => row.id === productId);
      if (!product) return NextResponse.json({error: "One of the products in your basket is no longer available."}, {status: 400});
      if (product.is_active === false || product.status !== "active") return NextResponse.json({error: `${product.name} is no longer available.`}, {status: 400});
      if (blocksDirectCheckout(product)) {
        const sellingModel = getSellingModel(product);
        return NextResponse.json({error: sellingModel === "customisable" ? `${product.name} needs customisation details before it can be ordered.` : `${product.name} must be requested from the business before payment.`, sellingModel, requiresRequest: true}, {status: 400});
      }
      if (isSubscriptionProduct(product) && !getBillingInterval(product)) return NextResponse.json({error: `${product.name} is missing its subscription billing interval.`}, {status: 400});
      if (cleanString(product.external_system).toLowerCase() === "mtc" && isSubscriptionProduct(product) && (!cleanString(product.external_plan_code) || getBeneficiaryMode(product) === "none")) return NextResponse.json({error: `${product.name} is missing its membership integration setup.`}, {status: 400});
      const quantity = quantityByProduct.get(product.id) || 0;
      const available = getAvailableQuantity(product);
      if (available !== null && available < quantity) return NextResponse.json({error: available <= 0 ? `${product.name} is sold out.` : `Only ${available} of ${product.name} are currently available.`}, {status: 400});
      const submittedCustomPrice = customUnitPriceByProduct.get(product.id);
      if (submittedCustomPrice !== undefined && !supportsCustomUnitPrice(product)) return NextResponse.json({error: `${product.name} does not support a custom price.`}, {status: 400});
      let unitPrice = Number(product.price);
      if (supportsCustomUnitPrice(product)) {
        try {
          const customPrice = validateCustomUnitPrice(product, submittedCustomPrice);
          if (customPrice === null) throw new Error("Choose a donation amount.");
          unitPrice = customPrice;
        } catch (error) { return NextResponse.json({error: error instanceof Error ? error.message : "Choose a valid donation amount."}, {status: 400}); }
      } else if (hasCouplesMembershipRequested && isFamilyKidsAddonProduct(product)) unitPrice = getFamilyAddonUnitPrice(product);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) return NextResponse.json({error: `${product.name} does not currently have a valid checkout price.`}, {status: 400});
      validatedLines.push({product, quantity, unitPrice, total: moneyRound(unitPrice * quantity)});
    }
    if (!validatedLines.length) return NextResponse.json({error: "Your basket contains no available products."}, {status: 400});

    // MONTHLY BUSINESS SUPPORT: add setup before totals, order items and Stripe.
    // The helper validates the known product IDs, store, GBP prices and quantity.
    let isMonthlySupportCheckout = false;
    try {
      isMonthlySupportCheckout = await prepareMonthlySupportCheckout({
        lines: validatedLines, organisationId, storeSlug, currency: checkoutCurrency, discountCode: requestedDiscountCode,
        loadSetup: async () => {
          const {data, error} = await supabaseAdmin.from("store_products").select("*")
            .eq("organisation_id", organisationId).eq("id", MONTHLY_SUPPORT_SETUP_ID).maybeSingle();
          if (error) { console.error("[TOTS STORE] Support setup lookup failed:", error); throw new Error("The setup fee could not be verified. Please try again."); }
          return data ? data as StoreProductRow : null;
        },
      });
    } catch (error) { return NextResponse.json({error: error instanceof Error ? error.message : "The support package could not be verified."}, {status: 400, headers: {"Cache-Control": "no-store"}}); }

    // DETERMINE CHECKOUT TYPE
    const subscriptionLines = validatedLines.filter(line => isSubscriptionProduct(line.product));
    const oneOffLines = validatedLines.filter(line => !isSubscriptionProduct(line.product));
    if (subscriptionLines.length > 0 && oneOffLines.length > 0 && !isMonthlySupportCheckout) return NextResponse.json({error: "Subscription products and one-off products currently need to be purchased separately."}, {status: 400});
    const isSubscriptionCheckout = subscriptionLines.length > 0;

    // MTC FAMILY MEMBERSHIP CHECKOUT: existing exception remains in place.
    if (isSubscriptionCheckout) {
      const couplesLines = subscriptionLines.filter(line => isCouplesMembershipProduct(line.product));
      const familyKidsLines = subscriptionLines.filter(line => isFamilyKidsAddonProduct(line.product));
      const otherLines = subscriptionLines.filter(line => !isCouplesMembershipProduct(line.product) && !isFamilyKidsAddonProduct(line.product));
      const isFamilyCheckout = subscriptionLines.length > 1 && couplesLines.length === 1 && familyKidsLines.length === subscriptionLines.length - 1 && otherLines.length === 0;
      if (subscriptionLines.length > 1 && !isFamilyCheckout) return NextResponse.json({error: "Please purchase one membership at a time. The only exception is adding standard Kids memberships to a Couples membership."}, {status: 400});
      if (couplesLines.length > 1) return NextResponse.json({error: "Please purchase one Couples membership at a time."}, {status: 400});
      if (!isFamilyCheckout && subscriptionLines[0]?.quantity !== 1) return NextResponse.json({error: "Please purchase one subscription membership at a time."}, {status: 400});
      if (isFamilyCheckout && couplesLines[0]?.quantity !== 1) return NextResponse.json({error: "A family checkout must contain exactly one Couples membership."}, {status: 400});
    }

    const subtotal = moneyRound(validatedLines.reduce((sum, line) => sum + line.total, 0));
    let appliedDiscount: StoreDiscountRow | null = null;
    let discountAmount = 0;
    if (requestedDiscountCode) {
      try { const result = await validateDiscount({organisationId, code: requestedDiscountCode, subtotal}); appliedDiscount = result.discount; discountAmount = result.amount; }
      catch (error) { return NextResponse.json({error: error instanceof Error ? error.message : "This discount code could not be applied."}, {status: 400}); }
    }
    const requiresShipping = validatedLines.some(line => isPhysicalProduct(line.product));
    const shippingAmount = 0;
    const total = moneyRound(Math.max(0, subtotal - discountAmount + shippingAmount));
    if (total <= 0 && !isSubscriptionCheckout) return NextResponse.json({error: "The order total must be greater than £0 to use Stripe checkout."}, {status: 400});
    if (isSubscriptionCheckout && total <= 0 && !appliedDiscount) return NextResponse.json({error: "A £0 subscription checkout requires a valid discount."}, {status: 400});

    let customerName = cleanLimitedString(body.customer?.name, 200) || null;
    let customerEmail = cleanEmail(body.customer?.email).slice(0, 320) || null;
    let customerPhone = cleanLimitedString(body.customer?.phone, 50) || null;
    if (customerEmail && !isValidEmail(customerEmail)) return NextResponse.json({error: "Enter a valid customer email address."}, {status: 400});
    const orderNumber = generateOrderNumber();
    const sellingModels = Array.from(new Set(validatedLines.map(line => getSellingModel(line.product))));
    const {data: orderData, error: orderError} = await supabaseAdmin.from("store_orders").insert({
      organisation_id: organisationId, order_number: orderNumber, customer_name: customerName, customer_email: customerEmail, customer_phone: customerPhone,
      subtotal, discount_amount: discountAmount, shipping_amount: shippingAmount, total, currency: checkoutCurrency,
      payment_status: "pending", fulfilment_status: "new", shipping_address: null,
      discount_code: appliedDiscount?.code || null, discount_id: appliedDiscount?.id || null,
      stripe_account_id: connectedStripeAccountId, stripe_checkout_session_id: null, stripe_payment_intent_id: null, stripe_customer_id: null,
      checkout_completed_at: null, paid_at: null, updated_at: new Date().toISOString(),
    }).select("id,order_number").single();
    if (orderError || !orderData) { console.error("[TOTS STORE] Order creation failed:", orderError); return NextResponse.json({error: "Your order could not be created."}, {status: 500}); }
    createdOrderId = orderData.id;
    let validatedBeneficiaries: ValidatedBeneficiary[];
    try { validatedBeneficiaries = validateBeneficiaries({requestedBeneficiaries, validatedLines, organisationId, orderId: orderData.id}); }
    catch (error) {
      await deletePendingOrder(orderData.id); createdOrderId = null;
      return NextResponse.json({error: error instanceof Error ? error.message : "The membership details could not be validated."}, {status: 400});
    }
    const primaryAdult = validatedBeneficiaries.find(b => b.beneficiary_type === "adult" && b.is_primary === true);
    if (primaryAdult) {
      if (!customerName) customerName = `${primaryAdult.first_name} ${primaryAdult.last_name}`.trim();
      if (!customerEmail && primaryAdult.email) customerEmail = primaryAdult.email;
      if (!customerPhone && primaryAdult.phone) customerPhone = primaryAdult.phone;
    }
    if (customerName || customerEmail || customerPhone) {
      const {error} = await supabaseAdmin.from("store_orders").update({customer_name: customerName, customer_email: customerEmail, customer_phone: customerPhone, updated_at: new Date().toISOString()}).eq("id", orderData.id).eq("organisation_id", organisationId);
      if (error) console.warn("[TOTS STORE] Derived order customer details could not be saved:", error);
    }
    const orderItems = validatedLines.map(line => ({order_id: orderData.id, product_id: line.product.id, product_name: line.product.name, sku: line.product.sku, quantity: line.quantity, unit_price: line.unitPrice, total: line.total}));
    const {error: orderItemsError} = await supabaseAdmin.from("store_order_items").insert(orderItems);
    if (orderItemsError) { await deletePendingOrder(orderData.id); createdOrderId = null; return NextResponse.json({error: "Your order items could not be created."}, {status: 500}); }
    if (validatedBeneficiaries.length) {
      const {error} = await supabaseAdmin.from("store_order_beneficiaries").insert(validatedBeneficiaries);
      if (error) { console.error("[TOTS STORE] Order beneficiary creation failed:", error); await deletePendingOrder(orderData.id); createdOrderId = null; return NextResponse.json({error: "The membership member details could not be saved."}, {status: 500}); }
    }

    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const line of validatedLines) {
      if (isSubscriptionProduct(line.product)) {
        const recurringPriceId = await ensureRecurringStripePrice({product: line.product, stripeAccountId: connectedStripeAccountId, currency: checkoutCurrency});
        stripeLineItems.push({quantity: line.quantity, price: recurringPriceId});
        continue;
      }
      const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData = {name: line.product.name};
      if (line.product.description) productData.description = line.product.description.slice(0, 500);
      if (line.product.image_url?.startsWith("https://")) productData.images = [line.product.image_url];
      // Setup has NO recurring field: Stripe includes it on the initial invoice only.
      stripeLineItems.push({quantity: line.quantity, price_data: {currency: checkoutCurrency, unit_amount: priceToPence(line.unitPrice), product_data: productData}});
    }
    const baseUrl = getBaseUrl(req);
    const isMtcMembershipCheckout = isSubscriptionCheckout && subscriptionLines.length === 1 && subscriptionLines.every(line => isMtcMembershipProduct(line.product));
    const mtcMembershipUrl = "https://app.morayperformanceandwellbeing.com/membership";
    const successUrl = isMtcMembershipCheckout ? `${mtcMembershipUrl}?purchase=success&session_id={CHECKOUT_SESSION_ID}` : `${baseUrl}/shop/${encodeURIComponent(storeSlug)}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = isMtcMembershipCheckout ? `${mtcMembershipUrl}?purchase=cancelled` : `${baseUrl}/shop/${encodeURIComponent(storeSlug)}?checkout=cancelled`;
    const subscriptionProductIds = subscriptionLines.map(line => line.product.id).join(",");
    const subscriptionPlanCodes = subscriptionLines.map(line => cleanString(line.product.external_plan_code)).filter(Boolean).join(",");
    const normalisedAppliedDiscountCode = cleanString(appliedDiscount?.code).toUpperCase();
    // 1MONTH stays a once-only coupon. No altered billing-cycle anchor.
    // No beneficiary names/emails/phone numbers/child details go into metadata.
    const metadata: Record<string, string> = {
      order_id: orderData.id, order_number: orderData.order_number, organisation_id: organisationId,
      stripe_account_id: connectedStripeAccountId, store_slug: storeSlug, selling_models: sellingModels.join(","),
      requires_shipping: requiresShipping ? "true" : "false", discount_id: appliedDiscount?.id || "", discount_code: appliedDiscount?.code || "",
      discount_amount: discountAmount.toFixed(2), purchase_type: isSubscriptionCheckout ? "subscription" : "one_off",
      subscription_product_ids: subscriptionProductIds, external_plan_codes: subscriptionPlanCodes,
      has_beneficiaries: validatedBeneficiaries.length > 0 ? "true" : "false", beneficiary_count: String(validatedBeneficiaries.length),
      billing_anchor: "", billing_anchor_rule: "", introductory_discount: normalisedAppliedDiscountCode === "1MONTH" ? "true" : "false", tots_source: "store",
    };
    if (isMonthlySupportCheckout) {
      metadata.setup_product_id = MONTHLY_SUPPORT_SETUP_ID;
      metadata.setup_amount_pence = "14900";
      metadata.setup_charge_rule = "initial_invoice_only";
    }
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: isSubscriptionCheckout ? "subscription" : "payment", line_items: stripeLineItems, success_url: successUrl, cancel_url: cancelUrl,
      metadata, billing_address_collection: "auto", phone_number_collection: {enabled: true},
      ...(isSubscriptionCheckout ? {payment_method_collection: "always" as const} : {}),
    };
    if (customerEmail) sessionParams.customer_email = customerEmail;
    if (requiresShipping) sessionParams.shipping_address_collection = {allowed_countries: ["GB"]};
    if (isSubscriptionCheckout) sessionParams.subscription_data = {metadata};
    else sessionParams.payment_intent_data = {metadata};
    if (appliedDiscount && discountAmount > 0) {
      const discountValue = safeNumber(appliedDiscount.value, 0);
      const couponParams: Stripe.CouponCreateParams = {
        duration: "once", name: appliedDiscount.code,
        metadata: {tots_discount_id: appliedDiscount.id, tots_discount_code: appliedDiscount.code, organisation_id: organisationId, order_id: orderData.id, tots_source: "store"},
      };
      if (isPercentageDiscount(appliedDiscount.discount_type)) couponParams.percent_off = discountValue;
      else { couponParams.amount_off = priceToPence(discountAmount); couponParams.currency = checkoutCurrency; }
      const coupon = await stripe.coupons.create(couponParams, {stripeAccount: connectedStripeAccountId});
      createdCouponId = coupon.id;
      sessionParams.discounts = [{coupon: coupon.id}];
    }
    let session: Stripe.Checkout.Session;
    try { session = await stripe.checkout.sessions.create(sessionParams, {stripeAccount: connectedStripeAccountId}); stripeCheckoutCreated = true; }
    catch (error) {
      console.error("[TOTS STORE] Connected Stripe session creation failed:", error);
      await deletePendingOrder(orderData.id); createdOrderId = null;
      await deleteConnectedCoupon(createdCouponId, connectedStripeAccountId); createdCouponId = null;
      throw error;
    }
    if (!session.url) throw new Error("Stripe created the checkout but did not return a checkout URL.");
    const initialPaymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
    const initialStripeCustomerId = typeof session.customer === "string" ? session.customer : null;
    const initialSubscriptionId = typeof session.subscription === "string" ? session.subscription : null;
    const {error: stripeReferenceError} = await supabaseAdmin.from("store_orders").update({
      stripe_account_id: connectedStripeAccountId, stripe_checkout_session_id: session.id, stripe_payment_intent_id: initialPaymentIntentId,
      stripe_customer_id: initialStripeCustomerId, currency: checkoutCurrency, discount_id: appliedDiscount?.id || null,
      discount_code: appliedDiscount?.code || null, updated_at: new Date().toISOString(),
    }).eq("id", orderData.id).eq("organisation_id", organisationId);
    if (stripeReferenceError) console.error("[TOTS STORE] Stripe references could not be saved:", stripeReferenceError);
    console.log("[TOTS STORE] Connected checkout created:", {
      organisationId, stripeAccountId: connectedStripeAccountId, sessionId: session.id, paymentIntentId: initialPaymentIntentId,
      subscriptionId: initialSubscriptionId, orderId: orderData.id, orderNumber: orderData.order_number,
      purchaseType: isSubscriptionCheckout ? "subscription" : "one_off", beneficiaryCount: validatedBeneficiaries.length, total, currency: checkoutCurrency,
    });
    return NextResponse.json({
      success: true, checkoutUrl: session.url, sessionId: session.id, paymentIntentId: initialPaymentIntentId, subscriptionId: initialSubscriptionId,
      stripeAccountId: connectedStripeAccountId, orderId: orderData.id, orderNumber: orderData.order_number,
      purchaseType: isSubscriptionCheckout ? "subscription" : "one_off", sellingModels, requiresShipping, subtotal,
      discountCode: appliedDiscount?.code || null, discountAmount, shippingAmount, total, currency: checkoutCurrency,
      beneficiaryCount: validatedBeneficiaries.length, stripeReferencesSaved: !stripeReferenceError,
      ...(isMonthlySupportCheckout ? {setupAmount: 149, recurringAmount: 249, recurringInterval: "month", initialPaymentAmount: total} : {}),
    }, {status: 200, headers: {"Cache-Control": "no-store"}});
  } catch (error: unknown) {
    console.error("[TOTS STORE] Store checkout error:", error);
    if (createdOrderId && !stripeCheckoutCreated) await deletePendingOrder(createdOrderId);
    if (createdCouponId && connectedStripeAccountId && !stripeCheckoutCreated) await deleteConnectedCoupon(createdCouponId, connectedStripeAccountId);
    if (error instanceof Stripe.errors.StripeError) return NextResponse.json({
      error: error.message || "Stripe checkout could not be started.", stripeError: true, type: error.type, code: error.code || null,
      declineCode: error.decline_code || null, requestId: error.requestId || null,
    }, {status: error.statusCode && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500, headers: {"Cache-Control": "no-store"}});
    return NextResponse.json({error: error instanceof Error ? error.message : "Checkout could not be started."}, {status: 500, headers: {"Cache-Control": "no-store"}});
  }
}
