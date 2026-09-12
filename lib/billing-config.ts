export const COMPLETE_PRICE = 19900;

export const BILLING_PRODUCTS = {
  core: {
    key: "core",
    name: "TOTS-OS Core",
    amount: 3900,
  },

  clientsProjects: {
    key: "clientsProjects",
    name: "TOTS-OS Clients & Projects",
    amount: 4900,
  },

  finance: {
    key: "finance",
    name: "TOTS-OS Finance",
    amount: 4900,
  },

  social: {
    key: "social",
    name: "TOTS-OS Social Studio",
    amount: 4900,
  },

  email: {
    key: "email",
    name: "TOTS-OS Email Marketing",
    amount: 3900,
  },

  store: {
    key: "store",
    name: "TOTS-OS Store",
    amount: 3900,
  },

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

  complete: {
    key: "complete",
    name: "TOTS-OS Complete",
    amount: 19900,
  },
} as const;

export type BillingProductKey =
  keyof typeof BILLING_PRODUCTS;