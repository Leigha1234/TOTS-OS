// These IDs are the existing products in The Organised Types store.
export const MONTHLY_SUPPORT_PRODUCT_ID = "e6ac105a-5c61-4631-8604-34f15b4a574b";
export const MONTHLY_SUPPORT_SETUP_ID = "80e3c2f7-6981-4684-aa6e-a03e8157ce53";

type SupportProduct = {
  id: string;
  organisation_id: string;
  price: number | string;
  purchase_type: string | null;
  billing_interval: string | null;
  selling_model: string | null;
  beneficiary_mode: string | null;
  external_system: string | null;
  is_active: boolean;
  status: string;
  track_inventory: boolean;
};

type SupportLine<T extends SupportProduct> = {
  product: T;
  quantity: number;
  unitPrice: number;
  total: number;
};

/**
 * Only alters the existing Monthly Business Support checkout.
 * All prices come from server-loaded products. No database writes here.
 * Adds setup before totals, order items and Stripe line items are built.
 * Setup is charged on the initial invoice of each NEW subscription;
 * this does not implement a lifetime fee waiver for returning customers.
 */
export async function prepareMonthlySupportCheckout<T extends SupportProduct>({
  lines,
  organisationId,
  storeSlug,
  currency,
  discountCode,
  loadSetup,
}: {
  lines: SupportLine<T>[];
  organisationId: string;
  storeSlug: string;
  currency: string;
  discountCode: string;
  loadSetup: () => Promise<T | null>;
}): Promise<boolean> {
  const supportLines = lines.filter(line => line.product.id === MONTHLY_SUPPORT_PRODUCT_ID);
  const setupLines = lines.filter(line => line.product.id === MONTHLY_SUPPORT_SETUP_ID);

  if (!supportLines.length) {
    if (setupLines.length) {
      throw new Error("The setup fee can only be purchased with Monthly Business Support.");
    }
    return false;
  }

  if (storeSlug !== "the-organised-types") {
    throw new Error("Monthly Business Support must be purchased from The Organised Types store.");
  }
  if (currency.toLowerCase() !== "gbp") {
    throw new Error("Monthly Business Support must be billed in GBP.");
  }
  if (supportLines.length !== 1 || supportLines[0].quantity !== 1) {
    throw new Error("Please purchase one Monthly Business Support package at a time.");
  }
  if (lines.some(line => ![MONTHLY_SUPPORT_PRODUCT_ID, MONTHLY_SUPPORT_SETUP_ID].includes(line.product.id))) {
    throw new Error("Please purchase Monthly Business Support separately from other products.");
  }
  if (discountCode.trim()) {
    throw new Error("Discount codes do not apply to Monthly Business Support.");
  }

  const support = supportLines[0];
  if (
    support.product.organisation_id !== organisationId ||
    support.product.is_active !== true || support.product.status !== "active" ||
    support.product.purchase_type !== "subscription" ||
    support.product.billing_interval !== "month" ||
    support.product.selling_model !== "service" ||
    support.product.beneficiary_mode !== "none" ||
    Boolean(support.product.external_system?.trim()) ||
    Number(support.product.price) !== 249 ||
    support.unitPrice !== 249 || support.total !== 249 ||
    support.product.track_inventory !== false
  ) {
    throw new Error("The Monthly Business Support product configuration needs checking.");
  }
  if (setupLines.length > 1 || (setupLines.length === 1 && setupLines[0].quantity !== 1)) {
    throw new Error("The setup fee must be charged exactly once per new subscription.");
  }

  // Always reload by ID and organisation in the caller, even if the browser
  // already included setup. A draft/archived product cannot be charged.
  const setup = await loadSetup();
  if (
    !setup || setup.id !== MONTHLY_SUPPORT_SETUP_ID ||
    setup.organisation_id !== organisationId ||
    setup.is_active !== true || setup.status !== "active" ||
    setup.purchase_type !== "one_off" || setup.billing_interval !== null ||
    setup.selling_model !== "service" || setup.beneficiary_mode !== "none" ||
    Boolean(setup.external_system?.trim()) ||
    setup.track_inventory !== false || Number(setup.price) !== 149
  ) {
    throw new Error("The £149 setup product is unavailable or needs configuring. Please contact the business.");
  }

  // All validation completes before mutating the supplied lines.
  if (setupLines.length) {
    const existing = setupLines[0];
    existing.product = setup;
    existing.unitPrice = 149;
    existing.total = 149;
  } else {
    lines.push({product: setup, quantity: 1, unitPrice: 149, total: 149});
  }
  return true;
}
