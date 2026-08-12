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
      "This is your business operating system. Clarity will show you around, help you set things up and explain how each part of your workspace fits together.",
    placement: "center",
  },

  {
    id: "dashboard-navigation",
    route: "/dashboard",
    target: "[data-tour='dashboard-navigation']",
    title: "Everything starts here.",
    description:
      "Your main navigation gives you access to every part of TOTS-OS. Clients, projects, planning, campaigns and the rest of your business all live inside one connected workspace.",
    placement: "right",
  },

  {
    id: "dashboard-overview",
    route: "/dashboard",
    target: "[data-tour='dashboard-overview']",
    title: "Your business at a glance.",
    description:
      "Your dashboard brings together the things that deserve your attention. Use it as your starting point instead of opening five different systems every morning.",
    placement: "bottom",
  },

  {
    id: "dashboard-actions",
    route: "/dashboard",
    target: "[data-tour='dashboard-actions']",
    title: "Get things done faster.",
    description:
      "Quick actions are designed for the things you do most often. Create work, capture information and move straight into the next task without hunting through menus.",
    placement: "bottom",
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
    target: "[data-tour='crm-header']",
    title: "Meet your CRM.",
    description:
      "This is where the people and businesses behind your work live. Keep contact details, relationships and business context organised instead of scattered across messages and spreadsheets.",
    placement: "bottom",
  },

  {
    id: "crm-contacts",
    route: "/crm",
    target: "[data-tour='crm-contacts']",
    title: "Keep every relationship organised.",
    description:
      "Contacts give you one reliable place for the people you work with, sell to or want to stay connected with.",
    placement: "right",
  },

  {
    id: "crm-add-contact",
    route: "/crm",
    target: "[data-tour='crm-add-contact']",
    title: "Add your first contact.",
    description:
      "This is one of the best places to begin. Add a client, prospect, supplier or collaborator and start building your business network inside TOTS-OS.",
    placement: "bottom",
  },

  {
    id: "crm-organisations",
    route: "/crm",
    target: "[data-tour='crm-organisations']",
    title: "Connect people to organisations.",
    description:
      "Use organisations to keep company-level relationships organised. It becomes much easier to understand who belongs where and how different contacts relate to your business.",
    placement: "bottom",
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
    target: "[data-tour='projects-header']",
    title: "Turn ideas into organised work.",
    description:
      "Projects give work somewhere to live. Use them for client work, internal plans, launches, campaigns or anything else that needs a clear outcome.",
    placement: "bottom",
  },

  {
    id: "projects-board",
    route: "/projects",
    target: "[data-tour='projects-board']",
    title: "See work moving.",
    description:
      "Your project workspace helps you see what's waiting, what's underway and what's finished so nothing disappears into a forgotten list.",
    placement: "top",
  },

  {
    id: "projects-create",
    route: "/projects",
    target: "[data-tour='projects-create']",
    title: "Create your first project.",
    description:
      "Give something you're working on a proper home. Once a project exists, you can organise the actions needed to move it forward.",
    placement: "bottom",
  },

  {
    id: "projects-tasks",
    route: "/projects",
    target: "[data-tour='projects-tasks']",
    title: "Break the work down.",
    description:
      "Tasks turn a project into clear next actions. Add deadlines, ownership and status so you always know what should happen next.",
    placement: "right",
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
    target: "[data-tour='calendar-header']",
    title: "See what's coming.",
    description:
      "Your calendar gives deadlines, events and important business dates one connected view. Planning becomes much easier when the future isn't split across different apps.",
    placement: "bottom",
  },

  {
    id: "calendar-main",
    route: "/calendar",
    target: "[data-tour='calendar-main']",
    title: "Plan around the whole business.",
    description:
      "Use your calendar to understand what's happening across your workspace, not just what meetings happen to be booked.",
    placement: "top",
  },

  {
    id: "calendar-add-event",
    route: "/calendar",
    target: "[data-tour='calendar-add-event']",
    title: "Add something important.",
    description:
      "Create an event, deadline or important date here. Clarity recommends adding something real so your workspace starts becoming useful immediately.",
    placement: "bottom",
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
    target: "[data-tour='notes-header']",
    title: "Give every idea somewhere to land.",
    description:
      "Notes are your space for thoughts, ideas, meeting notes and anything else worth keeping before it disappears into another forgotten app.",
    placement: "bottom",
  },

  {
    id: "notes-workspace",
    route: "/notes",
    target: "[data-tour='notes-workspace']",
    title: "Capture first. Organise second.",
    description:
      "Don't lose momentum trying to decide where every thought belongs. Capture it here first, then turn useful ideas into real work when you're ready.",
    placement: "top",
  },

  {
    id: "notes-create",
    route: "/notes",
    target: "[data-tour='notes-create']",
    title: "Capture your first note.",
    description:
      "Add something that's currently sitting in your head, Notes app or notebook. The aim is to make TOTS-OS the place your business information naturally returns to.",
    placement: "bottom",
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
    target: "[data-tour='campaigns-header']",
    title: "Build campaigns without leaving your system.",
    description:
      "Campaigns lets you create email content, organise audiences, schedule sends and monitor performance alongside the rest of your business.",
    placement: "bottom",
  },

  {
    id: "campaigns-lists",
    route: "/campaigns",
    target: "[data-tour='campaign-lists']",
    title: "Start with your audience.",
    description:
      "Campaign Lists organise the people you want to communicate with. Create different audiences for customers, prospects, updates or any group that makes sense for your business.",
    placement: "left",
  },

  {
    id: "campaigns-create-list",
    route: "/campaigns",
    target: "[data-tour='campaign-create-list']",
    title: "Create your first list.",
    description:
      "Add a list before sending your first campaign. You can then choose exactly which subscribers should receive each message.",
    placement: "left",
  },

  {
    id: "campaigns-create",
    route: "/campaigns",
    target: "[data-tour='campaign-create']",
    title: "Create something worth opening.",
    description:
      "The campaign builder gives you freedom over your content, branding, call-to-action and delivery while keeping everything tied back to your business.",
    placement: "bottom",
  },

  {
    id: "campaigns-performance",
    route: "/campaigns",
    target: "[data-tour='campaign-pipeline']",
    title: "Know what happened after send.",
    description:
      "Sent campaigns stay visible here so you can monitor delivery, opens and clicks instead of sending content into a black hole.",
    placement: "top",
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
    target: "[data-tour='social-header']",
    title: "Bring social into the same workspace.",
    description:
      "Social planning belongs beside the rest of your business. TOTS-OS is designed to help you organise and publish content without treating social media like a completely separate operation.",
    placement: "bottom",
  },

  {
    id: "social-planner",
    route: "/social",
    target: "[data-tour='social-planner']",
    title: "Plan before you publish.",
    description:
      "Use your social workspace to prepare content, see what's coming and keep publishing aligned with everything else happening in your business.",
    placement: "top",
  },

  {
    id: "social-create",
    route: "/social",
    target: "[data-tour='social-create']",
    title: "Create your next post.",
    description:
      "Build content here and choose where it should go. Connected accounts can then become part of one repeatable publishing workflow.",
    placement: "bottom",
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
    target: "[data-tour='finance-header']",
    title: "Know the financial picture.",
    description:
      "Finance brings the everyday money side of your business into one workspace so invoices, expenses and important figures aren't living in disconnected places.",
    placement: "bottom",
  },

  {
    id: "finance-overview",
    route: "/payments",
    target: "[data-tour='finance-overview']",
    title: "Start with the overview.",
    description:
      "This gives you a quick financial snapshot before you move into individual areas such as sales, expenses, tax, payroll and timesheets.",
    placement: "top",
  },

  {
    id: "finance-sales",
    route: "/payments",
    target: "[data-tour='finance-sales']",
    title: "Track money coming in.",
    description:
      "Use Sales for invoices, quotes, customers and recurring billing so you can see what's been raised and what still needs attention.",
    placement: "bottom",
  },

  {
    id: "finance-expenses",
    route: "/payments",
    target: "[data-tour='finance-expenses']",
    title: "Keep costs visible.",
    description:
      "Log business expenses here so costs don't disappear into bank statements and receipts that only get reviewed months later.",
    placement: "bottom",
  },

  {
    id: "finance-tax",
    route: "/payments",
    target: "[data-tour='finance-tax']",
    title: "Keep tax on the radar.",
    description:
      "TOTS-OS helps you keep tax and VAT records visible alongside the rest of your financial activity. It's designed for organisation and awareness, not to replace professional tax advice.",
    placement: "bottom",
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
    target: "[data-tour='settings-header']",
    title: "Make TOTS-OS feel like your business.",
    description:
      "Settings is where your workspace starts becoming yours. Add your identity, branding and account details once and TOTS-OS can reuse them elsewhere.",
    placement: "bottom",
  },

  {
    id: "settings-profile",
    route: "/settings",
    target: "[data-tour='settings-profile']",
    title: "Tell TOTS-OS who you are.",
    description:
      "Your profile keeps the basic information behind your workspace in one place. Keeping this accurate makes the rest of the system more useful.",
    placement: "bottom",
  },

  {
    id: "settings-logo",
    route: "/settings",
    target: "[data-tour='settings-logo']",
    title: "Bring your brand into the system.",
    description:
      "Upload your company logo here. Once saved, TOTS-OS can use your branding across areas such as campaigns and other business outputs.",
    placement: "right",
  },

  {
    id: "settings-social-connections",
    route: "/settings",
    target: "[data-tour='settings-social-connections']",
    title: "Connect the platforms you use.",
    description:
      "Connect supported social accounts here so TOTS-OS can bring publishing workflows into the same workspace as the rest of your business.",
    placement: "top",
  },

  {
    id: "settings-security",
    route: "/settings",
    target: "[data-tour='settings-security']",
    title: "Keep your account secure.",
    description:
      "Your password and account security settings live here. It's worth knowing where they are before you ever need them.",
    placement: "top",
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
      "You now know your way around TOTS-OS. Start adding real information and the system becomes more useful every time you use it. Clarity will still be here whenever you need help.",
    placement: "center",
  },
];