// lib/getLimits.ts
export function getLimits(plan: string) {
  if (plan === "free") return { customers: 10 };
  if (plan === "pro") return { customers: Infinity };
  if (plan === "enterprise")
    return {
      customers: Infinity,
      team: true,
      audit: true,
      notifications: true,
    };
}