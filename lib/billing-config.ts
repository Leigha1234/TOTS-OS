// ======================================================
// TOTS-OS BILLING CONFIG
// ======================================================
//
// All monetary amounts are stored in PENCE.
//
// £29  = 2900
// £55  = 5500
// £79  = 7900
// £99  = 9900
// £119 = 11900
// £139 = 13900
//
// ======================================================

// ======================================================
// COMPLETE
// ======================================================

export const COMPLETE_PRICE =
  13900;

// ======================================================
// MODULE BUNDLE PRICING
// ======================================================
//
// Rather than percentage discounts, TOTS-OS now uses
// simple fixed bundle pricing:
//
// 1 module  = £29
// 2 modules = £55
// 3 modules = £79
// 4 modules = £99
// 5 modules = £119
// 6 modules = Complete £139
//
// Complete also includes Clarity AI Starter.
//
// ======================================================

export const MODULE_BUNDLE_PRICES = {
  1: 2900,
  2: 5500,
  3: 7900,
  4: 9900,
  5: 11900,
  6: 13900,
} as const;

// ======================================================
// MAIN MODULE KEYS
// ======================================================

export const MAIN_MODULE_KEYS = [
  "core",
  "clientsProjects",
  "finance",
  "social",
  "email",
  "store",
] as const;

export type ModuleKey =
  (typeof MAIN_MODULE_KEYS)[number];

// ======================================================
// PRODUCTS
// ======================================================

export const BILLING_PRODUCTS = {
  // ====================================================
  // CORE
  // ====================================================

  core: {
    key: "core",
    name: "TOTS-OS Core",
    amount: 2900,
  },

  // ====================================================
  // CLIENTS & PROJECTS
  // ====================================================

  clientsProjects: {
    key: "clientsProjects",
    name: "TOTS-OS Clients & Projects",
    amount: 2900,
  },

  // ====================================================
  // FINANCE
  // ====================================================

  finance: {
    key: "finance",
    name: "TOTS-OS Finance",
    amount: 2900,
  },

  // ====================================================
  // SOCIAL STUDIO
  // ====================================================

  social: {
    key: "social",
    name: "TOTS-OS Social Studio",
    amount: 2900,
  },

  // ====================================================
  // EMAIL MARKETING
  // ====================================================

  email: {
    key: "email",
    name: "TOTS-OS Email Marketing",
    amount: 2900,
  },

  // ====================================================
  // STORE
  // ====================================================

  store: {
    key: "store",
    name: "TOTS-OS Store",
    amount: 2900,
  },

  // ====================================================
  // CLARITY AI
  // ====================================================

  aiStarter: {
    key: "aiStarter",
    name: "Clarity AI Starter",
    amount: 1900,
  },

  aiPlus: {
    key: "aiPlus",
    name: "Clarity AI Plus",
    amount: 3900,
  },

  aiPro: {
    key: "aiPro",
    name: "Clarity AI Pro",
    amount: 6900,
  },

  // ====================================================
  // COMPLETE
  // ====================================================

  complete: {
    key: "complete",
    name: "TOTS-OS Complete",
    amount: COMPLETE_PRICE,
  },
} as const;

// ======================================================
// TYPES
// ======================================================

export type BillingProductKey =
  keyof typeof BILLING_PRODUCTS;

export type AiTierKey =
  | "none"
  | "starter"
  | "plus"
  | "pro";

// ======================================================
// BUNDLE PRICE HELPER
// ======================================================

export function getModuleBundlePrice(
  moduleCount: number,
) {
  if (moduleCount <= 0) {
    return 0;
  }

  if (moduleCount >= 6) {
    return COMPLETE_PRICE;
  }

  return MODULE_BUNDLE_PRICES[
    moduleCount as
      | 1
      | 2
      | 3
      | 4
      | 5
  ];
}

// ======================================================
// FORMAT PRICE
// ======================================================

export function formatBillingPrice(
  amountInPence: number,
) {
  const pounds =
    amountInPence / 100;

  return `£${pounds.toFixed(
    Number.isInteger(pounds)
      ? 0
      : 2,
  )}`;
}