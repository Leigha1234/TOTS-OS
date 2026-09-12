"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  ContactRound,
  FolderKanban,
  Home,
  LayoutDashboard,
  Mail,
  Megaphone,
  Minus,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ============================================================
   CONFIG
============================================================ */

const LOGO_SRC = "/icon.png";

const HOME_URL = "/";

const BILLING_URL =
  "/billing";

const COMPLETE_PRICE = 139;

const MODULE_PRICE = 29;

const MODULE_BUNDLE_PRICES: Record<number, number> = {
  0: 0,
  1: 29,
  2: 55,
  3: 79,
  4: 99,
  5: 119,
  6: 139,
};

/* ============================================================
   PRICING

   MAIN MODULES

   Every main module is £29/month individually.

   FIXED MODULE BUNDLES

   1 module   £29
   2 modules  £55
   3 modules  £79
   4 modules  £99
   5 modules  £119
   6 modules  TOTS-OS Complete £139

   CLARITY AI

   Starter  £19
   Plus     £39
   Pro      £69

   Complete includes Clarity AI Starter.

   IMPORTANT:
   A 1–5 module setup remains modular even if adding AI makes
   the total exceed £139. Complete represents all six modules.
============================================================ */

/* ============================================================
   TYPES
============================================================ */

type ModuleKey =
  | "core"
  | "clientsProjects"
  | "finance"
  | "social"
  | "email"
  | "store";

type AiTierKey =
  | "none"
  | "starter"
  | "plus"
  | "pro";

type QuestionId =
  | "information"
  | "clients"
  | "projects"
  | "finance"
  | "marketing"
  | "email"
  | "selling"
  | "admin"
  | "team"
  | "ai"
  | "goal";

type Answers = Partial<
  Record<
    QuestionId,
    string
  >
>;

type AnswerOption = {
  id: string;

  label: string;

  description?: string;

  scores: Partial<
    Record<
      ModuleKey,
      number
    >
  >;

  exclude?: ModuleKey[];

  aiTier?: AiTierKey;

  insight?: string;
};

type Question = {
  id: QuestionId;

  eyebrow: string;

  question: string;

  helper: string;

  icon: LucideIcon;

  options: AnswerOption[];
};

type ModuleInfo = {
  key: ModuleKey;

  title: string;

  shortTitle: string;

  price: number;

  description: string;

  icon: LucideIcon;
};

type ModuleScores = Record<
  ModuleKey,
  number
>;

type ModuleReason = {
  questionId: QuestionId;

  text: string;
};

type BundleResult = {
  recommendedModules: ModuleKey[];

  displayedModules: ModuleKey[];

  moduleCount: number;

  undiscountedModuleTotal: number;

  discountedModuleTotal: number;

  requestedAiTier: AiTierKey;

  requestedAiPrice: number;

  modularTotal: number;

  totalMonthly: number;

  moduleSaving: number;

  completeSaving: number;

  discountPercent: number;

  discountLabel: string;

  bundleName: string;

  isComplete: boolean;

  includedAiTier: AiTierKey;

  aiUpgradeSuggested: boolean;
};

type SetupProfile = {
  eyebrow: string;

  title: string;

  description: string;
};

/* ============================================================
   MODULES
============================================================ */

const MODULE_INFO: Record<
  ModuleKey,
  ModuleInfo
> = {
  core: {
    key: "core",

    title: "TOTS-OS Core",

    shortTitle: "Core",

    price: MODULE_PRICE,

    description:
      "Your central business workspace for dashboards, contacts, tasks, calendar, notes and everyday organisation.",

    icon: LayoutDashboard,
  },

  clientsProjects: {
    key: "clientsProjects",

    title:
      "Clients & Projects",

    shortTitle:
      "Clients & Projects",

    price: MODULE_PRICE,

    description:
      "Manage client relationships, projects, tasks, deadlines, notes, files and delivery from one connected workspace.",

    icon: FolderKanban,
  },

  finance: {
    key: "finance",

    title: "Finance",

    shortTitle: "Finance",

    price: MODULE_PRICE,

    description:
      "Bring invoices, quotes, expenses and financial visibility closer to the rest of your business.",

    icon: CircleDollarSign,
  },

  social: {
    key: "social",

    title:
      "Social Studio",

    shortTitle:
      "Social Studio",

    price: MODULE_PRICE,

    description:
      "Plan, organise and publish content without separating social media from the rest of your workflow.",

    icon: Megaphone,
  },

  email: {
    key: "email",

    title:
      "Email Marketing",

    shortTitle:
      "Email Marketing",

    price: MODULE_PRICE,

    description:
      "Manage audiences, subscriber lists, campaigns, scheduling and customer email activity.",

    icon: Mail,
  },

  store: {
    key: "store",

    title:
      "TOTS-OS Store",

    shortTitle: "Store",

    price: MODULE_PRICE,

    description:
      "Manage products, customers and orders without running your online store as another disconnected system.",

    icon: Store,
  },
};

const MODULE_ORDER: ModuleKey[] =
  [
    "core",
    "clientsProjects",
    "finance",
    "social",
    "email",
    "store",
  ];

/* ============================================================
   CLARITY AI
============================================================ */

const AI_TIERS = {
  none: {
    title:
      "No Clarity AI add-on",

    price: 0,


    description:
      "You can add Clarity AI later whenever it becomes useful.",
  },

  starter: {
    title:
      "Clarity AI Starter",

    price: 19,


    description:
      "For occasional summaries, ideas, recommendations and quick business assistance.",
  },

  plus: {
    title:
      "Clarity AI Plus",

    price: 39,


    description:
      "For regular use across different areas of your business throughout the week.",
  },

  pro: {
    title:
      "Clarity AI Pro",

    price: 69,


    description:
      "For businesses making Clarity AI part of their everyday operating workflow.",
  },
} satisfies Record<
  AiTierKey,
  {
    title: string;

    price: number;


    description: string;
  }
>;

/* ============================================================
   QUESTIONS
============================================================ */

const QUESTIONS: Question[] = [
  {
    id: "information",

    eyebrow:
      "Your current setup",

    question:
      "Where does most of your business information live right now?",

    helper:
      "Choose whichever sounds closest to your normal working day.",

    icon: LayoutDashboard,

    options: [
      {
        id: "head",

        label:
          "Mostly in my head, messages, notes or random places",

        description:
          "I know where most things are... eventually.",

        scores: {
          core: 7,

          clientsProjects: 2,
        },

        insight:
          "Important business information is currently spread across informal places.",
      },

      {
        id: "spreadsheets",

        label:
          "Across spreadsheets and several different apps",

        description:
          "Everything works, but nothing really talks to each other.",

        scores: {
          core: 6,

          clientsProjects: 2,

          finance: 1,
        },

        insight:
          "You're already using systems, but they're creating unnecessary switching.",
      },

      {
        id: "systems",

        label:
          "I have systems, but they're disconnected",

        description:
          "There is structure, but I still jump between tools.",

        scores: {
          core: 5,

          clientsProjects: 2,
        },

        insight:
          "The opportunity is connecting your systems rather than starting again.",
      },

      {
        id: "organised",

        label:
          "Most things are already pretty organised",

        description:
          "I'm looking to make a good setup even better.",

        scores: {
          core: 1,
        },

        insight:
          "You already have a strong operational foundation.",
      },
    ],
  },

  {
    id: "clients",

    eyebrow: "Clients",

    question:
      "How are you currently keeping track of clients and enquiries?",

    helper:
      "Think contacts, follow-ups, notes, jobs and previous conversations.",

    icon: ContactRound,

    options: [
      {
        id: "memory",

        label:
          "Messages, inboxes and memory",

        description:
          "I usually know who I need to reply to... hopefully.",

        scores: {
          clientsProjects: 7,

          core: 2,
        },

        insight:
          "Client information and follow-ups need a more reliable home.",
      },

      {
        id: "sheet",

        label:
          "A spreadsheet, notes app or basic list",

        description:
          "It works, but there is plenty of manual updating.",

        scores: {
          clientsProjects: 6,

          core: 1,
        },

        insight:
          "Your client process works, but relies heavily on manual administration.",
      },

      {
        id: "crm",

        label:
          "A separate CRM",

        description:
          "Client management is organised, but disconnected from other work.",

        scores: {
          clientsProjects: 4,

          core: 2,
        },

        insight:
          "Connecting client information to active work could reduce duplicated admin.",
      },

      {
        id: "connected",

        label:
          "I already have a strong client process",

        description:
          "Contacts and follow-ups are easy to manage.",

        scores: {
          clientsProjects: 1,
        },

        insight:
          "Client management is not currently one of your biggest pain points.",
      },
    ],
  },

  {
    id: "projects",

    eyebrow:
      "Work & delivery",

    question:
      "When you start work for the day, how easy is it to see exactly what needs done?",

    helper:
      "Think tasks, projects, client work, deadlines and priorities.",

    icon: FolderKanban,

    options: [
      {
        id: "figure-out",

        label:
          "I normally figure it out as I go",

        description:
          "Priorities live mostly in my head.",

        scores: {
          clientsProjects: 7,

          core: 3,
        },

        insight:
          "Projects and priorities need a clearer operating rhythm.",
      },

      {
        id: "several-lists",

        label:
          "I check a few different lists, chats or calendars",

        description:
          "The information exists, just not in one place.",

        scores: {
          clientsProjects: 6,

          core: 4,
        },

        insight:
          "Your work is being managed across too many separate views.",
      },

      {
        id: "project-app",

        label:
          "I have a project or task management app",

        description:
          "Work is organised but sits separately from clients and finances.",

        scores: {
          clientsProjects: 4,

          core: 2,
        },

        insight:
          "Project management works, but connecting it to clients could simplify delivery.",
      },

      {
        id: "clear",

        label:
          "Very easy — I have a clear system",

        description:
          "I can quickly see priorities and deadlines.",

        scores: {
          clientsProjects: 1,

          core: 1,
        },

        insight:
          "Your project workflow is already in a strong place.",
      },
    ],
  },

  {
    id: "finance",

    eyebrow: "Money",

    question:
      "How confident are you about your business finances day to day?",

    helper:
      "We're talking about your own visibility — not just what your accountant can see.",

    icon:
      CircleDollarSign,

    options: [
      {
        id: "avoid",

        label:
          "I mostly look when I absolutely have to",

        description:
          "Finance admin tends to get pushed down the list.",

        scores: {
          finance: 8,

          core: 1,
        },

        insight:
          "Day-to-day financial visibility is currently limited.",
      },

      {
        id: "roughly",

        label:
          "I know roughly, but getting the full picture takes work",

        description:
          "Information is spread across banking, invoices and spreadsheets.",

        scores: {
          finance: 7,

          core: 1,
        },

        insight:
          "Getting a complete financial picture currently takes too much effort.",
      },

      {
        id: "accounting",

        label:
          "I track everything in separate accounting software",

        description:
          "Finance is organised but separate from my daily operations.",

        scores: {
          finance: 4,

          core: 1,
        },

        insight:
          "Finance is organised, but operational visibility could be more connected.",
      },

      {
        id: "clear",

        label:
          "I have a clear, up-to-date view",

        description:
          "I know what is coming in, going out and still outstanding.",

        scores: {
          finance: 1,
        },

        insight:
          "Finance is not currently one of your biggest gaps.",
      },
    ],
  },

  {
    id: "marketing",

    eyebrow:
      "Social media",

    question:
      "What does your current social content process look like?",

    helper:
      "Think ideas, captions, assets, scheduling and staying consistent.",

    icon: Megaphone,

    options: [
      {
        id: "last-minute",

        label:
          "Usually last minute",

        description:
          "I post when I remember or suddenly need to promote something.",

        scores: {
          social: 8,

          core: 1,
        },

        insight:
          "Social content currently relies too heavily on last-minute effort.",
      },

      {
        id: "many-tools",

        label:
          "Canva, notes, folders and scheduling tools",

        description:
          "I have a process, but it is spread across several places.",

        scores: {
          social: 7,

          core: 1,
        },

        insight:
          "Your content workflow works, but is spread across too many tools.",
      },

      {
        id: "separate-system",

        label:
          "It's planned, but in a completely separate system",

        description:
          "Marketing works well but isn't connected to operations.",

        scores: {
          social: 4,
        },

        insight:
          "Social is organised, but connecting it to the wider business could help.",
      },

      {
        id: "strong",

        label:
          "I already have a strong content workflow",

        description:
          "Planning and publishing are easy to stay on top of.",

        scores: {
          social: 1,
        },

        insight:
          "Social Studio is not currently one of your biggest needs.",
      },
    ],
  },

  {
    id: "email",

    eyebrow:
      "Email marketing",

    question:
      "How are you currently using email to stay in touch with customers?",

    helper:
      "Think campaigns, newsletters, subscriber lists and customer updates.",

    icon: Mail,

    options: [
      {
        id: "not-using",

        label:
          "I'm not really using email marketing yet",

        description:
          "I know I could probably do more with my customer list.",

        scores: {
          email: 6,
        },

        insight:
          "Your customer list has more potential than you're currently using.",
      },

      {
        id: "manual",

        label:
          "Mostly manual emails or BCC sends",

        description:
          "It works, but campaigns and lists take more effort than they should.",

        scores: {
          email: 8,
        },

        insight:
          "Email marketing is currently more manual than it needs to be.",
      },

      {
        id: "separate-platform",

        label:
          "I use a separate email marketing platform",

        description:
          "Email works, but sits apart from my customers and business activity.",

        scores: {
          email: 4,
        },

        insight:
          "Your email system works, but could benefit from being connected.",
      },

      {
        id: "not-needed",

        label:
          "Email marketing isn't important to my business",

        description:
          "I don't need campaigns or subscriber management right now.",

        scores: {},

        exclude: [
          "email",
        ],

        insight:
          "You don't need to pay for Email Marketing right now.",
      },
    ],
  },

  {
    id: "selling",

    eyebrow: "Selling",

    question:
      "Do you sell — or want to sell — products online?",

    helper:
      "This could be physical products, merchandise or other items.",

    icon:
      ShoppingBag,

    options: [
      {
        id: "yes-disconnected",

        label:
          "Yes, and orders are another separate thing to manage",

        description:
          "Selling online adds more systems and admin.",

        scores: {
          store: 9,

          core: 1,
        },

        insight:
          "Your store activity would benefit from being connected to the rest of the business.",
      },

      {
        id: "want-to",

        label:
          "Not yet, but I'd like to",

        description:
          "Online selling is something I want to introduce.",

        scores: {
          store: 7,
        },

        insight:
          "Store gives you a clear path to introduce online selling.",
      },

      {
        id: "already-good",

        label:
          "Yes, and my current store setup works well",

        description:
          "I'm mainly interested in the rest of my operations.",

        scores: {
          store: 2,
        },

        insight:
          "Your existing store is working well, so replacing it isn't a priority.",
      },

      {
        id: "no",

        label:
          "No — selling products isn't part of my business",

        description:
          "I mainly sell services or don't need an online shop.",

        scores: {},

        exclude: [
          "store",
        ],

        insight:
          "Store isn't relevant to how your business currently operates.",
      },
    ],
  },

  {
    id: "admin",

    eyebrow:
      "Your time",

    question:
      "How much time do you think repetitive admin costs you each week?",

    helper:
      "Include searching for information, updating tools and repeating the same tasks.",

    icon: Zap,

    options: [
      {
        id: "five-plus",

        label:
          "More than 5 hours",

        description:
          "Admin is taking a noticeable chunk out of every week.",

        scores: {
          core: 6,

          clientsProjects: 2,
        },

        insight:
          "Reducing repetitive admin could create a meaningful weekly time saving.",
      },

      {
        id: "three-five",

        label:
          "Around 3–5 hours",

        description:
          "There are definitely things that could be streamlined.",

        scores: {
          core: 5,

          clientsProjects: 1,
        },

        insight:
          "There is a clear opportunity to streamline your weekly admin.",
      },

      {
        id: "one-two",

        label:
          "Around 1–2 hours",

        description:
          "It's manageable, but I'd still like to make things easier.",

        scores: {
          core: 2,
        },

        insight:
          "Your admin load is manageable, so a focused setup may be enough.",
      },

      {
        id: "little",

        label:
          "Very little",

        description:
          "My processes are already pretty efficient.",

        scores: {
          core: 1,
        },

        insight:
          "Your processes are already fairly efficient.",
      },
    ],
  },

  {
    id: "team",

    eyebrow:
      "Your business",

    question:
      "Who needs visibility of what is happening in your business?",

    helper:
      "Choose the option that best reflects how you work now.",

    icon: Users,

    options: [
      {
        id: "solo",

        label:
          "Just me",

        description:
          "I'm running the business myself.",

        scores: {
          core: 1,
        },

        insight:
          "Your setup can stay lean and focused around one person.",
      },

      {
        id: "small-team",

        label:
          "Me and a small team",

        description:
          "A few people need to stay aligned.",

        scores: {
          core: 3,

          clientsProjects: 3,
        },

        insight:
          "A shared view of work and responsibilities would help your team stay aligned.",
      },

      {
        id: "growing",

        label:
          "A growing team with different responsibilities",

        description:
          "More people need the right information at the right time.",

        scores: {
          core: 5,

          clientsProjects: 4,
        },

        insight:
          "Your systems need to support more people as the business grows.",
      },

      {
        id: "clients-collab",

        label:
          "A team plus lots of active clients or projects",

        description:
          "There are several moving parts to keep visible.",

        scores: {
          core: 5,

          clientsProjects: 7,
        },

        insight:
          "Client delivery and team visibility are both becoming more important.",
      },
    ],
  },

  {
    id: "ai",

    eyebrow:
      "Clarity AI",

    question:
      "How often would you realistically use AI inside your business system?",

    helper:
      "We'll recommend a sensible starting AI tier rather than pushing you into a larger AI plan.",

    icon:
      BrainCircuit,

    options: [
      {
        id: "none",

        label:
          "Probably not right now",

        description:
          "I'd rather add AI later if I find I need it.",

        scores: {},

        aiTier:
          "none",

        insight:
          "You don't need to add Clarity AI to your setup right now.",
      },

      {
        id: "occasional",

        label:
          "Occasionally",

        description:
          "For the odd summary, idea, recommendation or bit of help.",

        scores: {},

        aiTier:
          "starter",

        insight:
          "Starter should comfortably cover occasional AI assistance.",
      },

      {
        id: "regular",

        label:
          "Regularly throughout the week",

        description:
          "I'd use AI across several parts of the business.",

        scores: {},

        aiTier:
          "plus",

        insight:
          "Plus better matches regular weekly AI use.",
      },

      {
        id: "heavy",

        label:
          "Every day — I'd build it into how I work",

        description:
          "I want AI to be a regular part of my operating workflow.",

        scores: {},

        aiTier:
          "pro",

        insight:
          "Pro gives you more headroom for everyday AI use.",
      },
    ],
  },

  {
    id: "goal",

    eyebrow:
      "Your priority",

    question:
      "If TOTS-OS could improve one thing first, what would make the biggest difference?",

    helper:
      "Choose the outcome that would feel most valuable right now.",

    icon: Sparkles,

    options: [
      {
        id: "one-place",

        label:
          "Getting everything organised in one place",

        description:
          "Less searching, switching and remembering.",

        scores: {
          core: 6,

          clientsProjects: 1,
        },

        insight:
          "Your biggest priority is creating one clear operational home.",
      },

      {
        id: "clients",

        label:
          "Running client work more smoothly",

        description:
          "I want enquiries, projects, tasks and client information properly connected.",

        scores: {
          clientsProjects: 7,

          core: 2,
        },

        insight:
          "Improving the client delivery journey would create the biggest immediate value.",
      },

      {
        id: "marketing",

        label:
          "Growing without marketing becoming another full-time job",

        description:
          "I want social and email activity to be easier to keep consistent.",

        scores: {
          social: 5,

          email: 5,
        },

        insight:
          "Making marketing easier and more consistent is your biggest growth opportunity.",
      },

      {
        id: "scale",

        label:
          "Building systems that can grow with me",

        description:
          "I want a stronger foundation before the business gets busier.",

        scores: {
          core: 6,

          clientsProjects: 4,

          finance: 1,
        },

        insight:
          "You're looking for infrastructure that can support the next stage of the business.",
      },
    ],
  },
];

/* ============================================================
   HELPERS
============================================================ */

function getOption(
  question: Question,
  answerId?: string,
) {
  return question.options.find(
    (option) =>
      option.id ===
      answerId,
  );
}

function getSelectedOption(
  questionId: QuestionId,
  answers: Answers,
) {
  const question =
    QUESTIONS.find(
      (item) =>
        item.id ===
        questionId,
    );

  if (!question) {
    return undefined;
  }

  return getOption(
    question,
    answers[questionId],
  );
}

function calculateModuleScores(
  answers: Answers,
) {
  const scores: ModuleScores =
    {
      core: 0,

      clientsProjects: 0,

      finance: 0,

      social: 0,

      email: 0,

      store: 0,
    };

  QUESTIONS.forEach(
    (question) => {
      const option =
        getOption(
          question,
          answers[
            question.id
          ],
        );

      if (!option) {
        return;
      }

      Object.entries(
        option.scores,
      ).forEach(
        ([key, value]) => {
          scores[
            key as ModuleKey
          ] += value ?? 0;
        },
      );
    },
  );

  return scores;
}

function calculateExclusions(
  answers: Answers,
) {
  const excluded =
    new Set<ModuleKey>();

  QUESTIONS.forEach(
    (question) => {
      const option =
        getOption(
          question,
          answers[
            question.id
          ],
        );

      option?.exclude?.forEach(
        (key) => {
          excluded.add(key);
        },
      );
    },
  );

  return excluded;
}

function getRecommendedModules(
  scores: ModuleScores,
  excluded: Set<ModuleKey>,
) {
  const sorted = (
    Object.entries(
      scores,
    ) as [
      ModuleKey,
      number,
    ][]
  )
    .filter(
      ([key]) =>
        !excluded.has(key),
    )
    .sort((a, b) => {
      if (
        b[1] !== a[1]
      ) {
        return (
          b[1] - a[1]
        );
      }

      return (
        MODULE_ORDER.indexOf(
          a[0],
        ) -
        MODULE_ORDER.indexOf(
          b[0],
        )
      );
    });

  let recommended =
    sorted
      .filter(
        ([, score]) =>
          score >= 5,
      )
      .map(
        ([key]) => key,
      );

  /*
    Avoid returning an empty setup.
  */

  if (
    recommended.length ===
    0
  ) {
    recommended =
      sorted
        .filter(
          ([, score]) =>
            score > 0,
        )
        .slice(0, 1)
        .map(
          ([key]) => key,
        );
  }

  /*
    If only one module is clearly
    recommended but another is very
    close, include that one as well.
  */

  if (
    recommended.length ===
    1
  ) {
    const second =
      sorted.find(
        ([key, score]) =>
          key !==
            recommended[0] &&
          score >= 4,
      );

    if (second) {
      recommended.push(
        second[0],
      );
    }
  }

  return recommended.sort(
    (a, b) =>
      MODULE_ORDER.indexOf(
        a,
      ) -
      MODULE_ORDER.indexOf(
        b,
      ),
  );
}

function getConsiderLaterModules(
  scores: ModuleScores,
  recommended: ModuleKey[],
  excluded: Set<ModuleKey>,
) {
  return (
    Object.entries(
      scores,
    ) as [
      ModuleKey,
      number,
    ][]
  )
    .filter(
      ([key, score]) =>
        !recommended.includes(
          key,
        ) &&
        !excluded.has(key) &&
        score >= 3,
    )
    .sort(
      (a, b) =>
        b[1] - a[1],
    )
    .slice(0, 2)
    .map(
      ([key]) => key,
    );
}

function getNotNeededModules(
  recommended: ModuleKey[],
  considerLater: ModuleKey[],
) {
  return MODULE_ORDER.filter(
    (key) =>
      !recommended.includes(
        key,
      ) &&
      !considerLater.includes(
        key,
      ),
  );
}

function getAiTier(
  answers: Answers,
): AiTierKey {
  const option =
    getSelectedOption(
      "ai",
      answers,
    );

  return (
    option?.aiTier ??
    "none"
  );
}

function uniqueModules(
  modules: ModuleKey[],
): ModuleKey[] {
  return Array.from(
    new Set(
      modules,
    ),
  );
}

function calculateBundle(
  modules: ModuleKey[],
  requestedAiTier: AiTierKey,
): BundleResult {
  const cleanModules =
    uniqueModules(
      modules,
    );

  const moduleCount =
    cleanModules.length;

  const undiscountedModuleTotal =
    moduleCount *
    MODULE_PRICE;

  const requestedAiPrice =
    AI_TIERS[
      requestedAiTier
    ].price;

  /*
    COMPLETE RULE

    Complete is used ONLY when all six modules are recommended.

    We intentionally do not switch 1–5 module setups to Complete
    just because an AI add-on takes the total above £139.
  */

  const shouldRecommendComplete =
    moduleCount ===
    MODULE_ORDER.length;

  if (
    shouldRecommendComplete
  ) {
    return {
      recommendedModules:
        cleanModules,

      displayedModules:
        MODULE_ORDER,

      moduleCount:
        MODULE_ORDER.length,

      undiscountedModuleTotal,

      discountedModuleTotal:
        COMPLETE_PRICE,

      requestedAiTier,

      requestedAiPrice,

      modularTotal:
        COMPLETE_PRICE,

      totalMonthly:
        COMPLETE_PRICE,

      moduleSaving:
        Math.max(
          0,
          undiscountedModuleTotal -
            COMPLETE_PRICE,
        ),

      completeSaving:
        0,

      discountPercent:
        0,

      discountLabel:
        "Complete fixed price",

      bundleName:
        "TOTS-OS Complete",

      isComplete:
        true,

      includedAiTier:
        "starter",

      aiUpgradeSuggested:
        requestedAiTier ===
          "plus" ||
        requestedAiTier ===
          "pro",
    };
  }

  const discountedModuleTotal =
    MODULE_BUNDLE_PRICES[
      moduleCount
    ] ??
    0;

  const moduleSaving =
    Math.max(
      0,
      undiscountedModuleTotal -
        discountedModuleTotal,
    );

  const modularTotal =
    discountedModuleTotal +
    requestedAiPrice;

  return {
    recommendedModules:
      cleanModules,

    displayedModules:
      cleanModules,

    moduleCount,

    undiscountedModuleTotal,

    discountedModuleTotal,

    requestedAiTier,

    requestedAiPrice,

    modularTotal,

    totalMonthly:
      modularTotal,

    moduleSaving,

    completeSaving:
      0,

    discountPercent:
      0,

    discountLabel:
      moduleCount === 1
        ? "Single module"
        : `${moduleCount}-module fixed bundle`,

    bundleName:
      moduleCount === 1
        ? `${
            MODULE_INFO[
              cleanModules[0]
            ]?.shortTitle ??
            "TOTS-OS"
          } setup`
        : `${moduleCount}-module setup`,

    isComplete:
      false,

    includedAiTier:
      requestedAiTier,

    aiUpgradeSuggested:
      false,
  };
}

function getSetupProfile(
  bundle: BundleResult,
): SetupProfile {
  if (bundle.isComplete) {
    return {
      eyebrow:
        "Complete setup",

      title:
        "Your business would benefit from the full setup.",

      description:
        "Your answers point to value across all six main TOTS-OS modules, so Complete gives you the full connected workspace plus Clarity AI Starter for one fixed £139 monthly price.",
    };
  }

  if (
    bundle.moduleCount <= 2
  ) {
    return {
      eyebrow:
        "Focused setup",

      title:
        "Keep it lean.",

      description:
        "Your answers don't suggest you need a huge software stack. Start with the areas creating the clearest value and add more only when you need them.",
    };
  }

  if (
    bundle.moduleCount <= 4
  ) {
    return {
      eyebrow:
        "Connected setup",

      title:
        "Your biggest win is connection.",

      description:
        "Several parts of your business would benefit from working together. This setup should reduce tool switching and duplicated admin without giving you unnecessary modules.",
    };
  }

  return {
    eyebrow:
      "Expanded setup",

    title:
      "Your business has a lot of moving parts.",

    description:
      "Your answers point to value across most of TOTS-OS, so a broader connected workspace is likely to give you the clearest operational view.",
  };
}

function getModuleReasons(
  moduleKey: ModuleKey,
  answers: Answers,
): ModuleReason[] {
  const reasons: ModuleReason[] =
    [];

  QUESTIONS.forEach(
    (question) => {
      const option =
        getOption(
          question,
          answers[
            question.id
          ],
        );

      if (!option) {
        return;
      }

      const score =
        option.scores[
          moduleKey
        ];

      if (
        !score ||
        score < 2 ||
        !option.insight
      ) {
        return;
      }

      reasons.push({
        questionId:
          question.id,

        text:
          option.insight,
      });
    },
  );

  return reasons.slice(
    0,
    2,
  );
}

function buildBillingUrl(
  bundle: BundleResult,
) {
  const params =
    new URLSearchParams();

  params.set(
    "source",
    "find-your-setup",
  );

  if (bundle.isComplete) {
    params.set(
      "package",
      "complete",
    );

    params.set(
      "modules",
      MODULE_ORDER.join(","),
    );

    params.set(
      "ai",
      "starter",
    );

    if (
      bundle.aiUpgradeSuggested
    ) {
      params.set(
        "suggested_ai",
        bundle.requestedAiTier,
      );
    }
  } else {
    params.set(
      "package",
      "modular",
    );

    params.set(
      "modules",
      bundle.recommendedModules.join(
        ",",
      ),
    );

    if (
      bundle.requestedAiTier !==
      "none"
    ) {
      params.set(
        "ai",
        bundle.requestedAiTier,
      );
    }
  }

  return `${BILLING_URL}?${params.toString()}`;
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function Logo() {
  return (
    <a
      href={HOME_URL}
      className="brand"
      aria-label="TOTS-OS home"
    >
      <img
        src={LOGO_SRC}
        alt=""
        className="brand-logo"
        aria-hidden="true"
      />

      <span className="brand-word">
        TOTS-OS
      </span>
    </a>
  );
}

function ProgressDots({
  current,
}: {
  current: number;
}) {
  return (
    <div
      className="progress-dots"
      aria-hidden="true"
    >
      {QUESTIONS.map(
        (_, index) => (
          <span
            key={index}
            className={[
              "progress-dot",

              index < current
                ? "complete"
                : "",

              index === current
                ? "active"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ),
      )}
    </div>
  );
}

function PreviewItem({
  icon: Icon,
  label,
  meta,
}: {
  icon: LucideIcon;

  label: string;

  meta: string;
}) {
  return (
    <div className="preview-item">
      <span
        className="preview-icon"
        aria-hidden="true"
      >
        <Icon size={17} />
      </span>

      <span className="preview-item-copy">
        <strong>
          {label}
        </strong>

        <small>
          {meta}
        </small>
      </span>

      <ArrowRight
        className="preview-arrow"
        size={14}
        aria-hidden="true"
      />
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function FindYourSetupPage() {
  const reduceMotion =
    useReducedMotion();

  const [started, setStarted] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  const [step, setStep] =
    useState(0);

  const [answers, setAnswers] =
    useState<Answers>({});

  const questionHeadingRef =
    useRef<HTMLHeadingElement>(
      null,
    );

  const resultHeadingRef =
    useRef<HTMLHeadingElement>(
      null,
    );

  const currentQuestion =
    QUESTIONS[step];

  const selectedAnswer =
    answers[
      currentQuestion?.id
    ];

  const moduleScores =
    useMemo(
      () =>
        calculateModuleScores(
          answers,
        ),
      [answers],
    );

  const exclusions =
    useMemo(
      () =>
        calculateExclusions(
          answers,
        ),
      [answers],
    );

  const recommendedModules =
    useMemo(
      () =>
        getRecommendedModules(
          moduleScores,
          exclusions,
        ),
      [
        moduleScores,
        exclusions,
      ],
    );

  const considerLaterModules =
    useMemo(
      () =>
        getConsiderLaterModules(
          moduleScores,
          recommendedModules,
          exclusions,
        ),
      [
        moduleScores,
        recommendedModules,
        exclusions,
      ],
    );

  const notNeededModules =
    useMemo(
      () =>
        getNotNeededModules(
          recommendedModules,
          considerLaterModules,
        ),
      [
        recommendedModules,
        considerLaterModules,
      ],
    );

  const aiTier =
    useMemo(
      () =>
        getAiTier(
          answers,
        ),
      [answers],
    );

  const bundle =
    useMemo(
      () =>
        calculateBundle(
          recommendedModules,
          aiTier,
        ),
      [
        recommendedModules,
        aiTier,
      ],
    );

  const setupProfile =
    useMemo(
      () =>
        getSetupProfile(
          bundle,
        ),
      [bundle],
    );

  const signupUrl =
    useMemo(
      () =>
        buildBillingUrl(
          bundle,
        ),
      [bundle],
    );

  const displayedAiTier =
    bundle.isComplete
      ? "starter"
      : aiTier;

  const displayedAi =
    AI_TIERS[
      displayedAiTier
    ];

  /*
    Move keyboard/screen reader focus
    to the new question heading.
  */

  useEffect(() => {
    if (
      !started ||
      finished
    ) {
      return;
    }

    const frame =
      window.requestAnimationFrame(
        () => {
          questionHeadingRef.current?.focus();
        },
      );

    return () =>
      window.cancelAnimationFrame(
        frame,
      );
  }, [
    step,
    started,
    finished,
  ]);

  /*
    Move focus to result heading
    when quiz finishes.
  */

  useEffect(() => {
    if (!finished) {
      return;
    }

    const frame =
      window.requestAnimationFrame(
        () => {
          resultHeadingRef.current?.focus();
        },
      );

    return () =>
      window.cancelAnimationFrame(
        frame,
      );
  }, [finished]);

  const selectAnswer = (
    answerId: string,
  ) => {
    setAnswers(
      (previous) => ({
        ...previous,

        [currentQuestion.id]:
          answerId,
      }),
    );
  };

  const nextQuestion = () => {
    if (!selectedAnswer) {
      return;
    }

    if (
      step ===
      QUESTIONS.length - 1
    ) {
      setFinished(true);

      window.scrollTo({
        top: 0,

        behavior:
          reduceMotion
            ? "auto"
            : "smooth",
      });

      return;
    }

    setStep(
      (current) =>
        current + 1,
    );
  };

  const previousQuestion =
    () => {
      if (step === 0) {
        setStarted(false);

        return;
      }

      setStep(
        (current) =>
          current - 1,
      );
    };

  const restart = () => {
    setAnswers({});

    setStep(0);

    setFinished(false);

    setStarted(true);

    window.scrollTo({
      top: 0,

      behavior:
        reduceMotion
          ? "auto"
          : "smooth",
    });
  };

  const animationProps =
    reduceMotion
      ? {}
      : {
          initial: {
            opacity: 0,

            y: 12,

            scale: 0.995,
          },

          animate: {
            opacity: 1,

            y: 0,

            scale: 1,
          },

          exit: {
            opacity: 0,

            y: -8,

            scale: 0.995,
          },

          transition: {
            duration: 0.24,

            ease: [
              0.22,
              1,
              0.36,
              1,
            ] as const,
          },
        };

  return (
    <main className="setup-page">
      <style jsx global>{`
        :root {
          --cream:
            #faf8f5;

          --cream-deep:
            #f1ede7;

          --white:
            #fffefd;

          --charcoal:
            #4f4a46;

          --charcoal-dark:
            #393532;

          --charcoal-soft:
            #5e5955;

          --muted:
            #68635f;

          --tan:
            #c69d69;

          --tan-dark:
            #946f44;

          --tan-soft:
            #f3e8da;

          --sage:
            #a9b897;

          --sage-dark:
            #738463;

          --sage-light:
            #f0f4ec;

          --sage-strong:
            #657756;

          --danger:
            #8b4d48;

          --border:
            rgba(
              79,
              74,
              70,
              0.12
            );

          --border-strong:
            rgba(
              79,
              74,
              70,
              0.22
            );

          --focus:
            #4f4a46;

          --shadow:
            0 26px 80px
            rgba(
              79,
              74,
              70,
              0.075
            );

          --shadow-soft:
            0 12px 34px
            rgba(
              79,
              74,
              70,
              0.05
            );
        }

        * {
          box-sizing:
            border-box;
        }

        html {
          scroll-behavior:
            smooth;
        }

        body {
          margin: 0;

          background:
            var(--cream);

          color:
            var(--charcoal);

          -webkit-font-smoothing:
            antialiased;

          text-rendering:
            optimizeLegibility;
        }

        button,
        input {
          font: inherit;
        }

        button,
        a,
        label {
          -webkit-tap-highlight-color:
            transparent;
        }

        a {
          color: inherit;
        }

        button:focus-visible,
        a:focus-visible {
          outline:
            3px solid
            var(--focus);

          outline-offset:
            3px;
        }

        .setup-page {
          position: relative;

          min-height:
            100vh;

          overflow:
            hidden;

          background:
            radial-gradient(
              circle at
              100% 0%,
              rgba(
                169,
                184,
                151,
                0.16
              ),
              transparent 32%
            ),
            radial-gradient(
              circle at
              0% 100%,
              rgba(
                198,
                157,
                105,
                0.1
              ),
              transparent 34%
            ),
            var(--cream);

          color:
            var(--charcoal);
        }

        /* ================================
           ACCESSIBILITY
        ================================= */

        .skip-link {
          position: fixed;

          top: 12px;
          left: 12px;

          z-index: 9999;

          transform:
            translateY(-180%);

          padding:
            11px 15px;

          border-radius:
            10px;

          background:
            var(--charcoal-dark);

          color:
            white;

          font-size:
            13px;

          font-weight:
            800;

          text-decoration:
            none;

          transition:
            transform
              160ms ease;
        }

        .skip-link:focus {
          transform:
            translateY(0);
        }

        .sr-only,
        .sr-only-radio {
          position:
            absolute !important;

          width: 1px !important;
          height: 1px !important;

          padding: 0 !important;
          margin: -1px !important;

          overflow:
            hidden !important;

          clip:
            rect(
              0,
              0,
              0,
              0
            ) !important;

          white-space:
            nowrap !important;

          border: 0 !important;
        }

        .question-title:focus,
        .result-title:focus {
          outline: none;
        }

        /* ================================
           HEADER
        ================================= */

        .setup-header {
          position: relative;

          z-index: 20;

          display: flex;

          align-items:
            center;

          justify-content:
            space-between;

          width: min(
            1180px,
            calc(
              100% - 40px
            )
          );

          min-height:
            82px;

          margin: 0 auto;

          border-bottom:
            1px solid
            var(--border);
        }

        .brand {
          display:
            inline-flex;

          align-items:
            center;

          gap: 10px;

          text-decoration:
            none;
        }

        .brand-logo {
          width: 34px;
          height: 34px;

          object-fit:
            contain;
        }

        .brand-word {
          font-size:
            13px;

          font-weight:
            850;

          letter-spacing:
            0.09em;
        }

        .home-link {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap: 8px;

          min-height:
            44px;

          padding:
            0 16px;

          border:
            1px solid
            var(--border);

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              0.58
            );

          color:
            var(
              --charcoal-soft
            );

          text-decoration:
            none;

          font-size:
            12px;

          font-weight:
            750;

          transition:
            transform
              160ms ease,
            background
              160ms ease,
            border-color
              160ms ease;
        }

        .home-link:hover {
          transform:
            translateY(-1px);

          background:
            var(--white);

          border-color:
            var(
              --border-strong
            );
        }

        /* ================================
           WRAPPER
        ================================= */

        .setup-wrap {
          position: relative;

          width: min(
            1180px,
            calc(
              100% - 40px
            )
          );

          margin: 0 auto;

          padding:
            58px 0 100px;
        }

        /* ================================
           INTRO
        ================================= */

        .intro-layout {
          display: grid;

          grid-template-columns:
            minmax(
              0,
              1.08fr
            )
            minmax(
              330px,
              0.72fr
            );

          gap: 82px;

          align-items:
            center;

          min-height:
            620px;
        }

        .eyebrow {
          display:
            inline-flex;

          align-items:
            center;

          gap: 9px;

          margin-bottom:
            22px;

          color:
            var(--tan-dark);

          font-size:
            11px;

          font-weight:
            850;

          letter-spacing:
            0.15em;

          text-transform:
            uppercase;
        }

        .eyebrow-dot {
          width: 8px;
          height: 8px;

          border-radius:
            50%;

          background:
            var(--sage-dark);

          box-shadow:
            0 0 0 5px
            rgba(
              169,
              184,
              151,
              0.2
            );
        }

        .intro-title {
          max-width:
            780px;

          margin: 0;

          font-size:
            clamp(
              52px,
              6.4vw,
              84px
            );

          line-height:
            0.97;

          letter-spacing:
            -0.057em;

          font-weight:
            640;
        }

        .intro-title em {
          color:
            var(--tan-dark);

          font-style:
            normal;
        }

        .intro-copy {
          max-width:
            660px;

          margin:
            29px 0 0;

          color:
            var(--muted);

          font-size:
            clamp(
              16px,
              1.55vw,
              18px
            );

          line-height:
            1.72;
        }

        .intro-actions {
          display: flex;

          flex-wrap:
            wrap;

          gap: 12px;

          margin-top:
            34px;
        }

        .primary-button,
        .secondary-button {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap: 9px;

          min-height:
            52px;

          padding:
            0 23px;

          border-radius:
            999px;

          font-size:
            13px;

          font-weight:
            820;

          text-decoration:
            none;

          cursor:
            pointer;

          transition:
            transform
              160ms ease,
            box-shadow
              160ms ease,
            background
              160ms ease,
            border-color
              160ms ease;
        }

        .primary-button {
          border: 0;

          background:
            var(--charcoal-dark);

          color: white;

          box-shadow:
            0 12px 26px
            rgba(
              57,
              53,
              50,
              0.15
            );
        }

        .primary-button:hover {
          transform:
            translateY(-2px);

          box-shadow:
            0 17px 34px
            rgba(
              57,
              53,
              50,
              0.19
            );
        }

        .secondary-button {
          border:
            1px solid
            var(
              --border-strong
            );

          background:
            rgba(
              255,
              255,
              255,
              0.3
            );

          color:
            var(--charcoal);
        }

        .secondary-button:hover {
          transform:
            translateY(-1px);

          background:
            var(--white);
        }

        .intro-meta {
          display: flex;

          flex-wrap:
            wrap;

          gap:
            15px 22px;

          margin-top:
            24px;

          color:
            var(--muted);

          font-size:
            12px;

          font-weight:
            650;
        }

        .intro-meta span {
          display:
            inline-flex;

          align-items:
            center;

          gap: 7px;
        }

        .intro-meta svg {
          color:
            var(--sage-strong);
        }

        /* ================================
           PREVIEW
        ================================= */

        .preview-card {
          position:
            relative;

          padding:
            30px;

          overflow:
            hidden;

          border:
            1px solid
            var(--border);

          border-radius:
            28px;

          background:
            rgba(
              255,
              254,
              253,
              0.82
            );

          backdrop-filter:
            blur(20px);

          box-shadow:
            var(--shadow);
        }

        .preview-card::before {
          content: "";

          position:
            absolute;

          top: -95px;
          right: -80px;

          width: 220px;
          height: 220px;

          border-radius:
            50%;

          background:
            radial-gradient(
              circle,
              rgba(
                169,
                184,
                151,
                0.24
              ),
              transparent 70%
            );

          pointer-events:
            none;
        }

        .preview-kicker {
          position:
            relative;

          color:
            var(--muted);

          font-size:
            11px;

          font-weight:
            850;

          letter-spacing:
            0.12em;

          text-transform:
            uppercase;
        }

        .preview-title {
          position:
            relative;

          margin:
            9px 0 0;

          font-size:
            25px;

          line-height:
            1.14;

          letter-spacing:
            -0.035em;
        }

        .preview-copy {
          position:
            relative;

          margin:
            12px 0 23px;

          color:
            var(--muted);

          font-size:
            13px;

          line-height:
            1.62;
        }

        .preview-list {
          position:
            relative;

          display: grid;

          gap: 9px;
        }

        .preview-item {
          display: flex;

          align-items:
            center;

          gap: 12px;

          min-height:
            58px;

          padding:
            11px 13px;

          border:
            1px solid
            var(--border);

          border-radius:
            15px;

          background:
            rgba(
              255,
              255,
              255,
              0.82
            );
        }

        .preview-icon {
          display: grid;

          place-items:
            center;

          width: 36px;
          height: 36px;

          flex:
            0 0 36px;

          border-radius:
            11px;

          background:
            var(--sage-light);

          color:
            var(--sage-strong);
        }

        .preview-item-copy {
          display: grid;

          gap: 2px;

          min-width: 0;
        }

        .preview-item-copy strong {
          font-size:
            13px;
        }

        .preview-item-copy small {
          color:
            var(--muted);

          font-size:
            11px;
        }

        .preview-arrow {
          margin-left:
            auto;

          color:
            var(--tan-dark);
        }

        .mini-result {
          position:
            relative;

          margin-top:
            20px;

          padding:
            17px;

          border-radius:
            17px;

          background:
            var(--charcoal-dark);

          color: white;
        }

        .mini-result-label {
          color:
            rgba(
              255,
              255,
              255,
              0.7
            );

          font-size:
            11px;

          font-weight:
            850;

          letter-spacing:
            0.11em;

          text-transform:
            uppercase;
        }

        .mini-result-value {
          display: flex;

          align-items:
            center;

          gap: 8px;

          margin-top:
            7px;

          font-size:
            16px;

          font-weight:
            760;
        }

        /* ================================
           QUIZ
        ================================= */

        .quiz-shell {
          width: min(
            940px,
            100%
          );

          margin:
            8px auto 0;
        }

        .quiz-top {
          display: flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          gap: 24px;

          margin-bottom:
            22px;
        }

        .quiz-progress-wrap {
          flex: 1;
        }

        .quiz-step {
          display: flex;

          align-items:
            center;

          flex-wrap:
            wrap;

          gap: 8px;

          color:
            var(--muted);

          font-size:
            12px;

          font-weight:
            700;
        }

        .quiz-step strong {
          color:
            var(--charcoal-dark);
        }

        .quiz-step-divider {
          width: 4px;
          height: 4px;

          border-radius:
            50%;

          background:
            rgba(
              79,
              74,
              70,
              0.36
            );
        }

        .progress-track {
          width: 100%;
          height: 6px;

          margin-top:
            10px;

          overflow:
            hidden;

          border-radius:
            999px;

          background:
            rgba(
              79,
              74,
              70,
              0.08
            );
        }

        .progress-value {
          height: 100%;

          border-radius:
            inherit;

          background:
            linear-gradient(
              90deg,
              var(--sage),
              var(--sage-strong)
            );

          transition:
            width 280ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            );
        }

        .progress-dots {
          display: flex;

          gap: 5px;

          margin-top:
            9px;
        }

        .progress-dot {
          width: 6px;
          height: 6px;

          border-radius:
            999px;

          background:
            rgba(
              79,
              74,
              70,
              0.14
            );

          transition:
            180ms ease;
        }

        .progress-dot.complete {
          background:
            var(--sage);
        }

        .progress-dot.active {
          width: 18px;

          background:
            var(--sage-strong);
        }

        .quiz-time {
          color:
            var(--muted);

          font-size:
            11px;

          line-height:
            1.4;

          text-align:
            right;

          white-space:
            nowrap;
        }

        .question-card {
          position:
            relative;

          padding:
            43px 44px 35px;

          overflow:
            hidden;

          border:
            1px solid
            var(--border);

          border-radius:
            30px;

          background:
            rgba(
              255,
              254,
              253,
              0.84
            );

          backdrop-filter:
            blur(18px);

          box-shadow:
            var(--shadow);
        }

        .question-card::before {
          content: "";

          position:
            absolute;

          top: -100px;
          right: -80px;

          width: 270px;
          height: 270px;

          border-radius:
            50%;

          background:
            radial-gradient(
              circle,
              rgba(
                169,
                184,
                151,
                0.14
              ),
              transparent 68%
            );

          pointer-events:
            none;
        }

        .question-heading {
          position:
            relative;

          display: grid;

          grid-template-columns:
            auto
            minmax(
              0,
              1fr
            );

          gap: 17px;

          align-items:
            start;
        }

        .question-icon {
          display: grid;

          place-items:
            center;

          width: 48px;
          height: 48px;

          border-radius:
            14px;

          background:
            var(--sage-light);

          color:
            var(--sage-strong);
        }

        .question-eyebrow {
          margin-bottom:
            7px;

          color:
            var(--tan-dark);

          font-size:
            11px;

          font-weight:
            850;

          letter-spacing:
            0.13em;

          text-transform:
            uppercase;
        }

        .question-title {
          max-width:
            730px;

          margin: 0;

          font-size:
            clamp(
              28px,
              3.5vw,
              39px
            );

          line-height:
            1.08;

          letter-spacing:
            -0.042em;

          font-weight:
            640;
        }

        .question-helper {
          margin:
            11px 0 0;

          color:
            var(--muted);

          font-size:
            13px;

          line-height:
            1.6;
        }

        .answer-fieldset {
          position:
            relative;

          min-width: 0;

          margin: 0;

          padding: 0;

          border: 0;
        }

        .answer-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );

          gap: 11px;

          margin-top:
            30px;
        }

        .answer-option {
          position:
            relative;

          display: flex;

          align-items:
            flex-start;

          gap: 13px;

          min-height:
            108px;

          padding:
            18px;

          overflow:
            hidden;

          border:
            1px solid
            var(--border);

          border-radius:
            18px;

          background:
            rgba(
              255,
              255,
              255,
              0.7
            );

          color:
            var(--charcoal);

          text-align:
            left;

          cursor:
            pointer;

          transition:
            transform
              160ms ease,
            border-color
              160ms ease,
            background
              160ms ease,
            box-shadow
              160ms ease;
        }

        .answer-option:hover {
          transform:
            translateY(-2px);

          border-color:
            rgba(
              101,
              119,
              86,
              0.46
            );

          background:
            rgba(
              255,
              255,
              255,
              0.96
            );
        }

        .answer-option.selected {
          border-color:
            var(--sage-strong);

          background:
            linear-gradient(
              135deg,
              var(--sage-light),
              rgba(
                255,
                255,
                255,
                0.92
              )
            );

          box-shadow:
            inset
            0 0 0 1px
            rgba(
              101,
              119,
              86,
              0.28
            ),
            0 9px 25px
            rgba(
              101,
              119,
              86,
              0.08
            );
        }

        .answer-option:has(
          .sr-only-radio:focus-visible
        ) {
          outline:
            3px solid
            var(--focus);

          outline-offset:
            3px;
        }

        .answer-marker {
          display: grid;

          place-items:
            center;

          width: 30px;
          height: 30px;

          flex:
            0 0 30px;

          border:
            1px solid
            var(--border);

          border-radius:
            9px;

          background:
            var(--white);

          color:
            var(--muted);

          font-size:
            11px;

          font-weight:
            850;

          transition:
            160ms ease;
        }

        .answer-option.selected
          .answer-marker {
          border-color:
            var(--sage-strong);

          background:
            var(--sage-strong);

          color: white;
        }

        .answer-content {
          display: grid;

          gap: 5px;

          min-width: 0;

          padding-right:
            19px;
        }

        .answer-title {
          font-size:
            14px;

          font-weight:
            820;

          line-height:
            1.37;
        }

        .answer-description {
          color:
            var(--muted);

          font-size:
            12px;

          line-height:
            1.5;
        }

        .answer-check {
          position:
            absolute;

          top: 14px;
          right: 14px;

          display: grid;

          place-items:
            center;

          width: 22px;
          height: 22px;

          border-radius:
            50%;

          background:
            var(--sage-strong);

          color: white;
        }

        .quiz-actions {
          position:
            relative;

          display: flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap: 14px;

          margin-top:
            24px;
        }

        .back-button {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap: 7px;

          min-height:
            46px;

          padding:
            0 13px;

          border: 0;

          border-radius:
            999px;

          background:
            transparent;

          color:
            var(--muted);

          font-size:
            12px;

          font-weight:
            750;

          cursor:
            pointer;
        }

        .back-button:hover {
          background:
            rgba(
              79,
              74,
              70,
              0.055
            );

          color:
            var(--charcoal);
        }

        .next-button {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap: 8px;

          min-height:
            50px;

          padding:
            0 22px;

          border: 0;

          border-radius:
            999px;

          background:
            var(--charcoal-dark);

          color: white;

          font-size:
            12px;

          font-weight:
            820;

          cursor:
            pointer;

          box-shadow:
            0 10px 22px
            rgba(
              57,
              53,
              50,
              0.14
            );

          transition:
            transform
              160ms ease,
            opacity
              160ms ease,
            box-shadow
              160ms ease;
        }

        .next-button:hover:not(
            :disabled
          ) {
          transform:
            translateY(-1px);

          box-shadow:
            0 14px 27px
            rgba(
              57,
              53,
              50,
              0.18
            );
        }

        .next-button:disabled {
          opacity: 0.38;

          box-shadow:
            none;

          cursor:
            not-allowed;
        }

        /* ================================
           RESULTS
        ================================= */

        .result-layout {
          width: min(
            1050px,
            100%
          );

          margin: 0 auto;
        }

        .result-intro {
          max-width:
            840px;
        }

        .result-pill {
          display:
            inline-flex;

          align-items:
            center;

          gap: 7px;

          margin-bottom:
            18px;

          padding:
            8px 13px;

          border-radius:
            999px;

          background:
            var(--sage-light);

          color:
            var(--sage-strong);

          font-size:
            11px;

          font-weight:
            820;
        }

        .result-title {
          margin: 0;

          font-size:
            clamp(
              45px,
              6.3vw,
              72px
            );

          line-height:
            0.99;

          letter-spacing:
            -0.055em;

          font-weight:
            630;
        }

        .result-title em {
          color:
            var(--tan-dark);

          font-style:
            normal;
        }

        .result-copy {
          max-width:
            710px;

          margin:
            21px 0 0;

          color:
            var(--muted);

          font-size:
            15px;

          line-height:
            1.72;
        }

        /* ================================
           PROFILE
        ================================= */

        .profile-card {
          display: grid;

          grid-template-columns:
            auto
            minmax(
              0,
              1fr
            );

          gap: 20px;

          align-items:
            center;

          margin-top:
            37px;

          padding:
            23px;

          border:
            1px solid
            var(--border);

          border-radius:
            23px;

          background:
            rgba(
              255,
              254,
              253,
              0.78
            );

          box-shadow:
            var(
              --shadow-soft
            );
        }

        .profile-icon {
          display: grid;

          place-items:
            center;

          width: 54px;
          height: 54px;

          border-radius:
            16px;

          background:
            var(--sage-light);

          color:
            var(--sage-strong);
        }

        .profile-eyebrow {
          color:
            var(--tan-dark);

          font-size:
            11px;

          font-weight:
            850;

          letter-spacing:
            0.12em;

          text-transform:
            uppercase;
        }

        .profile-title {
          margin:
            5px 0 0;

          font-size:
            22px;

          letter-spacing:
            -0.025em;
        }

        .profile-copy {
          max-width:
            760px;

          margin:
            7px 0 0;

          color:
            var(--muted);

          font-size:
            12px;

          line-height:
            1.62;
        }

        /* ================================
           SECTION HEADINGS
        ================================= */

        .section-heading {
          display: flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          gap: 20px;

          margin:
            45px 0 16px;
        }

        .section-label {
          color:
            var(--tan-dark);

          font-size:
            11px;

          font-weight:
            850;

          letter-spacing:
            0.13em;

          text-transform:
            uppercase;
        }

        .section-helper {
          color:
            var(--muted);

          font-size:
            11px;

          text-align:
            right;
        }

        /* ================================
           MODULE CARDS
        ================================= */

        .module-grid {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(
                0,
                1fr
              )
            );

          gap: 13px;
        }

        .module-card {
          display: flex;

          flex-direction:
            column;

          min-width: 0;

          padding:
            21px;

          border:
            1px solid
            var(--border);

          border-radius:
            20px;

          background:
            var(--white);

          box-shadow:
            var(
              --shadow-soft
            );
        }

        .module-top {
          display: flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap: 12px;

          margin-bottom:
            15px;
        }

        .module-icon {
          display: grid;

          place-items:
            center;

          width: 40px;
          height: 40px;

          border-radius:
            12px;

          background:
            var(--sage-light);

          color:
            var(--sage-strong);
        }

        .module-price {
          font-size:
            14px;

          font-weight:
            850;
        }

        .module-price small {
          color:
            var(--muted);

          font-size:
            10px;

          font-weight:
            650;
        }

        .module-title {
          margin:
            0 0 8px;

          font-size:
            18px;

          letter-spacing:
            -0.025em;
        }

        .module-description {
          margin: 0;

          color:
            var(--muted);

          font-size:
            12px;

          line-height:
            1.6;
        }

        .reason-box {
          display: grid;

          gap: 8px;

          margin-top:
            auto;

          padding-top:
            16px;
        }

        .reason {
          display: flex;

          align-items:
            flex-start;

          gap: 8px;

          color:
            var(
              --charcoal-soft
            );

          font-size:
            11px;

          line-height:
            1.47;
        }

        .reason svg {
          flex:
            0 0 auto;

          margin-top:
            1px;

          color:
            var(--sage-strong);
        }

        /* ================================
           LATER
        ================================= */

        .later-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );

          gap: 10px;
        }

        .later-card {
          display: flex;

          align-items:
            center;

          gap: 12px;

          padding:
            15px;

          border:
            1px dashed
            var(
              --border-strong
            );

          border-radius:
            16px;

          background:
            rgba(
              255,
              255,
              255,
              0.42
            );
        }

        .later-icon {
          display: grid;

          place-items:
            center;

          width: 36px;
          height: 36px;

          flex:
            0 0 36px;

          border-radius:
            10px;

          background:
            var(--cream-deep);

          color:
            var(--muted);
        }

        .later-copy strong {
          display: block;

          font-size:
            12px;
        }

        .later-copy span {
          display: block;

          margin-top: 3px;

          color:
            var(--muted);

          font-size:
            10px;
        }

        /* ================================
           PACKAGE
        ================================= */

        .package-card {
          display: grid;

          grid-template-columns:
            minmax(
              0,
              1fr
            )
            250px;

          overflow:
            hidden;

          border-radius:
            27px;

          background:
            var(--charcoal-dark);

          color:
            white;

          box-shadow:
            0 28px 70px
            rgba(
              57,
              53,
              50,
              0.18
            );
        }

        .package-main {
          padding:
            32px;
        }

        .package-eyebrow {
          color:
            var(--sage);

          font-size:
            11px;

          font-weight:
            850;

          letter-spacing:
            0.13em;

          text-transform:
            uppercase;
        }

        .package-title {
          margin:
            8px 0 0;

          font-size:
            clamp(
              29px,
              4vw,
              43px
            );

          line-height: 1;

          letter-spacing:
            -0.045em;
        }

        .package-copy {
          max-width:
            620px;

          margin:
            14px 0 0;

          color:
            rgba(
              255,
              255,
              255,
              0.74
            );

          font-size:
            12px;

          line-height:
            1.67;
        }

        .package-tags {
          display: flex;

          flex-wrap:
            wrap;

          gap: 7px;

          margin-top:
            17px;
        }

        .package-tag {
          padding:
            7px 10px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.16
            );

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              0.06
            );

          color:
            rgba(
              255,
              255,
              255,
              0.9
            );

          font-size:
            10px;

          font-weight:
            700;
        }

        .package-price {
          display: flex;

          flex-direction:
            column;

          justify-content:
            center;

          padding:
            30px;

          border-left:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          background:
            rgba(
              255,
              255,
              255,
              0.04
            );
        }

        .price-label {
          color:
            rgba(
              255,
              255,
              255,
              0.7
            );

          font-size:
            11px;

          font-weight:
            750;

          text-transform:
            uppercase;

          letter-spacing:
            0.09em;
        }

        .price-old {
          min-height:
            18px;

          margin-top:
            8px;

          color:
            rgba(
              255,
              255,
              255,
              0.62
            );

          font-size:
            12px;

          text-decoration:
            line-through;
        }

        .price-main {
          margin-top:
            3px;

          font-size:
            46px;

          line-height: 1;

          letter-spacing:
            -0.05em;

          font-weight:
            700;
        }

        .price-main small {
          font-size:
            12px;

          color:
            rgba(
              255,
              255,
              255,
              0.7
            );

          letter-spacing: 0;
        }

        .saving-pill {
          align-self:
            flex-start;

          display:
            inline-flex;

          align-items:
            center;

          gap: 6px;

          margin-top:
            12px;

          padding:
            7px 9px;

          border-radius:
            999px;

          background:
            rgba(
              169,
              184,
              151,
              0.18
            );

          color:
            #c9d8bc;

          font-size:
            10px;

          font-weight:
            800;
        }

        /* ================================
           COMPLETE MESSAGE
        ================================= */

        .complete-upgrade {
          display: flex;

          align-items:
            flex-start;

          gap: 10px;

          margin-top:
            13px;

          padding:
            14px 16px;

          border:
            1px solid
            rgba(
              115,
              132,
              99,
              0.3
            );

          border-radius:
            16px;

          background:
            var(--sage-light);

          color:
            var(
              --charcoal-soft
            );

          font-size:
            12px;

          line-height:
            1.55;
        }

        .complete-upgrade svg {
          flex:
            0 0 auto;

          margin-top:
            1px;

          color:
            var(--sage-strong);
        }

        /* ================================
           AI
        ================================= */

        .ai-card {
          display: grid;

          grid-template-columns:
            auto
            minmax(
              0,
              1fr
            )
            auto;

          gap: 16px;

          align-items:
            center;

          margin-top:
            13px;

          padding:
            19px;

          border:
            1px solid
            var(--border);

          border-radius:
            19px;

          background:
            rgba(
              255,
              254,
              253,
              0.82
            );

          box-shadow:
            var(
              --shadow-soft
            );
        }

        .ai-icon {
          display: grid;

          place-items:
            center;

          width: 43px;
          height: 43px;

          border-radius:
            13px;

          background:
            var(--tan-soft);

          color:
            var(--tan-dark);
        }

        .ai-eyebrow {
          color:
            var(--tan-dark);

          font-size:
            11px;

          font-weight:
            850;

          letter-spacing:
            0.11em;

          text-transform:
            uppercase;
        }

        .ai-title {
          margin:
            4px 0 0;

          font-size:
            16px;
        }

        .ai-copy {
          margin:
            5px 0 0;

          color:
            var(--muted);

          font-size:
            11px;

          line-height:
            1.58;
        }

        .ai-price {
          text-align:
            right;

          white-space:
            nowrap;
        }

        .ai-price strong {
          display: block;

          font-size:
            20px;
        }

        .ai-price span {
          display: block;

          margin-top: 3px;

          color:
            var(--muted);

          font-size:
            10px;
        }

        .ai-upgrade-note {
          display: flex;

          align-items:
            flex-start;

          gap: 7px;

          margin:
            10px 0 0;

          padding:
            10px 12px;

          border-radius:
            11px;

          background:
            rgba(
              198,
              157,
              105,
              0.13
            );

          color:
            var(
              --charcoal-soft
            );

          font-size:
            11px;

          line-height:
            1.52;
        }

        .ai-upgrade-note svg {
          flex:
            0 0 auto;

          margin-top:
            1px;

          color:
            var(--tan-dark);
        }

        /* ================================
           TRUST CARD
        ================================= */

        .trust-card {
          margin-top:
            13px;

          padding:
            18px;

          border:
            1px solid
            var(--border);

          border-radius:
            18px;

          background:
            rgba(
              255,
              255,
              255,
              0.44
            );
        }

        .trust-title {
          display: flex;

          align-items:
            center;

          gap: 7px;

          font-size:
            11px;

          font-weight:
            800;
        }

        .trust-title svg {
          color:
            var(--sage-strong);
        }

        .not-needed-list {
          display: flex;

          flex-wrap:
            wrap;

          gap: 7px;

          margin-top:
            11px;
        }

        .not-needed-chip {
          display:
            inline-flex;

          align-items:
            center;

          gap: 5px;

          padding:
            7px 9px;

          border-radius:
            999px;

          background:
            rgba(
              79,
              74,
              70,
              0.065
            );

          color:
            var(--muted);

          font-size:
            10px;

          font-weight:
            700;
        }

        /* ================================
           ACTIONS
        ================================= */

        .result-actions {
          display: flex;

          flex-wrap:
            wrap;

          gap: 10px;

          margin-top:
            25px;
        }

        .result-primary,
        .result-secondary {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap: 8px;

          min-height:
            50px;

          padding:
            0 21px;

          border-radius:
            999px;

          font-size:
            12px;

          font-weight:
            820;

          text-decoration:
            none;

          cursor:
            pointer;

          transition:
            transform
              160ms ease,
            box-shadow
              160ms ease,
            background
              160ms ease;
        }

        .result-primary {
          border:
            1px solid
            var(--charcoal-dark);

          background:
            var(--charcoal-dark);

          color: white;

          box-shadow:
            0 10px 24px
            rgba(
              57,
              53,
              50,
              0.14
            );
        }

        .result-primary:hover {
          transform:
            translateY(-1px);

          box-shadow:
            0 14px 28px
            rgba(
              57,
              53,
              50,
              0.18
            );
        }

        .result-secondary {
          border:
            1px solid
            var(
              --border-strong
            );

          background:
            transparent;

          color:
            var(--charcoal);
        }

        .result-secondary:hover {
          transform:
            translateY(-1px);

          background:
            rgba(
              255,
              255,
              255,
              0.6
            );
        }

        .result-footnote {
          display: flex;

          align-items:
            flex-start;

          gap: 7px;

          margin-top:
            16px;

          color:
            var(--muted);

          font-size:
            11px;

          line-height:
            1.5;
        }

        .result-footnote svg {
          flex:
            0 0 auto;

          margin-top:
            1px;

          color:
            var(--sage-strong);
        }

        /* ================================
           RESPONSIVE
        ================================= */

        @media (
          max-width: 930px
        ) {
          .intro-layout {
            grid-template-columns:
              1fr;

            gap: 42px;

            min-height:
              auto;
          }

          .preview-card {
            max-width:
              650px;
          }

          .module-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
          }
        }

        @media (
          max-width: 720px
        ) {
          .setup-header {
            width:
              calc(
                100% - 28px
              );

            min-height:
              70px;
          }

          .setup-wrap {
            width:
              calc(
                100% - 28px
              );

            padding:
              38px 0 72px;
          }

          .brand-logo {
            width: 30px;
            height: 30px;
          }

          .home-link {
            width: 44px;

            padding: 0;
          }

          .home-link span {
            display: none;
          }

          .intro-title {
            font-size:
              clamp(
                45px,
                13vw,
                64px
              );
          }

          .intro-copy {
            margin-top:
              23px;
          }

          .preview-card {
            padding:
              23px;
          }

          .quiz-top {
            align-items:
              flex-start;
          }

          .quiz-time {
            display: none;
          }

          .question-card {
            padding:
              28px 18px
              22px;

            border-radius:
              23px;
          }

          .question-heading {
            grid-template-columns:
              1fr;

            gap: 13px;
          }

          .question-icon {
            width: 43px;
            height: 43px;
          }

          .answer-grid {
            grid-template-columns:
              1fr;

            margin-top:
              24px;
          }

          .answer-option {
            min-height:
              96px;
          }

          .module-grid,
          .later-grid {
            grid-template-columns:
              1fr;
          }

          .package-card {
            grid-template-columns:
              1fr;
          }

          .package-price {
            border-top:
              1px solid
              rgba(
                255,
                255,
                255,
                0.1
              );

            border-left: 0;
          }

          .ai-card {
            grid-template-columns:
              auto
              minmax(
                0,
                1fr
              );
          }

          .ai-price {
            grid-column:
              1 / -1;

            padding-left:
              59px;

            text-align:
              left;
          }
        }

        @media (
          max-width: 460px
        ) {
          .setup-header,
          .setup-wrap {
            width:
              calc(
                100% - 22px
              );
          }

          .intro-title {
            font-size:
              45px;
          }

          .intro-actions {
            display: grid;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
          }

          .intro-meta {
            display: grid;

            gap: 10px;
          }

          .quiz-actions {
            gap: 5px;
          }

          .back-button {
            padding:
              0 8px;
          }

          .next-button {
            padding:
              0 16px;
          }

          .profile-card {
            grid-template-columns:
              1fr;

            gap: 14px;
          }

          .section-heading {
            align-items:
              flex-start;

            flex-direction:
              column;

            gap: 5px;
          }

          .section-helper {
            text-align:
              left;
          }

          .package-main,
          .package-price {
            padding:
              25px 21px;
          }

          .result-actions {
            display: grid;
          }

          .result-primary,
          .result-secondary {
            width: 100%;
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          *,
          *::before,
          *::after {
            scroll-behavior:
              auto !important;

            animation-duration:
              0.01ms !important;

            animation-iteration-count:
              1 !important;

            transition-duration:
              0.01ms !important;
          }
        }
      `}</style>

      <a
        href="#setup-content"
        className="skip-link"
      >
        Skip to quiz content
      </a>

      <header className="setup-header">
        <Logo />

        <a
          href={HOME_URL}
          className="home-link"
        >
          <Home
            size={14}
            aria-hidden="true"
          />

          <span>
            Back to TOTS-OS
          </span>
        </a>
      </header>

      <div
        id="setup-content"
        className="setup-wrap"
      >
        <AnimatePresence mode="wait">
          {!started &&
            !finished && (
              <motion.section
                key="intro"
                className="intro-layout"
                {...animationProps}
              >
                <div>
                  <div className="eyebrow">
                    <span
                      className="eyebrow-dot"
                      aria-hidden="true"
                    />

                    Build your
                    TOTS-OS
                  </div>

                  <h1 className="intro-title">
                    Find the setup
                    your business{" "}
                    <em>
                      actually
                      needs.
                    </em>
                  </h1>

                  <p className="intro-copy">
                    Answer a few
                    questions about
                    how your
                    business works.
                    We'll recommend
                    the TOTS-OS
                    modules that
                    would make the
                    biggest
                    difference —
                    without making
                    you pay for
                    tools you
                    don't need.
                  </p>

                  <div className="intro-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        setStarted(
                          true,
                        )
                      }
                    >
                      Build my setup

                      <ArrowRight
                        size={16}
                        aria-hidden="true"
                      />
                    </button>

                    <a
                      href={HOME_URL}
                      className="secondary-button"
                    >
                      Explore
                      TOTS-OS
                    </a>
                  </div>

                  <div className="intro-meta">
                    <span>
                      <Check
                        size={13}
                        aria-hidden="true"
                      />

                      About 2
                      minutes
                    </span>

                    <span>
                      <Check
                        size={13}
                        aria-hidden="true"
                      />

                      Personalised
                      modules
                    </span>

                    <span>
                      <Check
                        size={13}
                        aria-hidden="true"
                      />

                      Pricing
                      calculated
                      for you
                    </span>

                    <span>
                      <Check
                        size={13}
                        aria-hidden="true"
                      />

                      No email
                      required
                    </span>
                  </div>
                </div>

                <div className="preview-card">
                  <div className="preview-kicker">
                    Built around
                    your business
                  </div>

                  <h2 className="preview-title">
                    Not another
                    one-size-fits-all
                    software plan.
                  </h2>

                  <p className="preview-copy">
                    We'll tell you
                    what we'd
                    start with,
                    what can wait
                    and what you
                    probably don't
                    need yet.
                  </p>

                  <div className="preview-list">
                    <PreviewItem
                      icon={
                        LayoutDashboard
                      }
                      label="Core"
                      meta="£29 / month"
                    />

                    <PreviewItem
                      icon={
                        FolderKanban
                      }
                      label="Clients & Projects"
                      meta="£29 / month"
                    />

                    <PreviewItem
                      icon={
                        Megaphone
                      }
                      label="Social Studio"
                      meta="£29 / month"
                    />

                    <PreviewItem
                      icon={Store}
                      label="Store"
                      meta="£29 / month"
                    />
                  </div>

                  <div className="mini-result">
                    <div className="mini-result-label">
                      Smart bundle
                      pricing
                    </div>

                    <div className="mini-result-value">
                      <WandSparkles
                        size={16}
                        aria-hidden="true"
                      />

                      Complete from
                      £139
                      /month.
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

          {started &&
            !finished && (
              <motion.section
                key={`question-${step}`}
                className="quiz-shell"
                {...animationProps}
                aria-labelledby="current-question-heading"
              >
                <div className="quiz-top">
                  <div className="quiz-progress-wrap">
                    <div
                      className="quiz-step"
                      aria-live="polite"
                    >
                      <span>
                        Question{" "}

                        <strong>
                          {step + 1}
                        </strong>{" "}

                        of{" "}

                        {
                          QUESTIONS.length
                        }
                      </span>

                      <span
                        className="quiz-step-divider"
                        aria-hidden="true"
                      />

                      <span>
                        {
                          currentQuestion.eyebrow
                        }
                      </span>
                    </div>

                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-label="Quiz progress"
                      aria-valuemin={1}
                      aria-valuemax={
                        QUESTIONS.length
                      }
                      aria-valuenow={
                        step + 1
                      }
                      aria-valuetext={`Question ${
                        step + 1
                      } of ${
                        QUESTIONS.length
                      }`}
                    >
                      <div
                        className="progress-value"
                        style={{
                          width: `${
                            ((step +
                              1) /
                              QUESTIONS.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    <ProgressDots
                      current={
                        step
                      }
                    />
                  </div>

                  <div className="quiz-time">
                    Your result is
                    being built as
                    you go
                  </div>
                </div>

                <div className="question-card">
                  <div className="question-heading">
                    <div
                      className="question-icon"
                      aria-hidden="true"
                    >
                      {(() => {
                        const Icon =
                          currentQuestion.icon;

                        return (
                          <Icon
                            size={
                              21
                            }
                          />
                        );
                      })()}
                    </div>

                    <div>
                      <div className="question-eyebrow">
                        {
                          currentQuestion.eyebrow
                        }
                      </div>

                      <h1
                        ref={
                          questionHeadingRef
                        }
                        id="current-question-heading"
                        tabIndex={-1}
                        className="question-title"
                      >
                        {
                          currentQuestion.question
                        }
                      </h1>

                      <p className="question-helper">
                        {
                          currentQuestion.helper
                        }
                      </p>
                    </div>
                  </div>

                  <fieldset className="answer-fieldset">
                    <legend className="sr-only">
                      {
                        currentQuestion.question
                      }
                    </legend>

                    <div className="answer-grid">
                      {currentQuestion.options.map(
                        (
                          option,
                          index,
                        ) => {
                          const selected =
                            selectedAnswer ===
                            option.id;

                          return (
                            <label
                              key={
                                option.id
                              }
                              className={[
                                "answer-option",

                                selected
                                  ? "selected"
                                  : "",
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  " ",
                                )}
                            >
                              <input
                                type="radio"
                                name={
                                  currentQuestion.id
                                }
                                value={
                                  option.id
                                }
                                checked={
                                  selected
                                }
                                onChange={() =>
                                  selectAnswer(
                                    option.id,
                                  )
                                }
                                className="sr-only-radio"
                              />

                              <span
                                className="answer-marker"
                                aria-hidden="true"
                              >
                                {String.fromCharCode(
                                  65 +
                                    index,
                                )}
                              </span>

                              <span className="answer-content">
                                <span className="answer-title">
                                  {
                                    option.label
                                  }
                                </span>

                                {option.description && (
                                  <span className="answer-description">
                                    {
                                      option.description
                                    }
                                  </span>
                                )}
                              </span>

                              {selected && (
                                <span
                                  className="answer-check"
                                  aria-hidden="true"
                                >
                                  <Check
                                    size={
                                      12
                                    }
                                  />
                                </span>
                              )}
                            </label>
                          );
                        },
                      )}
                    </div>
                  </fieldset>

                  <div className="quiz-actions">
                    <button
                      type="button"
                      className="back-button"
                      onClick={
                        previousQuestion
                      }
                    >
                      <ChevronLeft
                        size={16}
                        aria-hidden="true"
                      />

                      Back
                    </button>

                    <button
                      type="button"
                      className="next-button"
                      disabled={
                        !selectedAnswer
                      }
                      onClick={
                        nextQuestion
                      }
                    >
                      {step ===
                      QUESTIONS.length -
                        1
                        ? "Build my TOTS-OS"
                        : "Continue"}

                      {step ===
                      QUESTIONS.length -
                      1 ? (
                        <Sparkles
                          size={15}
                          aria-hidden="true"
                        />
                      ) : (
                        <ArrowRight
                          size={15}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

          {finished && (
            <motion.section
              key="result"
              className="result-layout"
              {...animationProps}
              aria-labelledby="result-heading"
            >
              <div className="result-intro">
                <div
                  className="result-pill"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2
                    size={13}
                    aria-hidden="true"
                  />

                  Your recommended
                  TOTS-OS setup is
                  ready
                </div>

                <h1
                  ref={
                    resultHeadingRef
                  }
                  id="result-heading"
                  tabIndex={-1}
                  className="result-title"
                >
                  This is where
                  we'd{" "}
                  <em>
                    start.
                  </em>
                </h1>

                <p className="result-copy">
                  Your answers
                  have been used
                  to build a
                  starting setup
                  around the areas
                  most likely to
                  make a
                  difference now.
                  You can always
                  add more later
                  as your
                  business
                  changes.
                </p>
              </div>

              <section
                className="profile-card"
                aria-labelledby="profile-title"
              >
                <div
                  className="profile-icon"
                  aria-hidden="true"
                >
                  <Sparkles
                    size={21}
                  />
                </div>

                <div>
                  <div className="profile-eyebrow">
                    {
                      setupProfile.eyebrow
                    }
                  </div>

                  <h2
                    id="profile-title"
                    className="profile-title"
                  >
                    {
                      setupProfile.title
                    }
                  </h2>

                  <p className="profile-copy">
                    {
                      setupProfile.description
                    }
                  </p>
                </div>
              </section>

              <div className="section-heading">
                <div className="section-label">
                  Recommended
                  from your
                  answers
                </div>

                <div className="section-helper">
                  {
                    recommendedModules.length
                  }{" "}
                  {recommendedModules.length ===
                  1
                    ? "module"
                    : "modules"}{" "}
                  matched to your
                  needs
                </div>
              </div>

              <div className="module-grid">
                {recommendedModules.map(
                  (key) => {
                    const module =
                      MODULE_INFO[
                        key
                      ];

                    const Icon =
                      module.icon;

                    const reasons =
                      getModuleReasons(
                        key,
                        answers,
                      );

                    return (
                      <article
                        key={key}
                        className="module-card"
                      >
                        <div className="module-top">
                          <span
                            className="module-icon"
                            aria-hidden="true"
                          >
                            <Icon
                              size={
                                18
                              }
                            />
                          </span>

                          <div className="module-price">
                            £
                            {
                              module.price
                            }

                            <small>
                              /mo
                            </small>
                          </div>
                        </div>

                        <h3 className="module-title">
                          {
                            module.title
                          }
                        </h3>

                        <p className="module-description">
                          {
                            module.description
                          }
                        </p>

                        {reasons.length >
                          0 && (
                          <div className="reason-box">
                            {reasons.map(
                              (
                                reason,
                                index,
                              ) => (
                                <div
                                  key={`${reason.questionId}-${index}`}
                                  className="reason"
                                >
                                  <CheckCircle2
                                    size={
                                      12
                                    }
                                    aria-hidden="true"
                                  />

                                  <span>
                                    {
                                      reason.text
                                    }
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </article>
                    );
                  },
                )}
              </div>

              {!bundle.isComplete &&
                considerLaterModules.length >
                  0 && (
                  <>
                    <div className="section-heading">
                      <div className="section-label">
                        Worth
                        considering
                        later
                      </div>

                      <div className="section-helper">
                        Useful, but
                        not essential
                        to start with
                      </div>
                    </div>

                    <div className="later-grid">
                      {considerLaterModules.map(
                        (key) => {
                          const module =
                            MODULE_INFO[
                              key
                            ];

                          const Icon =
                            module.icon;

                          return (
                            <div
                              key={
                                key
                              }
                              className="later-card"
                            >
                              <div
                                className="later-icon"
                                aria-hidden="true"
                              >
                                <Icon
                                  size={
                                    16
                                  }
                                />
                              </div>

                              <div className="later-copy">
                                <strong>
                                  {
                                    module.title
                                  }
                                </strong>

                                <span>
                                  Add
                                  later
                                  from £
                                  {
                                    module.price
                                  }
                                  /month
                                </span>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </>
                )}

              <div className="section-heading">
                <div className="section-label">
                  Your monthly
                  setup
                </div>

                <div className="section-helper">
                  Best-value
                  pricing applied
                  automatically
                </div>
              </div>

              <section
                className="package-card"
                aria-labelledby="package-title"
              >
                <div className="package-main">
                  <div className="package-eyebrow">
                    {bundle.isComplete
                      ? "Best value for your setup"
                      : "Your recommended configuration"}
                  </div>

                  <h2
                    id="package-title"
                    className="package-title"
                  >
                    {
                      bundle.bundleName
                    }
                  </h2>

                  <p className="package-copy">
                    {bundle.isComplete
                      ? "Your answers recommend all six main modules, so TOTS-OS Complete gives you the full workspace plus Clarity AI Starter for one fixed £139 monthly price."
                      : bundle.moduleCount ===
                          5
                        ? "Your five-module bundle is £119/month, applied automatically."
                        : bundle.moduleCount >=
                            3
                          ? "Your fixed module bundle price has been applied automatically."
                          : "You're starting with a focused setup, so you're only paying for the modules we'd recommend using now."}
                  </p>

                  <div className="package-tags">
                    {bundle.displayedModules.map(
                      (key) => (
                        <span
                          key={
                            key
                          }
                          className="package-tag"
                        >
                          {
                            MODULE_INFO[
                              key
                            ]
                              .shortTitle
                          }
                        </span>
                      ),
                    )}

                    {bundle.isComplete ? (
                      <span className="package-tag">
                        Clarity AI
                        Starter
                      </span>
                    ) : aiTier !==
                      "none" ? (
                      <span className="package-tag">
                        {
                          AI_TIERS[
                            aiTier
                          ].title
                        }
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="package-price">
                  <div className="price-label">
                    Your monthly
                    total
                  </div>

                  <div className="price-old">
                    {bundle.isComplete &&
                    bundle.modularTotal >
                      COMPLETE_PRICE
                      ? `£${bundle.modularTotal}`
                      : !bundle.isComplete &&
                          bundle.moduleSaving >
                            0
                        ? `£${
                            bundle.undiscountedModuleTotal +
                            bundle.requestedAiPrice
                          }`
                        : ""}
                  </div>

                  <div className="price-main">
                    £
                    {
                      bundle.totalMonthly
                    }

                    <small>
                      /mo
                    </small>
                  </div>

                  {bundle.isComplete ? (
                    <div className="saving-pill">
                      <Check
                        size={10}
                        aria-hidden="true"
                      />

                      Complete · £139/month
                    </div>
                  ) : bundle.moduleSaving >
                    0 ? (
                    <div className="saving-pill">
                      <Check
                        size={10}
                        aria-hidden="true"
                      />

                      Save £
                      {
                        bundle.moduleSaving
                      }
                      /month
                    </div>
                  ) : null}
                </div>
              </section>

              {bundle.isComplete && (
                <div className="complete-upgrade">
                  <WandSparkles
                    size={16}
                    aria-hidden="true"
                  />

                  <div>
                    <strong>
                      All six modules
                      means Complete.
                    </strong>{" "}

                    Your answers recommend all six main TOTS-OS modules. Complete gives you the full workspace plus Clarity AI Starter for £139/month.
                  </div>
                </div>
              )}

              <section
                className="ai-card"
                aria-labelledby="ai-result-title"
              >
                <div
                  className="ai-icon"
                  aria-hidden="true"
                >
                  <BrainCircuit
                    size={19}
                  />
                </div>

                <div>
                  <div className="ai-eyebrow">
                    Clarity AI
                  </div>

                  <h3
                    id="ai-result-title"
                    className="ai-title"
                  >
                    {bundle.isComplete
                      ? "Clarity AI Starter · included"
                      : displayedAi.title}
                  </h3>

                  <p className="ai-copy">
                    {bundle.isComplete
                      ? "Every TOTS-OS Complete workspace includes Clarity AI Starter as standard."
                      : displayedAi.description}

                  </p>

                  {bundle.aiUpgradeSuggested && (
                    <div className="ai-upgrade-note">
                      <Sparkles
                        size={13}
                        aria-hidden="true"
                      />

                      <span>
                        Your answers
                        suggest you
                        may eventually
                        benefit from{" "}
                        <strong>
                          {
                            AI_TIERS[
                              bundle.requestedAiTier
                            ]
                              .title
                          }
                        </strong>
                        . We'd still
                        start you on
                        the included
                        Starter
                        and only upgrade
                        if you
                        actually need
                        more.
                      </span>
                    </div>
                  )}
                </div>

                <div className="ai-price">
                  {bundle.isComplete ? (
                    <>
                      <strong>
                        Included
                      </strong>

                      <span>
                        in £139
                        Complete
                      </span>
                    </>
                  ) : aiTier ===
                    "none" ? (
                    <>
                      <strong>
                        £0
                      </strong>

                      <span>
                        not added
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>
                        +£
                        {
                          AI_TIERS[
                            aiTier
                          ].price
                        }
                      </strong>

                      <span>
                        per month
                      </span>
                    </>
                  )}
                </div>
              </section>

              {!bundle.isComplete &&
                notNeededModules.length >
                  0 && (
                  <div className="trust-card">
                    <div className="trust-title">
                      <CheckCircle2
                        size={13}
                        aria-hidden="true"
                      />

                      We're not
                      recommending
                      everything.
                    </div>

                    <div className="not-needed-list">
                      {notNeededModules.map(
                        (key) => (
                          <span
                            key={
                              key
                            }
                            className="not-needed-chip"
                          >
                            <Minus
                              size={
                                10
                              }
                              aria-hidden="true"
                            />

                            {
                              MODULE_INFO[
                                key
                              ]
                                .shortTitle
                            }

                            {" "}
                            can wait
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

              <div className="result-actions">
                <a
                  href={
                    signupUrl
                  }
                  className="result-primary"
                >
                  Start my
                  14-day free
                  trial

                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                  />
                </a>

                <button
                  type="button"
                  className="result-secondary"
                  onClick={
                    restart
                  }
                >
                  <RotateCcw
                    size={14}
                    aria-hidden="true"
                  />

                  Retake quiz
                </button>

                <a
                  href={
                    HOME_URL
                  }
                  className="result-secondary"
                >
                  <ArrowLeft
                    size={14}
                    aria-hidden="true"
                  />

                  Explore
                  TOTS-OS
                </a>
              </div>

              <div className="result-footnote">
                <Check
                  size={12}
                  aria-hidden="true"
                />

                <span>
                  14-day free
                  trial · no card
                  details required
                  · Complete is £139/month
                  · add or remove
                  modules as your
                  business changes
                </span>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}