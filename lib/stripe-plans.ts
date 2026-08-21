export type StripeTierName =
  | "Standard"
  | "Professional"
  | "Elite";

export function getStripePlan(tier: string) {
  const normalised = tier.trim().toLowerCase();

  switch (normalised) {
    case "standard":
      return {
        name: "Standard" as const,
        priceId: process.env.STRIPE_PRICE_STANDARD,
      };

    case "professional":
      return {
        name: "Professional" as const,
        priceId: process.env.STRIPE_PRICE_PROFESSIONAL,
      };

    case "elite":
      return {
        name: "Elite" as const,
        priceId: process.env.STRIPE_PRICE_ELITE,
      };

    default:
      return null;
  }
}