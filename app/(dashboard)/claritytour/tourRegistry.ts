import type { ClarityTourStep } from "./types";

/*
 * =========================================================
 * CLARITY TOUR
 * =========================================================
 *
 * Each step contains:
 *
 * id
 *   Permanent identifier stored against the user's profile.
 *   Avoid changing these once users have started onboarding.
 *
 * route
 *   Dashboard page Clarity should navigate to.
 *
 * target
 *   data-tour selector that Clarity will try to highlight.
 *
 * title / description
 *   User-facing onboarding copy.
 *
 * placement
 *   Preferred location of the Clarity card.
 *
 * IMPORTANT:
 * A missing target does NOT break the tour.
 * The overlay will display the step as a centred Clarity card.
 *
 * =========================================================
 */

export const CLARITY_TOUR_STEPS: ClarityTourStep[] = [
  /*
   * =====================================================
   * CHAPTER 01
   * WELCOME / ORIENTATION
   * =====================================================
   */

  {
    id: "welcome-to-tots-os",
    route: "/dashboard",
    target: "[data-tour='dashboard-content']",
    title: "Welcome to TOTS-OS.",
    description:
      "This is your business operating system. Clarity will walk you through the full workspace and show practical ways to use each area from day one.",
    placement: "center",
  },

  {
    id: "dashboard-navigation",
    route: "/dashboard",
    target: "[data-tour='dashboard-navigation']",
    title: "Everything starts here.",
    description:
      "Your navigation is your control panel. Tip: keep Home, Calendar and one work area pinned in mobile navigation so your most-used routes are always one tap away.",
    placement: "right",
  },

  {
    id: "mobile-navigation",
    route: "/dashboard",
    target: "[data-tour='mobile-navigation']",
    title: "Mobile navigation and quick access.",
    description:
      "On mobile, use the bottom bar for your core routes and the More menu for everything else. Tip: revisit Settings to tune your pinned mobile links as your workflow changes.",
    placement: "top",
  },

  {
    id: "mobile-system-menu",
    route: "/dashboard",
    target: "[data-tour='mobile-system-menu']",
    title: "Full mobile system menu.",
    description:
      "This grid mirrors your workspace sections. Tip: treat this as your map when onboarding teammates so everyone learns the same route names.",
    placement: "top",
  },

  {
    id: "dashboard-overview",
    route: "/dashboard",
    target: "[data-tour='dashboard-content']",
    title: "Your business at a glance.",
    description:
      "Your dashboard is your daily launchpad for priorities, workload and health. Tip: start each day here before opening any feature screens.",
    placement: "bottom",
  },

  {
    id: "dashboard-actions",
    route: "/dashboard",
    target: "[data-tour='dashboard-content']",
    title: "Get things done faster.",
    description:
      "Use quick actions to create momentum fast. Tip: add a task, note and event in one pass to build a complete execution trail for the day.",
    placement: "bottom",
  },

  {
    id: "dashboard-clarity-widget",
    route: "/dashboard",
    target: "[data-tour='dashboard-content']",
    title: "Use Clarity as your operator assistant.",
    description:
      "Clarity can summarize priorities, spot risk and give action prompts from your live workspace context. Tip: ask for a daily brief after major updates.",
    placement: "center",
  },

  /*
   * =====================================================
   * CHAPTER 02
   * CRM
   * =====================================================
   */

  {
    id: "crm-introduction",
    route: "/crm",
    target: "[data-tour='dashboard-content']",
    title: "Meet your CRM.",
    description:
      "This is where people and business relationships live. Tip: keep contact records complete so projects, notes and communication history are easier to search later.",
    placement: "bottom",
  },

  {
    id: "crm-contacts",
    route: "/crm",
    target: "[data-tour='dashboard-content']",
    title: "Keep every relationship organised.",
    description:
      "Contacts become your single source of truth for clients, leads and collaborators. Tip: use consistent naming to improve global search quality.",
    placement: "right",
  },

  {
    id: "crm-add-contact",
    route: "/crm",
    target: "[data-tour='dashboard-content']",
    title: "Add your first contact.",
    description:
      "Add at least one real contact now to anchor your workflow. Tip: link contacts to projects early so timelines and communication stay connected.",
    placement: "bottom",
  },

  {
    id: "crm-organisations",
    route: "/crm",
    target: "[data-tour='dashboard-content']",
    title: "Connect people to organisations.",
    description:
      "Organisations keep company-level relationships structured. Tip: group contacts by organisation before campaign work to reduce list cleanup later.",
    placement: "bottom",
  },

  {
    id: "crm-tips-and-tricks",
    route: "/crm",
    target: "[data-tour='dashboard-content']",
    title: "CRM tips and tricks.",
    description:
      "Tip 1: standardize tags and status names. Tip 2: update notes after every key conversation. Tip 3: review stale contacts weekly so your pipeline stays accurate.",
    placement: "center",
  },

  /*
   * =====================================================
   * CHAPTER 03
   * PROJECTS
   * =====================================================
   */

  {
    id: "projects-introduction",
    route: "/projects",
    target: "[data-tour='dashboard-content']",
    title: "Turn ideas into organised work.",
    description:
      "Projects give every initiative a clear home. Tip: create projects around outcomes, then add tasks for milestones and execution steps.",
    placement: "bottom",
  },

  {
    id: "projects-board",
    route: "/projects",
    target: "[data-tour='dashboard-content']",
    title: "See work moving.",
    description:
      "Track movement from planned to done so nothing disappears. Tip: do a quick board sweep at the end of each day to keep statuses reliable.",
    placement: "top",
  },

  {
    id: "projects-create",
    route: "/projects",
    target: "[data-tour='dashboard-content']",
    title: "Create your first project.",
    description:
      "Create one real project to establish your process baseline. Tip: include target date and owner from the start to avoid orphaned work.",
    placement: "bottom",
  },

  {
    id: "projects-tasks",
    route: "/projects",
    target: "[data-tour='dashboard-content']",
    title: "Break the work down.",
    description:
      "Tasks turn project goals into clear next actions. Tip: name tasks with verbs and outcomes so assignment and handoff are effortless.",
    placement: "right",
  },

  {
    id: "projects-tips-and-tricks",
    route: "/projects",
    target: "[data-tour='dashboard-content']",
    title: "Project delivery tips.",
    description:
      "Tip 1: cap active tasks per project. Tip 2: set weekly review checkpoints. Tip 3: link decisions to notes so context never gets lost.",
    placement: "center",
  },

  /*
   * =====================================================
   * CHAPTER 04
   * CALENDAR
   * =====================================================
   */

  {
    id: "calendar-introduction",
    route: "/calendar",
    target: "[data-tour='dashboard-content']",
    title: "See what's coming.",
    description:
      "Your calendar gives deadlines, events and planning windows one connected view. Tip: use it as your operations calendar, not just a meetings list.",
    placement: "bottom",
  },

  {
    id: "calendar-main",
    route: "/calendar",
    target: "[data-tour='dashboard-content']",
    title: "Plan around the whole business.",
    description:
      "Plan delivery, campaigns and finance dates together. Tip: reserve focus blocks before your week fills with reactive work.",
    placement: "top",
  },

  {
    id: "calendar-add-event",
    route: "/calendar",
    target: "[data-tour='dashboard-content']",
    title: "Add something important.",
    description:
      "Add a real deadline or milestone now. Tip: include enough detail in titles to understand context from quick glance views.",
    placement: "bottom",
  },

  {
    id: "calendar-tips-and-tricks",
    route: "/calendar",
    target: "[data-tour='dashboard-content']",
    title: "Calendar tips.",
    description:
      "Tip 1: schedule recurring planning reviews. Tip 2: block prep time before major meetings. Tip 3: mirror key project due dates in calendar.",
    placement: "center",
  },

  /*
   * =====================================================
   * CHAPTER 05
   * NOTES
   * =====================================================
   */

  {
    id: "notes-introduction",
    route: "/notes",
    target: "[data-tour='dashboard-content']",
    title: "Give every idea somewhere to land.",
    description:
      "Capture ideas, meeting outcomes and drafts here. Tip: if something might matter in two weeks, store it in Notes now.",
    placement: "bottom",
  },

  {
    id: "notes-workspace",
    route: "/notes",
    target: "[data-tour='dashboard-content']",
    title: "Capture first. Organise second.",
    description:
      "Capture quickly, then sort when convenient. Tip: convert high-value notes into tasks or project updates during your weekly review.",
    placement: "top",
  },

  {
    id: "notes-create",
    route: "/notes",
    target: "[data-tour='dashboard-content']",
    title: "Capture your first note.",
    description:
      "Add one real note from your current workload. Tip: start note titles with a keyword like CLIENT, IDEA or DECISION for fast scanning.",
    placement: "bottom",
  },

  {
    id: "notes-tips-and-tricks",
    route: "/notes",
    target: "[data-tour='dashboard-content']",
    title: "Notes tips.",
    description:
      "Tip 1: keep one running weekly ops note. Tip 2: add date prefixes for chronology. Tip 3: move actionable lines into tasks immediately.",
    placement: "center",
  },

  /*
   * =====================================================
   * CHAPTER 06
   * CAMPAIGNS
   * =====================================================
   */

  {
    id: "campaigns-introduction",
    route: "/campaigns",
    target: "[data-tour='dashboard-content']",
    title: "Build campaigns without leaving your system.",
    description:
      "Build and monitor campaigns in the same workspace as delivery and finance. Tip: connect campaign goals to project milestones for full visibility.",
    placement: "bottom",
  },

  {
    id: "campaigns-lists",
    route: "/campaigns",
    target: "[data-tour='dashboard-content']",
    title: "Start with your audience.",
    description:
      "Audience quality determines campaign quality. Tip: build lists by intent, not just demographics, to improve relevance and response.",
    placement: "left",
  },

  {
    id: "campaigns-create-list",
    route: "/campaigns",
    target: "[data-tour='dashboard-content']",
    title: "Create your first list.",
    description:
      "Create one list before sending your first campaign. Tip: define list naming conventions now so reporting stays clean later.",
    placement: "left",
  },

  {
    id: "campaigns-create",
    route: "/campaigns",
    target: "[data-tour='dashboard-content']",
    title: "Create something worth opening.",
    description:
      "Build useful, clear messages that support real business goals. Tip: write one primary call to action per campaign.",
    placement: "bottom",
  },

  {
    id: "campaigns-performance",
    route: "/campaigns",
    target: "[data-tour='dashboard-content']",
    title: "Know what happened after send.",
    description:
      "Track outcomes after every send. Tip: record learnings in Notes after each campaign to improve the next one quickly.",
    placement: "top",
  },

  {
    id: "campaigns-tips-and-tricks",
    route: "/campaigns",
    target: "[data-tour='dashboard-content']",
    title: "Campaign workflow tips.",
    description:
      "Tip 1: test subject lines. Tip 2: segment before sending. Tip 3: review performance in a fixed weekly slot so learning compounds.",
    placement: "center",
  },

  /*
   * =====================================================
   * CHAPTER 07
   * SOCIAL
   * =====================================================
   */

  {
    id: "social-introduction",
    route: "/social",
    target: "[data-tour='dashboard-content']",
    title: "Bring social into the same workspace.",
    description:
      "Plan social where strategy, delivery and reporting already live. Tip: batch content creation and schedule review blocks in Calendar.",
    placement: "bottom",
  },

  {
    id: "social-planner",
    route: "/social",
    target: "[data-tour='dashboard-content']",
    title: "Plan before you publish.",
    description:
      "Use the planner to keep publishing aligned with launches and client activity. Tip: plan around business milestones, not random posting cadence.",
    placement: "top",
  },

  {
    id: "social-create",
    route: "/social",
    target: "[data-tour='dashboard-content']",
    title: "Create your next post.",
    description:
      "Build posts and reuse ideas across channels intentionally. Tip: keep one content pillar list in Notes for faster drafting.",
    placement: "bottom",
  },

  {
    id: "social-tips-and-tricks",
    route: "/social",
    target: "[data-tour='dashboard-content']",
    title: "Social tips.",
    description:
      "Tip 1: work in weekly content themes. Tip 2: repurpose top performers. Tip 3: track response patterns to improve posting windows.",
    placement: "center",
  },

  /*
   * =====================================================
   * CHAPTER 08
   * FINANCE
   * =====================================================
   */

  {
    id: "finance-introduction",
    route: "/payments",
    target: "[data-tour='dashboard-content']",
    title: "Know the financial picture.",
    description:
      "Finance centralizes invoices, quotes, expenses and visibility into money flow. Tip: reconcile activity weekly to keep decisions grounded in current numbers.",
    placement: "bottom",
  },

  {
    id: "finance-overview",
    route: "/payments",
    target: "[data-tour='dashboard-content']",
    title: "Start with the overview.",
    description:
      "Use overview for trend and health checks before taking action. Tip: review outstanding invoices before approving new spend.",
    placement: "top",
  },

  {
    id: "finance-sales",
    route: "/payments",
    target: "[data-tour='dashboard-content']",
    title: "Track money coming in.",
    description:
      "Sales covers invoices, quotes and recurring billing. Tip: create quotes quickly and convert to invoice as soon as scope is approved.",
    placement: "bottom",
  },

  {
    id: "finance-expenses",
    route: "/payments",
    target: "[data-tour='dashboard-content']",
    title: "Keep costs visible.",
    description:
      "Log expenses with receipts as you go. Tip: upload the receipt immediately to avoid end-of-month document hunts.",
    placement: "bottom",
  },

  {
    id: "finance-tax",
    route: "/payments",
    target: "[data-tour='dashboard-content']",
    title: "Keep tax on the radar.",
    description:
      "Tax, payroll and timesheets are currently in staged rollout. Tip: use the available finance areas now and keep these sections monitored for release updates.",
    placement: "bottom",
  },

  {
    id: "finance-reports-introduction",
    route: "/finance-reports",
    target: "[data-tour='dashboard-content']",
    title: "Finance reports and analysis.",
    description:
      "Use finance reporting views to inspect trends and decision signals. Tip: compare report periods on the same weekday each week for stable insights.",
    placement: "center",
  },

  {
    id: "reports-introduction",
    route: "/reports",
    target: "[data-tour='dashboard-content']",
    title: "Operational reports.",
    description:
      "Reports help you review performance beyond day-to-day activity. Tip: pair report findings with action items in Projects to close the loop.",
    placement: "center",
  },

  {
    id: "timesheets-introduction",
    route: "/timesheets",
    target: "[data-tour='dashboard-content']",
    title: "Timesheets and effort tracking.",
    description:
      "Timesheets support visibility into effort and utilization. Tip: log time close to real time for more accurate delivery and cost forecasting.",
    placement: "center",
  },

  {
    id: "manage-subscription-introduction",
    route: "/manage-subscription",
    target: "[data-tour='dashboard-content']",
    title: "Manage your subscription.",
    description:
      "Use subscription management for billing controls and plan updates. Tip: review limits before large onboarding or campaign pushes.",
    placement: "center",
  },

  {
    id: "vault-introduction",
    route: "/vault",
    target: "[data-tour='dashboard-content']",
    title: "Secure workspace with Vault.",
    description:
      "Vault is designed for sensitive business records and protected content. Tip: store high-risk documents here and keep naming conventions strict.",
    placement: "center",
  },

  {
    id: "clarity-page-introduction",
    route: "/clarity",
    target: "[data-tour='dashboard-content']",
    title: "Full Clarity workspace.",
    description:
      "Use the dedicated Clarity page for deeper conversations and analysis. Tip: ask Clarity for weekly summaries and next-action lists.",
    placement: "center",
  },

  /*
   * =====================================================
   * CHAPTER 09
   * SETTINGS / BRAND SETUP
   * =====================================================
   */

  {
    id: "settings-introduction",
    route: "/settings",
    target: "[data-tour='dashboard-content']",
    title: "Make TOTS-OS feel like your business.",
    description:
      "Settings personalizes the workspace and controls key defaults. Tip: finalize profile, branding and navigation preferences early to reduce friction everywhere else.",
    placement: "bottom",
  },

  {
    id: "settings-profile",
    route: "/settings",
    target: "[data-tour='dashboard-content']",
    title: "Tell TOTS-OS who you are.",
    description:
      "Keep profile details accurate so generated outputs and account context remain reliable.",
    placement: "bottom",
  },

  {
    id: "settings-logo",
    route: "/settings",
    target: "[data-tour='dashboard-content']",
    title: "Bring your brand into the system.",
    description:
      "Upload your logo and brand assets once, then reuse across outputs. Tip: use high-contrast logo variants for email and document clarity.",
    placement: "right",
  },

  {
    id: "settings-social-connections",
    route: "/settings",
    target: "[data-tour='dashboard-content']",
    title: "Connect the platforms you use.",
    description:
      "Connect platform integrations to reduce app switching. Tip: test each connection with a small publish flow before full rollout.",
    placement: "top",
  },

  {
    id: "settings-security",
    route: "/settings",
    target: "[data-tour='dashboard-content']",
    title: "Keep your account secure.",
    description:
      "Review password and security settings regularly. Tip: update credentials and access policies during monthly operations reviews.",
    placement: "top",
  },

  {
    id: "settings-tips-and-tricks",
    route: "/settings",
    target: "[data-tour='dashboard-content']",
    title: "Settings tips.",
    description:
      "Tip 1: keep defaults aligned with your current process. Tip 2: clean up old integrations. Tip 3: standardize workspace naming before team growth.",
    placement: "center",
  },

  /*
   * =====================================================
   * CHAPTER 10
   * GLOBAL NAV QUICK LINKS
   * =====================================================
   */

  {
    id: "nav-home-shortcut",
    route: "/dashboard",
    target: "[data-tour='nav-home']",
    title: "Quick link: Home.",
    description:
      "Home is your daily control center. Tip: return here after every focused session to reset priorities.",
    placement: "left",
  },

  {
    id: "nav-calendar-shortcut",
    route: "/dashboard",
    target: "[data-tour='nav-calendar']",
    title: "Quick link: Calendar.",
    description:
      "Jump to Calendar to manage timing and workload sequencing.",
    placement: "left",
  },

  {
    id: "nav-contacts-shortcut",
    route: "/dashboard",
    target: "[data-tour='nav-contacts']",
    title: "Quick link: Contacts.",
    description:
      "Jump to Contacts for relationship and stakeholder updates.",
    placement: "left",
  },

  {
    id: "nav-notes-shortcut",
    route: "/dashboard",
    target: "[data-tour='nav-notes']",
    title: "Quick link: Notes.",
    description:
      "Jump to Notes when you need to capture or retrieve context quickly.",
    placement: "left",
  },

  {
    id: "nav-campaigns-shortcut",
    route: "/dashboard",
    target: "[data-tour='nav-campaigns']",
    title: "Quick link: Campaigns.",
    description:
      "Jump to Campaigns to create and review outbound communications.",
    placement: "left",
  },

  {
    id: "nav-projects-shortcut",
    route: "/dashboard",
    target: "[data-tour='nav-projects']",
    title: "Quick link: Projects.",
    description:
      "Jump to Projects to turn plans into clear execution.",
    placement: "left",
  },

  {
    id: "nav-social-shortcut",
    route: "/dashboard",
    target: "[data-tour='nav-social']",
    title: "Quick link: Social.",
    description:
      "Jump to Social for planning and publishing workflow.",
    placement: "left",
  },

  {
    id: "nav-settings-shortcut",
    route: "/dashboard",
    target: "[data-tour='nav-settings']",
    title: "Quick link: Settings.",
    description:
      "Jump to Settings for workspace controls and integration health checks.",
    placement: "left",
  },

  /*
   * =====================================================
   * FINAL STEP
   * =====================================================
   */

  {
    id: "tour-complete",
    route: "/dashboard",
    target: "[data-tour='dashboard-content']",
    title: "Your workspace is ready.",
    description:
      "You now have a full walkthrough of the current TOTS-OS flow. Next step: add one real contact, one project, one note, one event and one expense to activate the full operating loop.",
    placement: "center",
  },
];