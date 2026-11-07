import type { ClarityTourStep } from "./types";

/**
 * ORBI. onboarding tour. These are reconstructed steps because the original
 * tourRegistry.ts was absent from the supplied folder.
 * Use a stable, present DOM target (main) to avoid broken selector errors.
 */
export const CLARITY_TOUR_STEPS: ClarityTourStep[] = [
  {
    id: "dashboard",
    title: "Welcome to ORBI.",
    description: "Your business, all in one place. Start with your dashboard to see what's happening across your workspace.",
    route: "/dashboard",
    target: "main",
    placement: "center",
  },
  {
    id: "contacts",
    title: "Keep your contacts close",
    description: "Manage the people and businesses you work with from your CRM.",
    route: "/crm",
    target: "main",
    placement: "center",
  },
  {
    id: "projects",
    title: "Keep work moving",
    description: "Organise projects, tasks and progress in one workspace.",
    route: "/projects",
    target: "main",
    placement: "center",
  },
  {
    id: "calendar",
    title: "Plan your time",
    description: "See what's coming up and stay on top of your schedule.",
    route: "/calendar",
    target: "main",
    placement: "center",
  },
  {
    id: "payments",
    title: "Stay on top of finances",
    description: "Keep your invoices and business finances organised.",
    route: "/payments",
    target: "main",
    placement: "center",
  },
  {
    id: "settings",
    title: "Make ORBI. yours",
    description: "Adjust your workspace settings whenever you need to. You're ready to explore ORBI.",
    route: "/settings",
    target: "main",
    placement: "center",
  },
];
