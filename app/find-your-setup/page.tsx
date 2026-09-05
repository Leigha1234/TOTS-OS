"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  ContactRound,
  FolderKanban,
  Home,
  LayoutDashboard,
  Megaphone,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  type CSSProperties,
  useMemo,
  useState,
} from "react";

/* ============================================================
   CONFIG
============================================================ */

const LOGO_SRC = "/icon.png";

const HOME_URL = "/";

const SIGNUP_URL =
  "https://tots-os.co.uk/login";

/* ============================================================
   TYPES
============================================================ */

type CategoryKey =
  | "organisation"
  | "crm"
  | "projects"
  | "finance"
  | "social"
  | "calendar"
  | "store"
  | "growth";

type PlanKey =
  | "Standard"
  | "Professional"
  | "Elite";

type AnswerOption = {
  id: string;
  label: string;
  description?: string;
  scores: Partial<
    Record<CategoryKey, number>
  >;
  planWeight?: Partial<
    Record<PlanKey, number>
  >;
};

type Question = {
  id: string;
  eyebrow: string;
  question: string;
  helper: string;
  icon: LucideIcon;
  options: AnswerOption[];
};

type CategoryInfo = {
  key: CategoryKey;
  title: string;
  shortTitle: string;
  description: string;
  recommendation: string;
  icon: LucideIcon;
};

type Answers = Record<
  string,
  string
>;

/* ============================================================
   CATEGORY CONTENT
============================================================ */

const CATEGORY_INFO: Record<
  CategoryKey,
  CategoryInfo
> = {
  organisation: {
    key: "organisation",
    title: "Business organisation",
    shortTitle: "Organisation",
    description:
      "Your information is spread across too many places, making it harder to see what needs your attention.",
    recommendation:
      "Use your TOTS-OS dashboard and Clarity to bring the important parts of the business into one central view.",
    icon: LayoutDashboard,
  },

  crm: {
    key: "crm",
    title: "Clients & CRM",
    shortTitle: "Clients",
    description:
      "Client details, enquiries and follow-ups could be easier to find and manage.",
    recommendation:
      "Bring contacts, clients, notes and project history together inside TOTS-OS CRM.",
    icon: ContactRound,
  },

  projects: {
    key: "projects",
    title: "Projects & tasks",
    shortTitle: "Projects",
    description:
      "Work, deadlines and responsibilities are taking more effort to keep track of than they should.",
    recommendation:
      "Use Projects and Tasks to keep current work, priorities and progress visible in one place.",
    icon: FolderKanban,
  },

  finance: {
    key: "finance",
    title: "Financial visibility",
    shortTitle: "Finances",
    description:
      "You could benefit from a clearer day-to-day view of money coming in, money going out and what is still due.",
    recommendation:
      "Use TOTS-OS Finance to keep invoices, expenses and business performance closer to the rest of your operations.",
    icon: CircleDollarSign,
  },

  social: {
    key: "social",
    title: "Marketing & content",
    shortTitle: "Social",
    description:
      "Marketing is becoming another disconnected part of the business rather than fitting naturally into your workflow.",
    recommendation:
      "Use Social Studio to plan content and keep marketing connected to everything else happening in the business.",
    icon: Megaphone,
  },

  calendar: {
    key: "calendar",
    title: "Planning & calendar",
    shortTitle: "Planning",
    description:
      "Dates, deadlines and commitments are living across different tools or relying too heavily on memory.",
    recommendation:
      "Use the TOTS-OS Calendar to bring deadlines, bookings, tasks and upcoming work together.",
    icon: CalendarDays,
  },

  store: {
    key: "store",
    title: "Selling online",
    shortTitle: "Store",
    description:
      "There is an opportunity to connect your online selling activity more closely with the rest of your business.",
    recommendation:
      "Use TOTS-OS Store to manage products and orders without separating selling from your wider business operations.",
    icon: Store,
  },

  growth: {
    key: "growth",
    title: "Growth & visibility",
    shortTitle: "Growth",
    description:
      "Your business is growing to the point where knowing what is happening at a glance is becoming increasingly important.",
    recommendation:
      "Use dashboards, reporting and Clarity to create a stronger operating rhythm as the business grows.",
    icon: BarChart3,
  },
};

/* ============================================================
   QUESTIONS
============================================================ */

const QUESTIONS: Question[] = [
  {
    id: "information",
    eyebrow: "Your current setup",
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
          organisation: 4,
          calendar: 2,
          growth: 2,
        },
        planWeight: {
          Standard: 1,
          Professional: 2,
        },
      },
      {
        id: "spreadsheets",
        label:
          "Across spreadsheets and several different apps",
        description:
          "Everything works, but nothing really talks to each other.",
        scores: {
          organisation: 4,
          crm: 2,
          projects: 2,
          growth: 2,
        },
        planWeight: {
          Professional: 3,
        },
      },
      {
        id: "systems",
        label:
          "I have systems, but they're disconnected",
        description:
          "There is structure, but I still jump between tools.",
        scores: {
          organisation: 3,
          growth: 3,
        },
        planWeight: {
          Professional: 3,
          Elite: 1,
        },
      },
      {
        id: "organised",
        label:
          "Most things are already pretty organised",
        description:
          "I'm looking to make a good setup even better.",
        scores: {
          growth: 2,
        },
        planWeight: {
          Standard: 2,
          Professional: 1,
        },
      },
    ],
  },

  {
    id: "clients",
    eyebrow: "Clients",
    question:
      "How are you currently keeping track of clients and enquiries?",
    helper:
      "Think contacts, follow-ups, notes and previous conversations.",
    icon: ContactRound,
    options: [
      {
        id: "memory",
        label:
          "Messages, inboxes and memory",
        description:
          "I usually know who I need to reply to... hopefully.",
        scores: {
          crm: 4,
          organisation: 2,
        },
        planWeight: {
          Standard: 1,
          Professional: 2,
        },
      },
      {
        id: "sheet",
        label:
          "A spreadsheet, notes app or basic list",
        description:
          "It works, but there is plenty of manual updating.",
        scores: {
          crm: 3,
          organisation: 2,
        },
        planWeight: {
          Standard: 1,
          Professional: 2,
        },
      },
      {
        id: "crm",
        label:
          "A separate CRM",
        description:
          "Client management is organised, but disconnected from other work.",
        scores: {
          crm: 1,
          organisation: 2,
          growth: 2,
        },
        planWeight: {
          Professional: 3,
        },
      },
      {
        id: "connected",
        label:
          "I already have a strong client process",
        description:
          "Contacts and follow-ups are easy to manage.",
        scores: {
          growth: 1,
        },
        planWeight: {
          Standard: 2,
        },
      },
    ],
  },

  {
    id: "projects",
    eyebrow: "Work",
    question:
      "When you start work for the day, how easy is it to see exactly what needs done?",
    helper:
      "Think tasks, projects, deadlines and priorities.",
    icon: FolderKanban,
    options: [
      {
        id: "figure-out",
        label:
          "I normally figure it out as I go",
        description:
          "Priorities live mostly in my head.",
        scores: {
          projects: 4,
          calendar: 3,
          organisation: 2,
        },
        planWeight: {
          Professional: 2,
        },
      },
      {
        id: "several-lists",
        label:
          "I check a few different lists, chats or calendars",
        description:
          "The information exists, just not in one place.",
        scores: {
          projects: 4,
          calendar: 3,
          organisation: 3,
        },
        planWeight: {
          Professional: 3,
        },
      },
      {
        id: "project-app",
        label:
          "I have a project or task management app",
        description:
          "Work is organised but sits separately from clients and finances.",
        scores: {
          projects: 1,
          organisation: 2,
          growth: 2,
        },
        planWeight: {
          Professional: 3,
        },
      },
      {
        id: "clear",
        label:
          "Very easy — I have a clear system",
        description:
          "I can quickly see priorities and deadlines.",
        scores: {
          growth: 1,
        },
        planWeight: {
          Standard: 2,
        },
      },
    ],
  },

  {
    id: "finance",
    eyebrow: "Money",
    question:
      "How confident are you about your business finances day to day?",
    helper:
      "We're talking about your own visibility — not what your accountant can see.",
    icon: CircleDollarSign,
    options: [
      {
        id: "avoid",
        label:
          "I mostly look when I absolutely have to",
        description:
          "Finance admin tends to get pushed down the list.",
        scores: {
          finance: 4,
          organisation: 1,
        },
        planWeight: {
          Professional: 2,
        },
      },
      {
        id: "roughly",
        label:
          "I know roughly, but getting the full picture takes work",
        description:
          "Information is spread across banking, invoices and spreadsheets.",
        scores: {
          finance: 4,
          organisation: 2,
        },
        planWeight: {
          Professional: 3,
        },
      },
      {
        id: "accounting",
        label:
          "I track everything in separate accounting software",
        description:
          "Finance is organised but separate from my daily operations.",
        scores: {
          finance: 1,
          organisation: 2,
          growth: 2,
        },
        planWeight: {
          Professional: 2,
          Elite: 1,
        },
      },
      {
        id: "clear",
        label:
          "I have a clear, up-to-date view",
        description:
          "I know what is coming in, going out and still outstanding.",
        scores: {
          growth: 1,
        },
        planWeight: {
          Standard: 2,
        },
      },
    ],
  },

  {
    id: "marketing",
    eyebrow: "Marketing",
    question:
      "What does your current marketing and social content process look like?",
    helper:
      "Think ideas, captions, assets, scheduling and keeping consistent.",
    icon: Megaphone,
    options: [
      {
        id: "last-minute",
        label:
          "Usually last minute",
        description:
          "I post when I remember or when I suddenly need to promote something.",
        scores: {
          social: 4,
          calendar: 2,
        },
        planWeight: {
          Professional: 2,
        },
      },
      {
        id: "many-tools",
        label:
          "Canva, notes, folders and scheduling tools",
        description:
          "I have a process, but it is spread across several places.",
        scores: {
          social: 4,
          organisation: 2,
        },
        planWeight: {
          Professional: 3,
        },
      },
      {
        id: "separate-system",
        label:
          "It's planned, but in a completely separate system",
        description:
          "Marketing works well but isn't connected to operations.",
        scores: {
          social: 2,
          organisation: 2,
          growth: 1,
        },
        planWeight: {
          Professional: 3,
        },
      },
      {
        id: "strong",
        label:
          "I already have a strong content workflow",
        description:
          "Planning and publishing are easy to stay on top of.",
        scores: {
          growth: 1,
        },
        planWeight: {
          Standard: 2,
        },
      },
    ],
  },

  {
    id: "selling",
    eyebrow: "Selling",
    question:
      "Do you sell — or want to sell — products online?",
    helper:
      "This could be physical products, merch or other items.",
    icon: ShoppingBag,
    options: [
      {
        id: "yes-disconnected",
        label:
          "Yes, and orders are another separate thing to manage",
        description:
          "Selling online adds more systems and admin.",
        scores: {
          store: 4,
          organisation: 3,
          growth: 2,
        },
        planWeight: {
          Professional: 2,
          Elite: 2,
        },
      },
      {
        id: "want-to",
        label:
          "Not yet, but I'd like to",
        description:
          "Online selling is something I want to introduce.",
        scores: {
          store: 3,
          growth: 2,
        },
        planWeight: {
          Professional: 2,
        },
      },
      {
        id: "already-good",
        label:
          "Yes, and my current store setup works well",
        description:
          "I'm mainly interested in the rest of my operations.",
        scores: {
          store: 1,
          growth: 1,
        },
        planWeight: {
          Professional: 1,
        },
      },
      {
        id: "no",
        label:
          "No — selling products isn't part of my business",
        description:
          "I mainly sell services or don't need an online shop.",
        scores: {},
        planWeight: {
          Standard: 1,
          Professional: 1,
        },
      },
    ],
  },

  {
    id: "admin",
    eyebrow: "Your time",
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
          organisation: 4,
          growth: 4,
          projects: 2,
        },
        planWeight: {
          Professional: 3,
          Elite: 2,
        },
      },
      {
        id: "three-five",
        label:
          "Around 3–5 hours",
        description:
          "There are definitely things that could be streamlined.",
        scores: {
          organisation: 3,
          growth: 3,
        },
        planWeight: {
          Professional: 3,
        },
      },
      {
        id: "one-two",
        label:
          "Around 1–2 hours",
        description:
          "It's manageable, but I'd still like to make things easier.",
        scores: {
          organisation: 2,
          growth: 1,
        },
        planWeight: {
          Standard: 1,
          Professional: 2,
        },
      },
      {
        id: "little",
        label:
          "Very little",
        description:
          "My processes are already pretty efficient.",
        scores: {
          growth: 1,
        },
        planWeight: {
          Standard: 2,
        },
      },
    ],
  },

  {
    id: "team",
    eyebrow: "Your business",
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
        scores: {},
        planWeight: {
          Standard: 3,
          Professional: 1,
        },
      },
      {
        id: "small-team",
        label:
          "Me and a small team",
        description:
          "A few people need to stay aligned.",
        scores: {
          projects: 2,
          growth: 2,
          organisation: 2,
        },
        planWeight: {
          Professional: 4,
        },
      },
      {
        id: "growing",
        label:
          "A growing team with different responsibilities",
        description:
          "More people need the right information at the right time.",
        scores: {
          projects: 3,
          growth: 4,
          organisation: 3,
        },
        planWeight: {
          Professional: 2,
          Elite: 4,
        },
      },
      {
        id: "clients-collab",
        label:
          "A team plus lots of active clients or projects",
        description:
          "There are several moving parts to keep visible.",
        scores: {
          crm: 2,
          projects: 3,
          growth: 4,
        },
        planWeight: {
          Elite: 5,
        },
      },
    ],
  },

  {
    id: "goal",
    eyebrow: "Your goal",
    question:
      "If TOTS-OS could solve one thing first, what would make the biggest difference?",
    helper:
      "There's no wrong answer — choose what would feel most valuable.",
    icon: Sparkles,
    options: [
      {
        id: "one-place",
        label:
          "Getting everything organised in one place",
        description:
          "Less searching, switching and remembering.",
        scores: {
          organisation: 4,
        },
        planWeight: {
          Professional: 2,
        },
      },
      {
        id: "control",
        label:
          "Feeling more in control of the business",
        description:
          "I want to know what is happening without digging for it.",
        scores: {
          growth: 4,
          organisation: 2,
        },
        planWeight: {
          Professional: 2,
          Elite: 1,
        },
      },
      {
        id: "time",
        label:
          "Getting hours of my week back",
        description:
          "I want less admin and fewer repetitive processes.",
        scores: {
          organisation: 3,
          projects: 2,
        },
        planWeight: {
          Professional: 3,
        },
      },
      {
        id: "scale",
        label:
          "Building systems that can grow with me",
        description:
          "I want a stronger foundation before the business gets busier.",
        scores: {
          growth: 4,
          organisation: 2,
        },
        planWeight: {
          Professional: 1,
          Elite: 4,
        },
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
      option.id === answerId,
  );
}

function calculateCategoryScores(
  answers: Answers,
) {
  const scores: Record<
    CategoryKey,
    number
  > = {
    organisation: 0,
    crm: 0,
    projects: 0,
    finance: 0,
    social: 0,
    calendar: 0,
    store: 0,
    growth: 0,
  };

  QUESTIONS.forEach((question) => {
    const option = getOption(
      question,
      answers[question.id],
    );

    if (!option) return;

    Object.entries(
      option.scores,
    ).forEach(
      ([key, value]) => {
        scores[
          key as CategoryKey
        ] += value ?? 0;
      },
    );
  });

  return scores;
}

function calculatePlan(
  answers: Answers,
): PlanKey {
  const scores: Record<
    PlanKey,
    number
  > = {
    Standard: 0,
    Professional: 0,
    Elite: 0,
  };

  QUESTIONS.forEach((question) => {
    const option = getOption(
      question,
      answers[question.id],
    );

    if (!option) return;

    Object.entries(
      option.planWeight ?? {},
    ).forEach(
      ([plan, value]) => {
        scores[
          plan as PlanKey
        ] += value ?? 0;
      },
    );
  });

  const sorted = (
    Object.entries(scores) as [
      PlanKey,
      number,
    ][]
  ).sort(
    (a, b) => b[1] - a[1],
  );

  return sorted[0][0];
}

function planPrice(
  plan: PlanKey,
) {
  switch (plan) {
    case "Standard":
      return 29;

    case "Professional":
      return 59;

    case "Elite":
      return 99;
  }
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

  const currentQuestion =
    QUESTIONS[step];

  const selectedAnswer =
    answers[currentQuestion?.id];

  const categoryScores = useMemo(
    () =>
      calculateCategoryScores(
        answers,
      ),
    [answers],
  );

  const recommendedPlan = useMemo(
    () =>
      calculatePlan(answers),
    [answers],
  );

  const topCategories = useMemo(
    () => {
      return (
        Object.entries(
          categoryScores,
        ) as [
          CategoryKey,
          number,
        ][]
      )
        .sort(
          (a, b) =>
            b[1] - a[1],
        )
        .filter(
          ([, score]) =>
            score > 0,
        )
        .slice(0, 3)
        .map(
          ([key, score]) => ({
            ...CATEGORY_INFO[key],
            score,
          }),
        );
    },
    [categoryScores],
  );

  const organisationScore =
    useMemo(() => {
      const total =
        Object.values(
          categoryScores,
        ).reduce(
          (sum, score) =>
            sum + score,
          0,
        );

      const maxApprox = 75;

      return Math.min(
        100,
        Math.max(
          10,
          Math.round(
            (total /
              maxApprox) *
              100,
          ),
        ),
      );
    }, [categoryScores]);

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
        behavior: "smooth",
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
      behavior: "smooth",
    });
  };

  const animationProps =
    reduceMotion
      ? {}
      : {
          initial: {
            opacity: 0,
            y: 16,
          },
          animate: {
            opacity: 1,
            y: 0,
          },
          exit: {
            opacity: 0,
            y: -12,
          },
          transition: {
            duration: 0.28,
            ease: "easeOut",
          },
        };

  return (
    <main className="setup-page">
      <style jsx global>{`
        :root {
          --cream: #f5f2eb;
          --cream-deep: #ebe6dc;
          --white: #fffefd;

          --charcoal: #373735;
          --charcoal-soft: #575753;
          --muted: #77756e;

          --tan: #c69d69;
          --tan-dark: #a77d4d;
          --tan-soft: #eadcc9;

          --sage: #aabd96;
          --sage-dark: #82996e;
          --sage-light: #eff3e9;

          --border: rgba(
            55,
            55,
            53,
            0.12
          );

          --border-strong: rgba(
            55,
            55,
            53,
            0.2
          );
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background:
            var(--cream);
          color:
            var(--charcoal);
        }

        button,
        input {
          font: inherit;
        }

        a {
          color: inherit;
        }

        .setup-page {
          min-height: 100vh;
          background:
            var(--cream);
          color:
            var(--charcoal);
          overflow: hidden;
        }

        /* ============================
           HEADER
        ============================ */

        .setup-header {
          position: relative;
          z-index: 20;

          display: flex;
          align-items: center;
          justify-content:
            space-between;

          width: min(
            1180px,
            calc(
              100% - 40px
            )
          );

          min-height: 86px;

          margin: 0 auto;

          border-bottom:
            1px solid
            var(--border);
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;

          color:
            var(--charcoal);
          text-decoration: none;
        }

        .brand-logo {
          width: 34px;
          height: 34px;
          object-fit: contain;
        }

        .brand-word {
          font-size: 14px;
          font-weight: 800;
          letter-spacing:
            0.08em;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .home-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          min-height: 42px;

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
              254,
              253,
              0.5
            );

          color:
            var(--charcoal-soft);

          text-decoration: none;

          font-size: 13px;
          font-weight: 700;

          transition:
            border-color
              160ms ease,
            background
              160ms ease;
        }

        .home-link:hover {
          border-color:
            var(
              --border-strong
            );

          background:
            var(--white);
        }

        /* ============================
           GENERAL WRAPPER
        ============================ */

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
            66px 0 90px;
        }

        .ambient {
          position: absolute;
          pointer-events: none;
          border-radius: 999px;
          filter: blur(1px);
        }

        .ambient-one {
          top: 26px;
          right: -190px;

          width: 470px;
          height: 470px;

          background:
            radial-gradient(
              circle,
              rgba(
                170,
                189,
                150,
                0.24
              ),
              rgba(
                170,
                189,
                150,
                0
              )
                68%
            );
        }

        .ambient-two {
          bottom: -140px;
          left: -180px;

          width: 430px;
          height: 430px;

          background:
            radial-gradient(
              circle,
              rgba(
                198,
                157,
                105,
                0.17
              ),
              rgba(
                198,
                157,
                105,
                0
              )
                68%
            );
        }

        /* ============================
           INTRO
        ============================ */

        .intro-layout {
          position: relative;
          z-index: 2;

          display: grid;

          grid-template-columns:
            minmax(0, 1.15fr)
            minmax(300px, 0.7fr);

          gap: 80px;

          align-items: center;

          min-height:
            620px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          margin-bottom: 22px;

          color:
            var(--tan-dark);

          font-size: 11px;
          font-weight: 800;

          letter-spacing:
            0.16em;

          text-transform:
            uppercase;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;

          border-radius:
            999px;

          background:
            var(--sage-dark);
        }

        .intro-title {
          max-width: 760px;

          margin: 0;

          font-size:
            clamp(
              48px,
              7vw,
              88px
            );

          line-height: 0.96;

          letter-spacing:
            -0.055em;

          font-weight: 650;
        }

        .intro-title em {
          color:
            var(--tan-dark);

          font-style: normal;
        }

        .intro-copy {
          max-width: 660px;

          margin:
            28px 0 0;

          color:
            var(--muted);

          font-size:
            clamp(
              16px,
              1.7vw,
              19px
            );

          line-height: 1.7;
        }

        .intro-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;

          margin-top: 34px;
        }

        .primary-button,
        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          min-height: 54px;

          padding:
            0 24px;

          border-radius:
            999px;

          border: none;

          cursor: pointer;

          font-size: 14px;
          font-weight: 800;

          transition:
            transform
              160ms ease,
            background
              160ms ease,
            border-color
              160ms ease;
        }

        .primary-button {
          background:
            var(--charcoal);

          color:
            var(--white);
        }

        .primary-button:hover {
          transform:
            translateY(-2px);
        }

        .secondary-button {
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

        .intro-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px 24px;

          margin-top: 24px;

          color:
            var(--muted);

          font-size: 12px;
        }

        .intro-meta span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .intro-meta svg {
          color:
            var(--sage-dark);
        }

        /* ============================
           INTRO SIDE CARD
        ============================ */

        .preview-card {
          position: relative;

          padding: 30px;

          border:
            1px solid
            var(--border);

          border-radius: 28px;

          background:
            rgba(
              255,
              254,
              253,
              0.66
            );

          backdrop-filter:
            blur(18px);

          box-shadow:
            0 22px 70px
            rgba(
              55,
              55,
              53,
              0.07
            );
        }

        .preview-kicker {
          margin-bottom: 8px;

          color:
            var(--muted);

          font-size: 11px;
          font-weight: 700;

          letter-spacing:
            0.1em;

          text-transform:
            uppercase;
        }

        .preview-title {
          margin: 0;

          font-size: 24px;
          line-height: 1.15;

          letter-spacing:
            -0.03em;
        }

        .preview-copy {
          margin:
            11px 0 24px;

          color:
            var(--muted);

          font-size: 13px;
          line-height: 1.6;
        }

        .preview-list {
          display: grid;
          gap: 9px;
        }

        .preview-item {
          display: flex;
          align-items: center;
          gap: 12px;

          padding: 13px 14px;

          border:
            1px solid
            var(--border);

          border-radius: 15px;

          background:
            var(--white);

          font-size: 13px;
          font-weight: 700;
        }

        .preview-icon {
          display: grid;
          place-items: center;

          width: 34px;
          height: 34px;

          flex: 0 0 34px;

          border-radius: 10px;

          background:
            var(--sage-light);

          color:
            var(--sage-dark);
        }

        .preview-arrow {
          margin-left: auto;

          color:
            var(--tan-dark);
        }

        .mini-result {
          margin-top: 22px;

          padding: 17px;

          border-radius: 17px;

          background:
            var(--charcoal);

          color:
            var(--white);
        }

        .mini-result-label {
          color:
            rgba(
              255,
              255,
              255,
              0.56
            );

          font-size: 10px;
          font-weight: 800;
          letter-spacing:
            0.1em;
          text-transform:
            uppercase;
        }

        .mini-result-value {
          margin-top: 6px;

          font-size: 18px;
          font-weight: 750;
        }

        /* ============================
           QUIZ
        ============================ */

        .quiz-shell {
          position: relative;
          z-index: 2;

          width: min(
            920px,
            100%
          );

          margin: 10px auto 0;
        }

        .quiz-top {
          display: flex;
          justify-content:
            space-between;
          align-items: flex-end;
          gap: 24px;

          margin-bottom: 25px;
        }

        .quiz-step {
          color:
            var(--muted);

          font-size: 12px;
          font-weight: 700;
        }

        .quiz-step strong {
          color:
            var(--charcoal);
        }

        .quiz-time {
          color:
            var(--muted);

          font-size: 12px;
        }

        .progress-track {
          width: 100%;
          height: 5px;

          margin-top: 10px;

          overflow: hidden;

          border-radius:
            999px;

          background:
            var(--cream-deep);
        }

        .progress-value {
          height: 100%;

          border-radius:
            999px;

          background:
            var(--sage-dark);

          transition:
            width
              240ms ease;
        }

        .progress-dots {
          display: flex;
          gap: 5px;

          margin-top: 10px;
        }

        .progress-dot {
          width: 6px;
          height: 6px;

          border-radius:
            999px;

          background:
            rgba(
              55,
              55,
              53,
              0.13
            );
        }

        .progress-dot.complete {
          background:
            var(--sage);
        }

        .progress-dot.active {
          width: 18px;

          background:
            var(--sage-dark);
        }

        .question-card {
          padding:
            45px 46px 38px;

          border:
            1px solid
            var(--border);

          border-radius: 30px;

          background:
            rgba(
              255,
              254,
              253,
              0.72
            );

          box-shadow:
            0 26px 80px
            rgba(
              55,
              55,
              53,
              0.06
            );
        }

        .question-heading {
          display: grid;

          grid-template-columns:
            auto minmax(0, 1fr);

          gap: 18px;

          align-items:
            flex-start;
        }

        .question-icon {
          display: grid;
          place-items: center;

          width: 48px;
          height: 48px;

          margin-top: 3px;

          border-radius: 14px;

          background:
            var(--sage-light);

          color:
            var(--sage-dark);
        }

        .question-eyebrow {
          margin-bottom: 7px;

          color:
            var(--tan-dark);

          font-size: 10px;
          font-weight: 800;

          letter-spacing:
            0.13em;

          text-transform:
            uppercase;
        }

        .question-title {
          max-width: 700px;

          margin: 0;

          font-size:
            clamp(
              28px,
              4vw,
              42px
            );

          line-height: 1.08;

          letter-spacing:
            -0.04em;

          font-weight: 650;
        }

        .question-helper {
          margin:
            12px 0 0;

          color:
            var(--muted);

          font-size: 14px;
          line-height: 1.55;
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

          gap: 12px;

          margin-top: 32px;
        }

        .answer-option {
          position: relative;

          display: flex;
          align-items: flex-start;
          gap: 14px;

          min-height: 106px;

          padding: 18px;

          text-align: left;

          border:
            1px solid
            var(--border);

          border-radius: 18px;

          background:
            rgba(
              255,
              255,
              255,
              0.67
            );

          color:
            var(--charcoal);

          cursor: pointer;

          transition:
            background
              160ms ease,
            border-color
              160ms ease,
            transform
              160ms ease,
            box-shadow
              160ms ease;
        }

        .answer-option:hover {
          transform:
            translateY(-2px);

          border-color:
            rgba(
              130,
              153,
              110,
              0.45
            );

          background:
            var(--white);
        }

        .answer-option.selected {
          border-color:
            var(--sage-dark);

          background:
            var(--sage-light);

          box-shadow:
            inset
              0 0 0 1px
              var(
                --sage-dark
              );
        }

        .answer-marker {
          display: grid;
          place-items: center;

          width: 30px;
          height: 30px;

          flex: 0 0 30px;

          border:
            1px solid
            var(--border);

          border-radius: 9px;

          background:
            var(--white);

          color:
            var(--muted);

          font-size: 11px;
          font-weight: 800;
        }

        .answer-option.selected
          .answer-marker {
          border-color:
            var(--sage-dark);

          background:
            var(--sage-dark);

          color: white;
        }

        .answer-content {
          min-width: 0;
        }

        .answer-title {
          display: block;

          margin-bottom: 5px;

          font-size: 14px;
          font-weight: 800;
          line-height: 1.35;
        }

        .answer-description {
          display: block;

          color:
            var(--muted);

          font-size: 12px;
          line-height: 1.5;
        }

        .answer-check {
          position: absolute;

          top: 14px;
          right: 14px;

          display: grid;
          place-items: center;

          width: 22px;
          height: 22px;

          border-radius:
            999px;

          background:
            var(--sage-dark);

          color: white;
        }

        .quiz-actions {
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          gap: 15px;

          margin-top: 24px;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          min-height: 48px;

          padding:
            0 18px;

          border: 0;

          background:
            transparent;

          color:
            var(--muted);

          cursor: pointer;

          font-size: 13px;
          font-weight: 700;
        }

        .next-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;

          min-height: 50px;

          padding:
            0 23px;

          border: 0;

          border-radius:
            999px;

          background:
            var(--charcoal);

          color: white;

          cursor: pointer;

          font-size: 13px;
          font-weight: 800;

          transition:
            opacity
              160ms ease,
            transform
              160ms ease;
        }

        .next-button:hover:not(
            :disabled
          ) {
          transform:
            translateY(-1px);
        }

        .next-button:disabled {
          opacity: 0.32;
          cursor: not-allowed;
        }

        /* ============================
           RESULTS
        ============================ */

        .result-layout {
          position: relative;
          z-index: 2;

          width: min(
            1000px,
            100%
          );

          margin: 0 auto;
        }

        .result-intro {
          max-width: 760px;

          margin-bottom: 42px;
        }

        .result-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          margin-bottom: 18px;

          padding:
            8px 13px;

          border-radius:
            999px;

          background:
            var(--sage-light);

          color:
            var(--sage-dark);

          font-size: 11px;
          font-weight: 800;

          letter-spacing:
            0.04em;
        }

        .result-title {
          margin: 0;

          font-size:
            clamp(
              43px,
              7vw,
              76px
            );

          line-height: 0.98;

          letter-spacing:
            -0.055em;

          font-weight: 650;
        }

        .result-title em {
          color:
            var(--tan-dark);

          font-style: normal;
        }

        .result-copy {
          max-width: 660px;

          margin:
            22px 0 0;

          color:
            var(--muted);

          font-size: 16px;
          line-height: 1.7;
        }

        .score-panel {
          display: grid;

          grid-template-columns:
            170px
            minmax(0, 1fr);

          gap: 28px;

          align-items: center;

          margin-bottom: 20px;

          padding: 28px;

          border:
            1px solid
            var(--border);

          border-radius: 26px;

          background:
            rgba(
              255,
              254,
              253,
              0.7
            );
        }

        .score-circle {
          position: relative;

          display: grid;
          place-items: center;

          width: 142px;
          height: 142px;

          border-radius:
            999px;

          background:
            conic-gradient(
              var(
                  --sage-dark
                )
                calc(
                  var(
                      --score
                    ) *
                    1%
                ),
              var(
                  --cream-deep
                )
                0
            );
        }

        .score-circle::after {
          content: "";

          position: absolute;
          inset: 9px;

          border-radius:
            inherit;

          background:
            var(--white);
        }

        .score-number {
          position: relative;
          z-index: 2;

          text-align: center;
        }

        .score-number strong {
          display: block;

          font-size: 34px;
          line-height: 1;
          letter-spacing:
            -0.04em;
        }

        .score-number span {
          display: block;

          margin-top: 6px;

          color:
            var(--muted);

          font-size: 9px;
          font-weight: 800;

          letter-spacing:
            0.1em;

          text-transform:
            uppercase;
        }

        .score-content h2 {
          margin: 0 0 8px;

          font-size: 24px;
          letter-spacing:
            -0.025em;
        }

        .score-content p {
          margin: 0;

          color:
            var(--muted);

          font-size: 14px;
          line-height: 1.65;
        }

        .section-label {
          margin:
            46px 0 16px;

          color:
            var(--tan-dark);

          font-size: 10px;
          font-weight: 800;

          letter-spacing:
            0.14em;

          text-transform:
            uppercase;
        }

        .priority-grid {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(
                0,
                1fr
              )
            );

          gap: 14px;
        }

        .priority-card {
          min-width: 0;

          padding: 22px;

          border:
            1px solid
            var(--border);

          border-radius: 21px;

          background:
            var(--white);
        }

        .priority-number {
          display: flex;
          align-items: center;
          justify-content:
            space-between;

          margin-bottom: 18px;

          color:
            var(--muted);

          font-size: 10px;
          font-weight: 800;

          letter-spacing:
            0.09em;

          text-transform:
            uppercase;
        }

        .priority-icon {
          display: grid;
          place-items: center;

          width: 38px;
          height: 38px;

          border-radius: 11px;

          background:
            var(--sage-light);

          color:
            var(--sage-dark);
        }

        .priority-title {
          margin:
            0 0 9px;

          font-size: 18px;
          letter-spacing:
            -0.02em;
        }

        .priority-description {
          margin: 0;

          color:
            var(--muted);

          font-size: 12px;
          line-height: 1.6;
        }

        .priority-rec {
          margin-top: 16px;

          padding-top: 15px;

          border-top:
            1px solid
            var(--border);

          color:
            var(
              --charcoal-soft
            );

          font-size: 12px;
          line-height: 1.55;
        }

        /* ============================
           PLAN CARD
        ============================ */

        .plan-card {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            auto;

          gap: 30px;

          align-items: center;

          margin-top: 20px;

          padding:
            34px 36px;

          border-radius: 26px;

          background:
            var(--charcoal);

          color:
            var(--white);
        }

        .plan-eyebrow {
          margin-bottom: 8px;

          color:
            var(--sage);

          font-size: 10px;
          font-weight: 800;

          letter-spacing:
            0.14em;

          text-transform:
            uppercase;
        }

        .plan-name {
          margin: 0;

          font-size:
            clamp(
              31px,
              5vw,
              48px
            );

          line-height: 1;

          letter-spacing:
            -0.04em;
        }

        .plan-copy {
          max-width: 590px;

          margin:
            14px 0 0;

          color:
            rgba(
              255,
              255,
              255,
              0.64
            );

          font-size: 13px;
          line-height: 1.65;
        }

        .plan-price {
          text-align: right;
          white-space: nowrap;
        }

        .plan-price strong {
          display: block;

          font-size: 40px;
          line-height: 1;
          letter-spacing:
            -0.04em;
        }

        .plan-price span {
          display: block;

          margin-top: 7px;

          color:
            rgba(
              255,
              255,
              255,
              0.53
            );

          font-size: 11px;
        }

        .result-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;

          margin-top: 26px;
        }

        .result-primary,
        .result-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;

          min-height: 52px;

          padding:
            0 22px;

          border-radius:
            999px;

          font-size: 13px;
          font-weight: 800;

          text-decoration: none;

          cursor: pointer;
        }

        .result-primary {
          border:
            1px solid
            var(--charcoal);

          background:
            var(--charcoal);

          color:
            var(--white);
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

        .result-footnote {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-top: 18px;

          color:
            var(--muted);

          font-size: 11px;
        }

        /* ============================
           RESPONSIVE
        ============================ */

        @media (
          max-width: 900px
        ) {
          .intro-layout {
            grid-template-columns:
              1fr;

            gap: 42px;

            min-height: auto;
          }

          .preview-card {
            max-width: 650px;
          }

          .priority-grid {
            grid-template-columns:
              1fr;
          }
        }

        @media (
          max-width: 720px
        ) {
          .setup-header {
            width: min(
              100% - 28px,
              1180px
            );

            min-height: 72px;
          }

          .brand-logo {
            width: 30px;
            height: 30px;
          }

          .brand-word {
            font-size: 12px;
          }

          .home-link span {
            display: none;
          }

          .home-link {
            width: 42px;
            padding: 0;
            justify-content:
              center;
          }

          .setup-wrap {
            width: min(
              100% - 28px,
              1180px
            );

            padding:
              40px 0 70px;
          }

          .intro-title {
            font-size:
              clamp(
                45px,
                14vw,
                66px
              );
          }

          .intro-copy {
            margin-top: 22px;
          }

          .preview-card {
            padding: 22px;
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
          }

          .question-icon {
            width: 42px;
            height: 42px;
          }

          .answer-grid {
            grid-template-columns:
              1fr;

            margin-top: 25px;
          }

          .answer-option {
            min-height: 94px;
          }

          .quiz-actions {
            align-items:
              stretch;
          }

          .back-button,
          .next-button {
            min-height: 50px;
          }

          .score-panel {
            grid-template-columns:
              1fr;

            text-align: center;
          }

          .score-circle {
            margin: 0 auto;
          }

          .plan-card {
            grid-template-columns:
              1fr;

            padding:
              28px 24px;
          }

          .plan-price {
            text-align: left;
          }
        }

        @media (
          max-width: 430px
        ) {
          .setup-wrap {
            width:
              calc(
                100% - 22px
              );
          }

          .setup-header {
            width:
              calc(
                100% - 22px
              );
          }

          .intro-title {
            font-size: 46px;
          }

          .intro-actions {
            align-items:
              stretch;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
          }

          .question-title {
            font-size: 28px;
          }

          .answer-option {
            padding:
              16px 14px;
          }

          .quiz-actions {
            gap: 6px;
          }

          .next-button {
            padding:
              0 17px;
          }

          .result-actions {
            display: grid;
          }

          .result-primary,
          .result-secondary {
            width: 100%;
          }
        }
      `}</style>

      <header className="setup-header">
        <Logo />

        <div className="header-actions">
          <a
            href={HOME_URL}
            className="home-link"
          >
            <Home size={15} />
            <span>
              Back to TOTS-OS
            </span>
          </a>
        </div>
      </header>

      <div className="setup-wrap">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <AnimatePresence
          mode="wait"
        >
          {!started &&
            !finished && (
              <motion.section
                key="intro"
                className="intro-layout"
                {...animationProps}
              >
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" />

                    TOTS-OS business
                    check
                  </div>

                  <h1 className="intro-title">
                    How organised
                    is your{" "}
                    <em>
                      business,
                      really?
                    </em>
                  </h1>

                  <p className="intro-copy">
                    Tell us a
                    little about how
                    you currently run
                    your business and
                    we'll show you
                    where TOTS-OS
                    could make the
                    biggest
                    difference.
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
                      Find my setup
                      <ArrowRight
                        size={17}
                      />
                    </button>

                    <a
                      href={HOME_URL}
                      className="secondary-button"
                      style={{
                        textDecoration:
                          "none",
                      }}
                    >
                      Explore TOTS-OS
                    </a>
                  </div>

                  <div className="intro-meta">
                    <span>
                      <Check
                        size={14}
                      />
                      Around 60
                      seconds
                    </span>

                    <span>
                      <Check
                        size={14}
                      />
                      Personalised
                      result
                    </span>

                    <span>
                      <Check
                        size={14}
                      />
                      No email
                      required
                    </span>
                  </div>
                </div>

                <div className="preview-card">
                  <div className="preview-kicker">
                    Your result
                    might reveal
                  </div>

                  <h2 className="preview-title">
                    Where your
                    business is
                    creating
                    unnecessary
                    work.
                  </h2>

                  <p className="preview-copy">
                    We'll look at
                    the areas that
                    matter most to
                    your day-to-day
                    operations.
                  </p>

                  <div className="preview-list">
                    <PreviewItem
                      icon={
                        ContactRound
                      }
                      label="Clients & CRM"
                    />

                    <PreviewItem
                      icon={
                        FolderKanban
                      }
                      label="Projects & tasks"
                    />

                    <PreviewItem
                      icon={
                        CircleDollarSign
                      }
                      label="Financial visibility"
                    />

                    <PreviewItem
                      icon={
                        Megaphone
                      }
                      label="Marketing & content"
                    />
                  </div>

                  <div className="mini-result">
                    <div className="mini-result-label">
                      Then we'll
                      recommend
                    </div>

                    <div className="mini-result-value">
                      Your ideal
                      TOTS-OS setup
                      →
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
              >
                <div className="quiz-top">
                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <div className="quiz-step">
                      Question{" "}
                      <strong>
                        {step + 1}
                      </strong>{" "}
                      of{" "}
                      {
                        QUESTIONS.length
                      }
                    </div>

                    <div className="progress-track">
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
                      current={step}
                    />
                  </div>

                  <div className="quiz-time">
                    Takes about 60
                    seconds
                  </div>
                </div>

                <div className="question-card">
                  <div className="question-heading">
                    <div className="question-icon">
                      {(() => {
                        const Icon =
                          currentQuestion.icon;

                        return (
                          <Icon
                            size={
                              22
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

                      <h1 className="question-title">
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
                          <button
                            key={
                              option.id
                            }
                            type="button"
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
                            onClick={() =>
                              selectAnswer(
                                option.id,
                              )
                            }
                          >
                            <span className="answer-marker">
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
                              <span className="answer-check">
                                <Check
                                  size={
                                    13
                                  }
                                />
                              </span>
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <div className="quiz-actions">
                    <button
                      type="button"
                      className="back-button"
                      onClick={
                        previousQuestion
                      }
                    >
                      <ChevronLeft
                        size={17}
                      />
                      Back
                    </button>

                    <button
                      type="button"
                      className="next-button"
                      onClick={
                        nextQuestion
                      }
                      disabled={
                        !selectedAnswer
                      }
                    >
                      {step ===
                      QUESTIONS.length -
                        1
                        ? "Show my setup"
                        : "Continue"}

                      {step ===
                      QUESTIONS.length -
                      1 ? (
                        <Sparkles
                          size={16}
                        />
                      ) : (
                        <ArrowRight
                          size={16}
                        />
                      )}
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

          {finished && (
            <motion.section
              key="results"
              className="result-layout"
              {...animationProps}
            >
              <div className="result-intro">
                <div className="result-pill">
                  <CheckCircle2
                    size={14}
                  />
                  Your TOTS-OS
                  business profile
                </div>

                <h1 className="result-title">
                  Here's where
                  TOTS-OS could
                  make the{" "}
                  <em>
                    biggest
                    difference.
                  </em>
                </h1>

                <p className="result-copy">
                  You don't need to
                  change everything
                  overnight. Your
                  answers suggest
                  that starting
                  with these areas
                  would give you
                  the biggest
                  improvement in
                  visibility,
                  organisation and
                  time.
                </p>
              </div>

              <div className="score-panel">
                <div
                  className="score-circle"
                  style={
                    {
                      "--score":
                        organisationScore,
                    } as CSSProperties
                  }
                >
                  <div className="score-number">
                    <strong>
                      {
                        organisationScore
                      }
                      %
                    </strong>

                    <span>
                      opportunity
                      score
                    </span>
                  </div>
                </div>

                <div className="score-content">
                  <h2>
                    {organisationScore >=
                    70
                      ? "There's a lot TOTS-OS could take off your plate."
                      : organisationScore >=
                          45
                        ? "You've got systems — they just need connecting."
                        : "You've already built a strong foundation."}
                  </h2>

                  <p>
                    {organisationScore >=
                    70
                      ? "Your answers suggest that a significant amount of your business admin is currently spread across different places. Bringing the core parts together could make your day-to-day work feel much lighter."
                      : organisationScore >=
                          45
                        ? "Your business isn't disorganised. The biggest opportunity is reducing the switching between separate tools and giving yourself one clearer view of what is happening."
                        : "You're already doing a lot right. TOTS-OS would be less about fixing chaos and more about bringing your existing processes into one simpler operating system."}
                  </p>
                </div>
              </div>

              <div className="section-label">
                Your three biggest
                opportunities
              </div>

              <div className="priority-grid">
                {topCategories.map(
                  (
                    category,
                    index,
                  ) => {
                    const Icon =
                      category.icon;

                    return (
                      <div
                        key={
                          category.key
                        }
                        className="priority-card"
                      >
                        <div className="priority-number">
                          <span>
                            Priority{" "}
                            {index +
                              1}
                          </span>

                          <span className="priority-icon">
                            <Icon
                              size={
                                18
                              }
                            />
                          </span>
                        </div>

                        <h3 className="priority-title">
                          {
                            category.title
                          }
                        </h3>

                        <p className="priority-description">
                          {
                            category.description
                          }
                        </p>

                        <div className="priority-rec">
                          <strong>
                            In
                            TOTS-OS:{" "}
                          </strong>

                          {
                            category.recommendation
                          }
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              <div className="section-label">
                Your recommended
                starting point
              </div>

              <div className="plan-card">
                <div>
                  <div className="plan-eyebrow">
                    Best match
                    based on your
                    answers
                  </div>

                  <h2 className="plan-name">
                    TOTS-OS{" "}
                    {
                      recommendedPlan
                    }
                  </h2>

                  <p className="plan-copy">
                    {recommendedPlan ===
                    "Standard"
                      ? "A strong starting point for keeping the essentials organised without overcomplicating your setup."
                      : recommendedPlan ===
                          "Professional"
                        ? "Your answers suggest you'll get the most value from connecting several parts of the business rather than solving one isolated problem."
                        : "Your business has more moving parts, so a more complete setup gives you the visibility and structure needed as you grow."}
                  </p>
                </div>

                <div className="plan-price">
                  <strong>
                    £
                    {planPrice(
                      recommendedPlan,
                    )}
                  </strong>

                  <span>
                    per month
                  </span>
                </div>
              </div>

              <div className="result-actions">
                <a
                  href={SIGNUP_URL}
                  className="result-primary"
                >
                  Start my
                  14-day free trial
                  <ArrowRight
                    size={16}
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
                    size={15}
                  />
                  Retake the
                  business check
                </button>

                <a
                  href={HOME_URL}
                  className="result-secondary"
                >
                  <ArrowLeft
                    size={15}
                  />
                  Back to TOTS-OS
                </a>
              </div>

              <div className="result-footnote">
                <Check
                  size={13}
                />
                14-day free trial
                · no bank details
                required.
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ============================================================
   PREVIEW ITEM
============================================================ */

function PreviewItem({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="preview-item">
      <span className="preview-icon">
        <Icon size={17} />
      </span>

      <span>{label}</span>

      <ArrowRight
        className="preview-arrow"
        size={14}
      />
    </div>
  );
}