// Shared checkout/fulfilment mapping. Only verified MTC product IDs are fallbacks.
export const MTC_CREDIT_ORGANISATION_ID = "2c96d537-2be4-4917-8982-e7491300f15f";

const CREDITS_PER_UNIT: Readonly<Record<string, number>> = {
  "MTC-WALK-IN": 1,
  "MTC-HYROX-BEGINNER-4WK": 8,
  "MTC-CROSSFIT-BEGINNER-4WK": 8,
  "MTC-MUMFIT-BEGINNER-4WK": 8,
};
const VERIFIED_PRODUCT_SKUS: Readonly<Record<string, string>> = {
  "12bf7bde-b8a8-4c21-bddd-66569ca5b203": "MTC-CROSSFIT-BEGINNER-4WK",
  "b130b411-5cd6-421b-9a8d-6a61ed122e03": "MTC-HYROX-BEGINNER-4WK",
};

export function resolveMtcCreditSku(input: {
  organisationId: string;
  productId: string | null;
  sku: string | null;
}): string | null {
  if (input.organisationId !== MTC_CREDIT_ORGANISATION_ID) return null;
  const supplied = input.sku?.trim().toUpperCase() || "";
  const known = input.productId && Object.prototype.hasOwnProperty.call(VERIFIED_PRODUCT_SKUS, input.productId)
    ? VERIFIED_PRODUCT_SKUS[input.productId] : undefined;
  if (known && supplied && supplied !== known) {
    throw new Error(`MTC credit product ${input.productId} has a conflicting SKU.`);
  }
  const resolved = supplied || known;
  return resolved && Object.hasOwn(CREDITS_PER_UNIT, resolved) ? resolved : null;
}

export function expectedMtcCredits(sku: string, quantity: number): number {
  const perUnit = Object.hasOwn(CREDITS_PER_UNIT, sku) ? CREDITS_PER_UNIT[sku] : undefined;
  const total = (perUnit ?? 0) * quantity;
  if (!perUnit || !Number.isSafeInteger(quantity) || quantity <= 0 || !Number.isSafeInteger(total)) {
    throw new Error("Invalid MTC credit SKU or quantity.");
  }
  return total;
}
