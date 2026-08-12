import type { ClarityTourStep } from "./types";

export const CLARITY_TOUR_STEPS: ClarityTourStep[] = [
  {
    id: "dashboard-welcome",
    route: "/dashboard",
    target: "[data-tour='dashboard-header']",
    title: "Welcome to TOTS-OS",
    description:
      "This is your main workspace. From here you can see what is happening across your business and quickly jump into the areas that need your attention.",
    placement: "bottom",
  },

  {
    id: "dashboard-overview",
    route: "/dashboard",
    target: "[data-tour='dashboard-overview']",
    title: "Your business at a glance",
    description:
      "These cards give you a quick overview of activity across your workspace, helping you see what needs attention without opening every section.",
    placement: "bottom",
  },

  {
    id: "dashboard-navigation",
    route: "/dashboard",
    target: "[data-tour='dashboard-navigation']",
    title: "Move around your workspace",
    description:
      "Use the main navigation to move between your CRM, projects, calendar, finance, campaigns, socials and the rest of TOTS-OS.",
    placement: "right",
  },

  {
    id: "crm-welcome",
    route: "/crm",
    target: "[data-tour='crm-header']",
    title: "Your CRM",
    description:
      "This is where you keep the people and organisations behind your business relationships organised in one place.",
    placement: "bottom",
  },

  {
    id: "projects-welcome",
    route: "/projects",
    target: "[data-tour='projects-header']",
    title: "Projects & tasks",
    description:
      "Turn ideas into projects, organise the work involved and keep track of what needs to happen next.",
    placement: "bottom",
  },

  {
    id: "calendar-welcome",
    route: "/calendar",
    target: "[data-tour='calendar-header']",
    title: "Your business calendar",
    description:
      "Keep deadlines, events and important dates visible alongside everything else happening in your business.",
    placement: "bottom",
  },

  {
    id: "finance-welcome",
    route: "/payments",
    target: "[data-tour='finance-header']",
    title: "Your finances",
    description:
      "Track invoices, expenses, tax information, payroll and other financial activity from one connected area.",
    placement: "bottom",
  },

  {
    id: "campaigns-welcome",
    route: "/campaigns",
    target: "[data-tour='campaigns-header']",
    title: "Campaigns",
    description:
      "Build email campaigns, manage subscriber lists, schedule sends and keep an eye on campaign performance.",
    placement: "bottom",
  },

  {
    id: "settings-welcome",
    route: "/settings",
    target: "[data-tour='settings-header']",
    title: "Make TOTS-OS yours",
    description:
      "Manage your profile, company branding, connected accounts and account settings here.",
    placement: "bottom",
  },
];