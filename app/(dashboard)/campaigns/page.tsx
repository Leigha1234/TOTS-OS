"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createBrowserClient } from "@supabase/ssr";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Edit3,
  Eye,
  FileText,
  GripVertical,
  Hash,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Mail,
  MousePointerClick,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Users,
  Wand2,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

// ==================================================
// TYPES
// ==================================================

type Campaign = {
  id: string;
  title: string;
  subject: string | null;
  preview_text?: string | null;
  content: string | null;
  list_id: string | null;
  scheduled_for: string | null;
  status?: string | null;
  sent_at?: string | null;
  sent_count?: number | null;
  open_count?: number | null;
  click_count?: number | null;
  sender_name?: string | null;
  reply_to?: string | null;
  header_image_url?: string | null;
  brand_color?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  organisation_id?: string | null;
  editor_mode?: "blocks" | "html" | null;
  custom_html?: string | null;
  subscriber_lists?: {
    name: string | null;
  } | null;
};

type SubscriberList = {
  id: string;
  name: string;
  organisation_id?: string;
};

type ExistingProfile = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  is_subscribed?: boolean | null;
};

type ListSubscriber = {
  id: string;
  source: "profile" | "manual";
  profileId: string | null;
  manualId: string | null;
  name: string | null;
  email: string;
};

type CompanyBranding = {
  name: string;
  email: string;
  logoUrl: string;
};

type CampaignBlock = {
  id: string;
  type:
    | "text"
    | "image"
    | "button"
    | "divider"
    | "spacer";
  content: string;
  imageUrl?: string;
  url?: string;
};

type CampaignTemplate = {
  id: string;
  name: string;
  blocks: CampaignBlock[];
  brandColor: string;
  builtIn?: boolean;
};

type EditorMode =
  | "blocks"
  | "html";

type CampaignForm = {
  title: string;
  subject: string;
  previewText: string;
  message: string;
  listId: string;
  scheduledFor: string;
  senderName: string;
  replyTo: string;
  campaignLogoUrl: string;
  headerImageUrl: string;
  ctaText: string;
  ctaUrl: string;
  brandColor: string;
  blocks: CampaignBlock[];
  mode: EditorMode;
  customHtml: string;
};

type MainScreen =
  | "campaigns"
  | "audiences"
  | "editor"
  | "analytics";

type EditorStep =
  | "details"
  | "audience"
  | "design"
  | "review";

// ==================================================
// CONSTANTS
// ==================================================

const DEFAULT_BRAND_COLOR =
  "#1c1917";

const MESSAGE_START =
  "<!-- TOTS_MESSAGE_START -->";

const MESSAGE_END =
  "<!-- TOTS_MESSAGE_END -->";

const IMAGE_BUCKET =
  "campaign-images";

const EDITOR_STEPS: {
  id: EditorStep;
  label: string;
  description: string;
}[] = [
  {
    id: "details",
    label: "Details",
    description:
      "Subject, sender and campaign name",
  },
  {
    id: "audience",
    label: "Audience",
    description:
      "Choose who receives it",
  },
  {
    id: "design",
    label: "Design",
    description:
      "Build your email",
  },
  {
    id: "review",
    label: "Review",
    description:
      "Test, schedule and send",
  },
];

const STARTER_TEMPLATES: CampaignTemplate[] =
  [
    {
      id: "starter-newsletter",
      name: "Newsletter",
      brandColor: "#1c1917",
      builtIn: true,
      blocks: [
        {
          id: "newsletter-1",
          type: "text",
          content:
            "Hi there,\n\nHere's what's new this month...",
        },
        {
          id: "newsletter-2",
          type: "image",
          content: "",
          imageUrl: "",
        },
        {
          id: "newsletter-3",
          type: "text",
          content:
            "Add your second story or update here.",
        },
        {
          id: "newsletter-4",
          type: "button",
          content: "Read more",
          url: "https://",
        },
      ],
    },
    {
      id: "starter-announcement",
      name: "Announcement",
      brandColor: "#1c1917",
      builtIn: true,
      blocks: [
        {
          id: "announcement-1",
          type: "text",
          content:
            "We have some exciting news to share...",
        },
        {
          id: "announcement-2",
          type: "divider",
          content: "",
        },
        {
          id: "announcement-3",
          type: "text",
          content:
            "Here's everything you need to know.",
        },
        {
          id: "announcement-4",
          type: "button",
          content: "Learn more",
          url: "https://",
        },
      ],
    },
    {
      id: "starter-promotion",
      name: "Promotion",
      brandColor: "#b45309",
      builtIn: true,
      blocks: [
        {
          id: "promo-1",
          type: "image",
          content: "",
          imageUrl: "",
        },
        {
          id: "promo-2",
          type: "text",
          content:
            "Limited time offer — don't miss out.",
        },
        {
          id: "promo-3",
          type: "button",
          content: "Shop now",
          url: "https://",
        },
      ],
    },
  ];

// ==================================================
// GENERAL HELPERS
// ==================================================

function createCampaignBlock(
  type: CampaignBlock["type"]
): CampaignBlock {
  return {
    id: `${type}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    type,
    content:
      type === "text"
        ? "Add your content here..."
        : type === "button"
          ? "Learn more"
          : "",
    imageUrl: "",
    url:
      type === "button"
        ? "https://"
        : "",
  };
}

function emptyForm(
  company?: CompanyBranding
): CampaignForm {
  return {
    title: "",
    subject: "",
    previewText: "",
    message: "",
    listId: "",
    scheduledFor: "",
    senderName:
      company?.name || "",
    replyTo:
      company?.email || "",
    campaignLogoUrl:
      company?.logoUrl || "",
    headerImageUrl: "",
    ctaText: "",
    ctaUrl: "",
    brandColor:
      DEFAULT_BRAND_COLOR,
    blocks: [
      createCampaignBlock(
        "text"
      ),
    ],
    mode: "blocks",
    customHtml: "",
  };
}

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}

function cleanEmail(
  value:
    | string
    | null
    | undefined
) {
  return (
    value
      ?.trim()
      .toLowerCase() || ""
  );
}

function parseEmails(
  value: string
) {
  return Array.from(
    new Set(
      value
        .split(/[\n,;]+/)
        .map((email) =>
          email
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
        .filter(isValidEmail)
    )
  );
}

function escapeHtml(
  value: string
) {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function plainTextToHtml(
  value: string
) {
  const clean =
    value.trim();

  if (!clean) {
    return "";
  }

  return clean
    .split(/\n{2,}/)
    .map(
      (paragraph) => `
        <p
          style="
            font-size:16px;
            line-height:1.8;
            margin:0 0 20px;
            color:#44403c;
          "
        >
          ${escapeHtml(
            paragraph
          ).replace(
            /\n/g,
            "<br />"
          )}
        </p>
      `
    )
    .join("");
}

function stripHtml(
  html: string
) {
  if (!html) {
    return "";
  }

  if (
    typeof window ===
    "undefined"
  ) {
    return html
      .replace(
        /<br\s*\/?>/gi,
        "\n"
      )
      .replace(
        /<\/p>/gi,
        "\n\n"
      )
      .replace(
        /<[^>]+>/g,
        ""
      )
      .trim();
  }

  const element =
    document.createElement(
      "div"
    );

  element.innerHTML =
    html;

  return (
    element.innerText ||
    element.textContent ||
    ""
  ).trim();
}

function extractMessage(
  html: string
) {
  if (!html) {
    return "";
  }

  const start =
    html.indexOf(
      MESSAGE_START
    );

  const end =
    html.indexOf(
      MESSAGE_END
    );

  if (
    start !== -1 &&
    end !== -1 &&
    end > start
  ) {
    const raw =
      html.slice(
        start +
          MESSAGE_START.length,
        end
      );

    return stripHtml(raw);
  }

  return stripHtml(html);
}

function extractCampaignLogoUrl(
  html: string
) {
  if (!html) {
    return "";
  }

  const firstMatch =
    html.match(
      /data-tots-campaign-logo="true"[^>]*src="([^"]+)"/i
    );

  if (
    firstMatch?.[1]
  ) {
    return firstMatch[1];
  }

  const secondMatch =
    html.match(
      /src="([^"]+)"[^>]*data-tots-campaign-logo="true"/i
    );

  return (
    secondMatch?.[1] ||
    ""
  );
}

// ==================================================
// EMAIL BUILDER
// ==================================================

function buildBlockHtml(
  blocks: CampaignBlock[],
  message: string,
  brandColor: string,
  ctaUrl: string
) {
  if (
    !blocks ||
    blocks.length === 0
  ) {
    return plainTextToHtml(
      message
    );
  }

  return blocks
    .map((block) => {
      if (
        block.type ===
        "image"
      ) {
        if (
          !block.imageUrl
        ) {
          return "";
        }

        return `
          <div style="margin:0 0 24px;">
            <img
              src="${escapeHtml(
                block.imageUrl
              )}"
              alt=""
              style="
                display:block;
                width:100%;
                height:auto;
                border-radius:18px;
              "
            />
          </div>
        `;
      }

      if (
        block.type ===
        "divider"
      ) {
        return `
          <div
            style="
              margin:28px 0;
              border-top:1px solid #e7e5e4;
            "
          ></div>
        `;
      }

      if (
        block.type ===
        "spacer"
      ) {
        return `
          <div
            style="
              height:32px;
              line-height:32px;
            "
          >
            &nbsp;
          </div>
        `;
      }

      if (
        block.type ===
        "button"
      ) {
        const label =
          block.content ||
          "Learn more";

        const href =
          block.url ||
          ctaUrl ||
          "#";

        return `
          <div
            style="
              text-align:center;
              margin:28px 0;
            "
          >
            <a
              href="${escapeHtml(
                href
              )}"
              data-tots-click-url="${escapeHtml(
                href
              )}"
              style="
                display:inline-block;
                background:${brandColor};
                color:#ffffff;
                text-decoration:none;
                padding:16px 26px;
                border-radius:12px;
                font-size:12px;
                font-weight:700;
                letter-spacing:0.08em;
                text-transform:uppercase;
              "
            >
              ${escapeHtml(
                label
              )}
            </a>
          </div>
        `;
      }

      return `
        <div>
          ${plainTextToHtml(
            block.content ||
              message ||
              ""
          )}
        </div>
      `;
    })
    .join("");
}

function buildCampaignHtml({
  message,
  company,
  campaignLogoUrl,
  headerImageUrl,
  ctaText,
  ctaUrl,
  brandColor,
  blocks,
  mode,
  customHtml,
}: {
  message: string;
  company: CompanyBranding;
  campaignLogoUrl: string;
  headerImageUrl: string;
  ctaText: string;
  ctaUrl: string;
  brandColor: string;
  blocks?: CampaignBlock[];
  mode?: EditorMode;
  customHtml?: string;
}) {
  const logo =
    campaignLogoUrl.trim() ||
    company.logoUrl.trim();

  const safeLogo =
    escapeHtml(logo);

  const safeHeaderImage =
    escapeHtml(
      headerImageUrl
    );

  const safeCtaUrl =
    escapeHtml(ctaUrl);

  const bodyHtml =
    mode === "html"
      ? customHtml || ""
      : buildBlockHtml(
          blocks || [],
          message,
          brandColor,
          ctaUrl
        );

  return `
    <div
      style="
        max-width:640px;
        margin:0 auto;
        font-family:Arial,Helvetica,sans-serif;
        color:#292524;
      "
    >
      ${
        logo
          ? `
            <div
              style="
                text-align:center;
                margin:0 0 32px;
              "
            >
              <img
                src="${safeLogo}"
                data-tots-campaign-logo="true"
                alt="${escapeHtml(
                  company.name
                )}"
                style="
                  display:inline-block;
                  max-width:150px;
                  max-height:80px;
                  width:auto;
                  height:auto;
                  object-fit:contain;
                "
              />
            </div>
          `
          : ""
      }

      ${
        headerImageUrl
          ? `
            <img
              src="${safeHeaderImage}"
              alt=""
              style="
                display:block;
                width:100%;
                height:auto;
                border-radius:20px;
                margin:0 0 32px;
              "
            />
          `
          : ""
      }

      ${MESSAGE_START}

      <div>
        ${bodyHtml}
      </div>

      ${MESSAGE_END}

      ${
        ctaText &&
        ctaUrl &&
        mode !== "html"
          ? `
            <div
              style="
                text-align:center;
                margin:36px 0;
              "
            >
              <a
                href="${safeCtaUrl}"
                data-tots-click-url="${safeCtaUrl}"
                style="
                  display:inline-block;
                  background:${brandColor};
                  color:#ffffff;
                  text-decoration:none;
                  padding:16px 28px;
                  border-radius:12px;
                  font-size:12px;
                  font-weight:700;
                  letter-spacing:0.08em;
                  text-transform:uppercase;
                "
              >
                ${escapeHtml(
                  ctaText
                )}
              </a>
            </div>
          `
          : ""
      }

      <div
        style="
          margin-top:48px;
          padding-top:28px;
          border-top:1px solid #e7e5e4;
          text-align:center;
        "
      >
        ${
          logo
            ? `
              <img
                src="${safeLogo}"
                alt="${escapeHtml(
                  company.name
                )}"
                style="
                  max-width:90px;
                  max-height:50px;
                  width:auto;
                  height:auto;
                  object-fit:contain;
                  margin-bottom:14px;
                "
              />
            `
            : ""
        }

        <p
          style="
            margin:0;
            font-size:11px;
            font-weight:700;
            text-transform:uppercase;
            letter-spacing:0.14em;
            color:#44403c;
          "
        >
          ${escapeHtml(
            company.name
          )}
        </p>

        ${
          company.email
            ? `
              <p
                style="
                  margin:8px 0 0;
                  font-size:10px;
                  color:#a8a29e;
                "
              >
                ${escapeHtml(
                  company.email
                )}
              </p>
            `
            : ""
        }

        <p
          style="
            margin:16px 0 0;
            font-size:8px;
            color:#d6d3d1;
            text-transform:uppercase;
            letter-spacing:0.2em;
          "
        >
          Powered by TOTS-OS
        </p>
      </div>
    </div>
  `;
}

// ==================================================
// DATE / ANALYTICS
// ==================================================

function localInputToIso(
  value: string
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function isoToLocalInput(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  const local =
    new Date(
      date.getTime() -
        offset *
          60 *
          1000
    );

  return local
    .toISOString()
    .slice(0, 16);
}

function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "Not scheduled";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function getOpenRate(
  campaign: Campaign
) {
  const sent =
    Number(
      campaign.sent_count ||
        0
    );

  const opens =
    Number(
      campaign.open_count ||
        0
    );

  if (sent <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (opens / sent) * 100
    )
  );
}

function getClickRate(
  campaign: Campaign
) {
  const sent =
    Number(
      campaign.sent_count ||
        0
    );

  const clicks =
    Number(
      campaign.click_count ||
        0
    );

  if (sent <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (clicks / sent) *
        100
    )
  );
}

function getStatusLabel(
  campaign: Campaign
) {
  if (
    campaign.sent_at ||
    Number(
      campaign.sent_count ||
        0
    ) > 0 ||
    campaign.status ===
      "sent"
  ) {
    return "sent";
  }

  return (
    campaign.status ||
    "draft"
  );
}

function createUniqueTrackingCounts(
  rows: any[]
) {
  const grouped: Record<
    string,
    Set<string>
  > = {};

  for (const row of rows) {
    const campaignId =
      row?.campaign_id;

    if (!campaignId) {
      continue;
    }

    if (
      !grouped[
        campaignId
      ]
    ) {
      grouped[
        campaignId
      ] = new Set();
    }

    const recipientKey =
      row.profile_id
        ? `recipient-${String(
            row.profile_id
          )}`
        : `legacy-${String(
            row.id
          )}`;

    grouped[
      campaignId
    ].add(
      recipientKey
    );
  }

  const counts: Record<
    string,
    number
  > = {};

  Object.entries(
    grouped
  ).forEach(
    ([
      campaignId,
      recipients,
    ]) => {
      counts[
        campaignId
      ] =
        recipients.size;
    }
  );

  return counts;
}

// ==================================================
// SMALL UI COMPONENTS
// ==================================================

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
      {children}
    </label>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const className =
    status === "sent"
      ? "bg-emerald-50 text-emerald-700"
      : status ===
            "sending" ||
          status ===
            "processing"
        ? "bg-amber-50 text-amber-700"
        : status ===
            "failed"
          ? "bg-red-50 text-red-700"
          : status ===
              "queued"
            ? "bg-blue-50 text-blue-700"
            : "bg-stone-100 text-stone-500";

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] ${className}`}
    >
      {status}
    </span>
  );
}

function StepBar({
  current,
  onStep,
}: {
  current: EditorStep;
  onStep: (
    step: EditorStep
  ) => void;
}) {
  const currentIndex =
    EDITOR_STEPS.findIndex(
      (step) =>
        step.id === current
    );

  return (
    <div className="border-b border-stone-200 bg-white px-5 py-5 md:px-10">
      <div className="mx-auto flex max-w-5xl items-center overflow-x-auto">
        {EDITOR_STEPS.map(
          (
            step,
            index
          ) => {
            const active =
              step.id ===
              current;

            const complete =
              index <
              currentIndex;

            return (
              <div
                key={
                  step.id
                }
                className="flex min-w-fit flex-1 items-center"
              >
                <button
                  type="button"
                  onClick={() =>
                    onStep(
                      step.id
                    )
                  }
                  className="flex items-center gap-3 text-left"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black transition ${
                      active
                        ? "bg-stone-900 text-[#a9b897]"
                        : complete
                          ? "bg-[#a9b897] text-stone-900"
                          : "bg-stone-100 text-stone-400"
                    }`}
                  >
                    {complete ? (
                      <Check
                        size={
                          15
                        }
                      />
                    ) : (
                      index +
                      1
                    )}
                  </span>

                  <span className="hidden md:block">
                    <span
                      className={`block text-[10px] font-black uppercase tracking-[0.12em] ${
                        active
                          ? "text-stone-900"
                          : "text-stone-400"
                      }`}
                    >
                      {
                        step.label
                      }
                    </span>

                    <span className="mt-1 block text-[9px] text-stone-400">
                      {
                        step.description
                      }
                    </span>
                  </span>
                </button>

                {index <
                  EDITOR_STEPS.length -
                    1 && (
                  <div className="mx-4 h-px min-w-8 flex-1 bg-stone-200 md:mx-6" />
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

// ==================================================
// PAGE
// ==================================================

export default function CampaignsPage() {
  const supabase =
    useMemo(
      () =>
        createBrowserClient(
          process.env
            .NEXT_PUBLIC_SUPABASE_URL!,
          process.env
            .NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
      []
    );

  // ==================================================
  // MAIN NAVIGATION
  // ==================================================

  const [
    screen,
    setScreen,
  ] =
    useState<MainScreen>(
      "campaigns"
    );

  const [
    editorStep,
    setEditorStep,
  ] =
    useState<EditorStep>(
      "details"
    );

  // ==================================================
  // CORE STATE
  // ==================================================

  const [
    organisationId,
    setOrganisationId,
  ] =
    useState<
      string | null
    >(null);

  const [
    company,
    setCompany,
  ] =
    useState<CompanyBranding>(
      {
        name: "Your Company",
        email: "",
        logoUrl: "",
      }
    );

  const [
    campaigns,
    setCampaigns,
  ] =
    useState<Campaign[]>(
      []
    );

  const [
    lists,
    setLists,
  ] =
    useState<
      SubscriberList[]
    >([]);

  const [
    profiles,
    setProfiles,
  ] =
    useState<
      ExistingProfile[]
    >([]);

  const [
    subscriberCounts,
    setSubscriberCounts,
  ] =
    useState<
      Record<
        string,
        number
      >
    >({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshingStats,
    setRefreshingStats,
  ] =
    useState(false);

  // ==================================================
  // EDITOR STATE
  // ==================================================

  const [
    editingCampaignId,
    setEditingCampaignId,
  ] =
    useState<
      string | null
    >(null);

  const [
    selectedCampaign,
    setSelectedCampaign,
  ] =
    useState<
      Campaign | null
    >(null);

  const [
    campaignForm,
    setCampaignForm,
  ] =
    useState<CampaignForm>(
      emptyForm()
    );

  const [
    savingCampaign,
    setSavingCampaign,
  ] =
    useState(false);

  const [
    sendingCampaignId,
    setSendingCampaignId,
  ] =
    useState<
      string | null
    >(null);

  const [
    savedTemplates,
    setSavedTemplates,
  ] =
    useState<
      CampaignTemplate[]
    >([]);

  const [
    draggingBlockId,
    setDraggingBlockId,
  ] =
    useState<
      string | null
    >(null);

  const [
    showTemplatePicker,
    setShowTemplatePicker,
  ] =
    useState(false);

  // ==================================================
  // IMAGE STATE
  // ==================================================

  const [
    uploadingBlockId,
    setUploadingBlockId,
  ] =
    useState<
      string | null
    >(null);

  const [
    uploadingHeaderImage,
    setUploadingHeaderImage,
  ] =
    useState(false);

  const [
    uploadingLogo,
    setUploadingLogo,
  ] =
    useState(false);

  // ==================================================
  // LIST STATE
  // ==================================================

  const [
    showCreateList,
    setShowCreateList,
  ] =
    useState(false);

  const [
    newListName,
    setNewListName,
  ] =
    useState("");

  const [
    selectedList,
    setSelectedList,
  ] =
    useState<
      SubscriberList | null
    >(null);

  const [
    listSubscribers,
    setListSubscribers,
  ] =
    useState<
      ListSubscriber[]
    >([]);

  const [
    loadingList,
    setLoadingList,
  ] =
    useState(false);

  const [
    showSubscriberManager,
    setShowSubscriberManager,
  ] =
    useState(false);

  const [
    selectedProfiles,
    setSelectedProfiles,
  ] =
    useState<string[]>(
      []
    );

  const [
    manualEmails,
    setManualEmails,
  ] =
    useState("");

  const [
    savingSubscribers,
    setSavingSubscribers,
  ] =
    useState(false);

  // ==================================================
  // TEST SEND
  // ==================================================

  const [
    testEmail,
    setTestEmail,
  ] =
    useState("");

  const [
    sendingTest,
    setSendingTest,
  ] =
    useState(false);

  const [
    testSendResult,
    setTestSendResult,
  ] =
    useState<
      string | null
    >(null);

  // ==================================================
  // AI
  // ==================================================

  const [
    showAiAssist,
    setShowAiAssist,
  ] =
    useState(false);

  const [
    aiPrompt,
    setAiPrompt,
  ] =
    useState("");

  const [
    aiTone,
    setAiTone,
  ] =
    useState(
      "friendly"
    );

  const [
    aiTarget,
    setAiTarget,
  ] =
    useState<
      "blocks" | "html"
    >("blocks");

  const [
    aiGenerating,
    setAiGenerating,
  ] =
    useState(false);

  const [
    aiError,
    setAiError,
  ] =
    useState<
      string | null
    >(null);

  const htmlFileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  // ==================================================
  // LOAD USER / COMPANY
  // ==================================================

  useEffect(() => {
    const loadUser =
      async () => {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {
          setLoading(
            false
          );
          return;
        }

        const {
          data: profile,
          error:
            profileError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select("*")
            .eq(
              "id",
              user.id
            )
            .maybeSingle();

        if (
          profileError
        ) {
          console.error(
            "Profile error:",
            profileError
          );

          setLoading(
            false
          );

          return;
        }

        const orgId =
          profile?.organisation_id ||
          null;

        setOrganisationId(
          orgId
        );

        let team:
          | any
          | null =
          null;

        if (orgId) {
          const {
            data:
              teamData,
            error:
              teamError,
          } =
            await supabase
              .from(
                "team"
              )
              .select("*")
              .eq(
                "organisation_id",
                orgId
              )
              .limit(1)
              .maybeSingle();

          if (
            teamError
          ) {
            console.warn(
              "Team branding error:",
              teamError
            );
          }

          team =
            teamData ||
            null;
        }

        const companyData: CompanyBranding =
          {
            name:
              team?.company_name ||
              team?.name ||
              profile?.company_name ||
              profile?.business_name ||
              profile?.full_name ||
              profile?.name ||
              "Your Company",

            email:
              profile?.email ||
              "",

            logoUrl:
              profile?.logo_url ||
              profile?.company_logo_url ||
              team?.logo_url ||
              "",
          };

        setCompany(
          companyData
        );

        setCampaignForm(
          emptyForm(
            companyData
          )
        );
      };

    void loadUser();
  }, [supabase]);

  // ==================================================
  // TEMPLATES
  // ==================================================

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(
          "tots_campaign_templates"
        );

      if (!stored) {
        return;
      }

      const parsed =
        JSON.parse(
          stored
        ) as CampaignTemplate[];

      if (
        Array.isArray(
          parsed
        )
      ) {
        setSavedTemplates(
          parsed
        );
      }
    } catch (
      error
    ) {
      console.warn(
        "Template load error:",
        error
      );
    }
  }, []);

  // ==================================================
  // BLOCK EDITING
  // ==================================================

  const addBlock = (
    type: CampaignBlock["type"]
  ) => {
    const block =
      createCampaignBlock(
        type
      );

    setCampaignForm(
      (previous) => ({
        ...previous,
        blocks: [
          ...previous.blocks,
          block,
        ],
      })
    );
  };

  const updateBlock = (
    id: string,
    changes: Partial<CampaignBlock>
  ) => {
    setCampaignForm(
      (previous) => ({
        ...previous,
        blocks:
          previous.blocks.map(
            (
              block
            ) =>
              block.id ===
              id
                ? {
                    ...block,
                    ...changes,
                  }
                : block
          ),
      })
    );
  };

  const deleteBlock = (
    id: string
  ) => {
    setCampaignForm(
      (previous) => ({
        ...previous,
        blocks:
          previous.blocks.filter(
            (
              block
            ) =>
              block.id !==
              id
          ),
      })
    );
  };

  const duplicateBlock = (
    id: string
  ) => {
    setCampaignForm(
      (previous) => {
        const index =
          previous.blocks.findIndex(
            (
              block
            ) =>
              block.id ===
              id
          );

        if (
          index === -1
        ) {
          return previous;
        }

        const source =
          previous.blocks[
            index
          ];

        const copy: CampaignBlock =
          {
            ...source,
            id: `${
              source.type
            }-${Date.now()}-${Math.random()
              .toString(
                36
              )
              .slice(
                2,
                8
              )}`,
          };

        const nextBlocks =
          [
            ...previous.blocks,
          ];

        nextBlocks.splice(
          index + 1,
          0,
          copy
        );

        return {
          ...previous,
          blocks:
            nextBlocks,
        };
      }
    );
  };

  const moveBlock = (
    fromId: string,
    toId: string
  ) => {
    setCampaignForm(
      (previous) => {
        const blocks = [
          ...previous.blocks,
        ];

        const fromIndex =
          blocks.findIndex(
            (
              block
            ) =>
              block.id ===
              fromId
          );

        const toIndex =
          blocks.findIndex(
            (
              block
            ) =>
              block.id ===
              toId
          );

        if (
          fromIndex ===
            -1 ||
          toIndex === -1
        ) {
          return previous;
        }

        const [moved] =
          blocks.splice(
            fromIndex,
            1
          );

        blocks.splice(
          toIndex,
          0,
          moved
        );

        return {
          ...previous,
          blocks,
        };
      }
    );
  };

  const saveCampaignTemplate =
    () => {
      const name =
        campaignForm.title.trim() ||
        "Untitled template";

      const nextTemplates =
        [
          {
            id: `template-${Date.now()}`,
            name,
            blocks:
              campaignForm.blocks,
            brandColor:
              campaignForm.brandColor,
          },
          ...savedTemplates,
        ].slice(0, 8);

      setSavedTemplates(
        nextTemplates
      );

      window.localStorage.setItem(
        "tots_campaign_templates",
        JSON.stringify(
          nextTemplates
        )
      );

      alert(
        "Template saved."
      );
    };

  const applyTemplate = (
    template: CampaignTemplate
  ) => {
    setCampaignForm(
      (previous) => ({
        ...previous,
        mode: "blocks",

        title:
          template.builtIn
            ? previous.title
            : template.name,

        blocks:
          template.blocks.map(
            (
              block
            ) => ({
              ...block,
              id: `${
                block.type
              }-${Date.now()}-${Math.random()
                .toString(
                  36
                )
                .slice(
                  2,
                  8
                )}`,
            })
          ),

        brandColor:
          template.brandColor ||
          previous.brandColor,
      })
    );

    setShowTemplatePicker(
      false
    );
  };

  const deleteSavedTemplate =
    (id: string) => {
      const next =
        savedTemplates.filter(
          (
            template
          ) =>
            template.id !==
            id
        );

      setSavedTemplates(
        next
      );

      window.localStorage.setItem(
        "tots_campaign_templates",
        JSON.stringify(
          next
        )
      );
    };

  // ==================================================
  // IMAGE UPLOAD
  // ==================================================

  const uploadImageFile =
    async (
      file: File
    ): Promise<string> => {
      const extension =
        file.name
          .split(".")
          .pop() ||
        "png";

      const path = `${
        organisationId ||
        "shared"
      }/${Date.now()}-${Math.random()
        .toString(36)
        .slice(
          2,
          8
        )}.${extension}`;

      const {
        error,
      } =
        await supabase.storage
          .from(
            IMAGE_BUCKET
          )
          .upload(
            path,
            file,
            {
              cacheControl:
                "3600",
              upsert:
                false,
            }
          );

      if (error) {
        throw error;
      }

      const {
        data,
      } =
        supabase.storage
          .from(
            IMAGE_BUCKET
          )
          .getPublicUrl(
            path
          );

      return data.publicUrl;
    };

  const handleBlockImageUpload =
    async (
      blockId: string,
      file: File
    ) => {
      setUploadingBlockId(
        blockId
      );

      try {
        const url =
          await uploadImageFile(
            file
          );

        updateBlock(
          blockId,
          {
            imageUrl:
              url,
          }
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        alert(
          "Could not upload image."
        );
      } finally {
        setUploadingBlockId(
          null
        );
      }
    };

  const handleHeaderImageUpload =
    async (
      file: File
    ) => {
      setUploadingHeaderImage(
        true
      );

      try {
        const url =
          await uploadImageFile(
            file
          );

        setCampaignForm(
          (
            previous
          ) => ({
            ...previous,
            headerImageUrl:
              url,
          })
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        alert(
          "Could not upload image."
        );
      } finally {
        setUploadingHeaderImage(
          false
        );
      }
    };

  const handleLogoUpload =
    async (
      file: File
    ) => {
      setUploadingLogo(
        true
      );

      try {
        const url =
          await uploadImageFile(
            file
          );

        setCampaignForm(
          (
            previous
          ) => ({
            ...previous,
            campaignLogoUrl:
              url,
          })
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        alert(
          "Could not upload logo."
        );
      } finally {
        setUploadingLogo(
          false
        );
      }
    };

  // ==================================================
  // LOAD CAMPAIGNS
  // ==================================================

  const loadCampaigns =
    async () => {
      if (
        !organisationId
      ) {
        return;
      }

      const {
        data:
          campaignData,
        error:
          campaignError,
      } =
        await supabase
          .from(
            "campaigns"
          )
          .select(
            "*, subscriber_lists(name)"
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (
        campaignError
      ) {
        console.error(
          "Campaign load error:",
          campaignError
        );

        return;
      }

      const loaded =
        (campaignData ||
          []) as Campaign[];

      if (
        loaded.length ===
        0
      ) {
        setCampaigns(
          []
        );

        return;
      }

      const campaignIds =
        loaded.map(
          (
            campaign
          ) =>
            campaign.id
        );

      const [
        openResult,
        clickResult,
      ] =
        await Promise.all(
          [
            supabase
              .from(
                "campaign_opens"
              )
              .select(
                "id,campaign_id,profile_id"
              )
              .in(
                "campaign_id",
                campaignIds
              ),

            supabase
              .from(
                "campaign_clicks"
              )
              .select(
                "id,campaign_id,profile_id"
              )
              .in(
                "campaign_id",
                campaignIds
              ),
          ]
        );

      const openCounts =
        openResult.error
          ? {}
          : createUniqueTrackingCounts(
              openResult.data ||
                []
            );

      const clickCounts =
        clickResult.error
          ? {}
          : createUniqueTrackingCounts(
              clickResult.data ||
                []
            );

      const enriched =
        loaded.map(
          (
            campaign
          ) => ({
            ...campaign,

            status:
              campaign.sent_at ||
              Number(
                campaign.sent_count ||
                  0
              ) > 0
                ? "sent"
                : campaign.status ||
                  "draft",

            open_count:
              openCounts[
                campaign.id
              ] !==
              undefined
                ? openCounts[
                    campaign.id
                  ]
                : Number(
                    campaign.open_count ||
                      0
                  ),

            click_count:
              clickCounts[
                campaign.id
              ] !==
              undefined
                ? clickCounts[
                    campaign.id
                  ]
                : Number(
                    campaign.click_count ||
                      0
                  ),
          })
        );

      setCampaigns(
        enriched
      );
    };

  const refreshStats =
    async () => {
      if (
        refreshingStats
      ) {
        return;
      }

      setRefreshingStats(
        true
      );

      try {
        await loadCampaigns();
      } finally {
        setRefreshingStats(
          false
        );
      }
    };

  // ==================================================
  // LISTS
  // ==================================================

  const loadLists =
    async () => {
      if (
        !organisationId
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "subscriber_lists"
          )
          .select("*")
          .eq(
            "organisation_id",
            organisationId
          )
          .order("name", {
            ascending:
              true,
          });

      if (error) {
        console.error(
          error
        );

        return;
      }

      setLists(
        data || []
      );
    };

  const loadProfiles =
    async () => {
      if (
        !organisationId
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "id,name,full_name,email,is_subscribed"
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .eq(
            "is_subscribed",
            true
          );

      if (error) {
        console.error(
          error
        );

        return;
      }

      setProfiles(
        data || []
      );
    };

  const loadSubscriberCounts =
    async () => {
      if (
        !organisationId
      ) {
        return;
      }

      const [
        profileResult,
        manualResult,
      ] =
        await Promise.all(
          [
            supabase
              .from(
                "profile_subscriber_lists"
              )
              .select(
                "list_id,profile_id,profiles:profiles(email)"
              )
              .eq(
                "organisation_id",
                organisationId
              ),

            supabase
              .from(
                "campaign_list_emails"
              )
              .select(
                "list_id,id,email"
              )
              .eq(
                "organisation_id",
                organisationId
              ),
          ]
        );

      const countMap: Record<
        string,
        Set<string>
      > = {};

      (
        profileResult.data ||
        []
      ).forEach(
        (row: any) => {
          if (
            !row.list_id
          ) {
            return;
          }

          if (
            !countMap[
              row.list_id
            ]
          ) {
            countMap[
              row.list_id
            ] =
              new Set();
          }

          const profile =
            Array.isArray(
              row.profiles
            )
              ? row
                  .profiles[0]
              : row.profiles;

          const email =
            cleanEmail(
              profile?.email
            );

          countMap[
            row.list_id
          ].add(
            email ||
              `profile-${row.profile_id}`
          );
        }
      );

      (
        manualResult.data ||
        []
      ).forEach(
        (row: any) => {
          if (
            !row.list_id
          ) {
            return;
          }

          if (
            !countMap[
              row.list_id
            ]
          ) {
            countMap[
              row.list_id
            ] =
              new Set();
          }

          const email =
            cleanEmail(
              row.email
            );

          countMap[
            row.list_id
          ].add(
            email ||
              `manual-${row.id}`
          );
        }
      );

      const finalCounts: Record<
        string,
        number
      > = {};

      Object.entries(
        countMap
      ).forEach(
        ([
          id,
          set,
        ]) => {
          finalCounts[
            id
          ] =
            set.size;
        }
      );

      setSubscriberCounts(
        finalCounts
      );
    };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    if (
      !organisationId
    ) {
      return;
    }

    let cancelled =
      false;

    const loadAll =
      async () => {
        setLoading(
          true
        );

        await Promise.all(
          [
            loadCampaigns(),
            loadLists(),
            loadProfiles(),
            loadSubscriberCounts(),
          ]
        );

        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      };

    void loadAll();

    return () => {
      cancelled =
        true;
    };
  }, [organisationId]);

  // ==================================================
  // ACTIVE CAMPAIGN POLLING
  // ==================================================

  const hasActiveCampaign =
    campaigns.some(
      (
        campaign
      ) => {
        const status =
          getStatusLabel(
            campaign
          );

        return (
          status ===
            "processing" ||
          status ===
            "sending"
        );
      }
    );

  useEffect(() => {
    if (
      !organisationId ||
      !hasActiveCampaign
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          void loadCampaigns();
        },
        2500
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    organisationId,
    hasActiveCampaign,
  ]);

  // ==================================================
  // LIST MANAGEMENT
  // ==================================================

  const createList =
    async () => {
      if (
        !organisationId
      ) {
        return;
      }

      const name =
        newListName.trim();

      if (!name) {
        alert(
          "Enter a list name."
        );
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "subscriber_lists"
          )
          .insert({
            name,
            organisation_id:
              organisationId,
          });

      if (error) {
        alert(
          error.message
        );

        return;
      }

      setNewListName(
        ""
      );

      setShowCreateList(
        false
      );

      await Promise.all(
        [
          loadLists(),
          loadSubscriberCounts(),
        ]
      );
    };

  const loadListSubscribers =
    async (
      listId: string
    ) => {
      if (
        !organisationId
      ) {
        return;
      }

      setLoadingList(
        true
      );

      try {
        const [
          profileResult,
          manualResult,
        ] =
          await Promise.all(
            [
              supabase
                .from(
                  "profile_subscriber_lists"
                )
                .select(
                  "profile_id,profiles:profiles(id,name,full_name,email)"
                )
                .eq(
                  "list_id",
                  listId
                ),

              supabase
                .from(
                  "campaign_list_emails"
                )
                .select(
                  "id,email"
                )
                .eq(
                  "organisation_id",
                  organisationId
                )
                .eq(
                  "list_id",
                  listId
                ),
            ]
          );

        const combined: ListSubscriber[] =
          [];

        (
          profileResult.data ||
          []
        ).forEach(
          (row: any) => {
            const profile =
              Array.isArray(
                row.profiles
              )
                ? row
                    .profiles[0]
                : row.profiles;

            const email =
              cleanEmail(
                profile?.email
              );

            if (!email) {
              return;
            }

            combined.push(
              {
                id: String(
                  row.profile_id
                ),
                source:
                  "profile",
                profileId:
                  String(
                    row.profile_id
                  ),
                manualId:
                  null,
                name:
                  profile?.full_name ||
                  profile?.name ||
                  null,
                email,
              }
            );
          }
        );

        (
          manualResult.data ||
          []
        ).forEach(
          (row: any) => {
            const email =
              cleanEmail(
                row.email
              );

            if (!email) {
              return;
            }

            combined.push(
              {
                id: String(
                  row.id
                ),
                source:
                  "manual",
                profileId:
                  null,
                manualId:
                  String(
                    row.id
                  ),
                name:
                  null,
                email,
              }
            );
          }
        );

        const seen =
          new Set<string>();

        setListSubscribers(
          combined.filter(
            (
              subscriber
            ) => {
              if (
                seen.has(
                  subscriber.email
                )
              ) {
                return false;
              }

              seen.add(
                subscriber.email
              );

              return true;
            }
          )
        );
      } finally {
        setLoadingList(
          false
        );
      }
    };

  const openAudience =
    async (
      list: SubscriberList
    ) => {
      setSelectedList(
        list
      );

      setScreen(
        "audiences"
      );

      await loadListSubscribers(
        list.id
      );
    };

  const addSelectedProfiles =
    async (
      listId: string
    ) => {
      if (
        !organisationId ||
        selectedProfiles.length ===
          0
      ) {
        return;
      }

      const rows =
        selectedProfiles.map(
          (
            profileId
          ) => ({
            profile_id:
              profileId,
            list_id:
              listId,
            organisation_id:
              organisationId,
          })
        );

      const {
        error,
      } =
        await supabase
          .from(
            "profile_subscriber_lists"
          )
          .upsert(
            rows,
            {
              onConflict:
                "profile_id,list_id",
            }
          );

      if (error) {
        throw error;
      }
    };

  const addManualEmails =
    async (
      listId: string,
      emails: string[]
    ) => {
      if (
        !organisationId ||
        emails.length ===
          0
      ) {
        return;
      }

      const clean =
        Array.from(
          new Set(
            emails
              .map(
                cleanEmail
              )
              .filter(
                (
                  email
                ) =>
                  email &&
                  isValidEmail(
                    email
                  )
              )
          )
        );

      if (
        clean.length ===
        0
      ) {
        return;
      }

      const {
        data:
          existing,
      } =
        await supabase
          .from(
            "campaign_list_emails"
          )
          .select(
            "email"
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .eq(
            "list_id",
            listId
          );

      const existingSet =
        new Set(
          (
            existing ||
            []
          ).map(
            (row: any) =>
              cleanEmail(
                row.email
              )
          )
        );

      const newEmails =
        clean.filter(
          (
            email
          ) =>
            !existingSet.has(
              email
            )
        );

      if (
        newEmails.length ===
        0
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "campaign_list_emails"
          )
          .insert(
            newEmails.map(
              (
                email
              ) => ({
                organisation_id:
                  organisationId,
                list_id:
                  listId,
                email,
              })
            )
          );

      if (error) {
        throw error;
      }
    };

  const saveSubscribers =
    async () => {
      if (
        !selectedList
      ) {
        return;
      }

      const parsed =
        parseEmails(
          manualEmails
        );

      if (
        selectedProfiles.length ===
          0 &&
        parsed.length === 0
      ) {
        alert(
          "Choose contacts or enter an email."
        );

        return;
      }

      setSavingSubscribers(
        true
      );

      try {
        await addSelectedProfiles(
          selectedList.id
        );

        await addManualEmails(
          selectedList.id,
          parsed
        );

        setSelectedProfiles(
          []
        );

        setManualEmails(
          ""
        );

        setShowSubscriberManager(
          false
        );

        await Promise.all(
          [
            loadListSubscribers(
              selectedList.id
            ),
            loadSubscriberCounts(),
          ]
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        alert(
          "Could not save subscribers."
        );
      } finally {
        setSavingSubscribers(
          false
        );
      }
    };

  const removeSubscriber =
    async (
      subscriber: ListSubscriber
    ) => {
      if (
        !selectedList
      ) {
        return;
      }

      if (
        subscriber.source ===
          "profile" &&
        subscriber.profileId
      ) {
        await supabase
          .from(
            "profile_subscriber_lists"
          )
          .delete()
          .eq(
            "list_id",
            selectedList.id
          )
          .eq(
            "profile_id",
            subscriber.profileId
          );
      }

      if (
        subscriber.source ===
          "manual" &&
        subscriber.manualId
      ) {
        await supabase
          .from(
            "campaign_list_emails"
          )
          .delete()
          .eq(
            "id",
            subscriber.manualId
          );
      }

      await Promise.all(
        [
          loadListSubscribers(
            selectedList.id
          ),
          loadSubscriberCounts(),
        ]
      );
    };

  // ==================================================
  // CAMPAIGN OPEN / EDIT
  // ==================================================

  const openNewCampaign =
    () => {
      setEditingCampaignId(
        null
      );

      setSelectedCampaign(
        null
      );

      setCampaignForm(
        emptyForm(
          company
        )
      );

      setEditorStep(
        "details"
      );

      setScreen(
        "editor"
      );
    };

  const editCampaign =
    (
      campaign: Campaign
    ) => {
      const mode: EditorMode =
        campaign.editor_mode ===
        "html"
          ? "html"
          : "blocks";

      const contentText =
        extractMessage(
          campaign.content ||
            ""
        );

      const blocks: CampaignBlock[] =
        [
          {
            id: "existing-text",
            type: "text",
            content:
              contentText ||
              "Write your message here...",
          },
        ];

      if (
        campaign.header_image_url
      ) {
        blocks.unshift(
          {
            id: "existing-image",
            type: "image",
            content: "",
            imageUrl:
              campaign.header_image_url,
          }
        );
      }

      if (
        campaign.cta_text ||
        campaign.cta_url
      ) {
        blocks.push({
          id: "existing-button",
          type: "button",
          content:
            campaign.cta_text ||
            "Learn more",
          url:
            campaign.cta_url ||
            "https://",
        });
      }

      setEditingCampaignId(
        campaign.id
      );

      setCampaignForm(
        {
          title:
            campaign.title ||
            "",

          subject:
            campaign.subject ||
            "",

          previewText:
            campaign.preview_text ||
            "",

          message:
            contentText,

          listId:
            campaign.list_id ||
            "",

          scheduledFor:
            isoToLocalInput(
              campaign.scheduled_for
            ),

          senderName:
            campaign.sender_name ||
            company.name,

          replyTo:
            campaign.reply_to ||
            company.email,

          campaignLogoUrl:
            extractCampaignLogoUrl(
              campaign.content ||
                ""
            ) ||
            company.logoUrl,

          headerImageUrl:
            campaign.header_image_url ||
            "",

          ctaText:
            campaign.cta_text ||
            "",

          ctaUrl:
            campaign.cta_url ||
            "",

          brandColor:
            campaign.brand_color ||
            DEFAULT_BRAND_COLOR,

          blocks,

          mode,

          customHtml:
            campaign.custom_html ||
            (mode ===
            "html"
              ? contentText
              : ""),
        }
      );

      setEditorStep(
        "details"
      );

      setScreen(
        "editor"
      );
    };

  const duplicateCampaign =
    (
      campaign: Campaign
    ) => {
      editCampaign(
        campaign
      );

      setEditingCampaignId(
        null
      );

      setCampaignForm(
        (
          previous
        ) => ({
          ...previous,
          title: `${previous.title} (copy)`,
          scheduledFor:
            "",
        })
      );
    };

  // ==================================================
  // PAYLOAD
  // ==================================================

  const buildPayload = (
    scheduledFor:
      | string
      | null
  ) => ({
    title:
      campaignForm.title.trim(),

    subject:
      campaignForm.subject.trim(),

    preview_text:
      campaignForm.previewText.trim() ||
      null,

    content:
      buildCampaignHtml(
        {
          message:
            campaignForm.message,

          company,

          campaignLogoUrl:
            campaignForm.campaignLogoUrl.trim(),

          headerImageUrl:
            campaignForm.headerImageUrl.trim(),

          ctaText:
            campaignForm.ctaText.trim(),

          ctaUrl:
            campaignForm.ctaUrl.trim(),

          brandColor:
            campaignForm.brandColor ||
            DEFAULT_BRAND_COLOR,

          blocks:
            campaignForm.blocks,

          mode:
            campaignForm.mode,

          customHtml:
            campaignForm.customHtml,
        }
      ),

    list_id:
      campaignForm.listId,

    scheduled_for:
      scheduledFor,

    sender_name:
      campaignForm.senderName.trim() ||
      company.name,

    reply_to:
      campaignForm.replyTo.trim() ||
      company.email,

    header_image_url:
      campaignForm.headerImageUrl.trim() ||
      null,

    brand_color:
      campaignForm.brandColor ||
      DEFAULT_BRAND_COLOR,

    cta_text:
      campaignForm.mode ===
      "html"
        ? null
        : campaignForm.ctaText.trim() ||
          null,

    cta_url:
      campaignForm.mode ===
      "html"
        ? null
        : campaignForm.ctaUrl.trim() ||
          null,

    organisation_id:
      organisationId,

    editor_mode:
      campaignForm.mode,

    custom_html:
      campaignForm.mode ===
      "html"
        ? campaignForm.customHtml
        : null,
  });

  // ==================================================
  // WIZARD VALIDATION
  // ==================================================

  const validateStep = (
    step: EditorStep
  ) => {
    if (
      step ===
      "details"
    ) {
      if (
        !campaignForm.title.trim()
      ) {
        alert(
          "Enter a campaign name."
        );

        return false;
      }

      if (
        !campaignForm.subject.trim()
      ) {
        alert(
          "Enter an email subject."
        );

        return false;
      }

      if (
        campaignForm.replyTo.trim() &&
        !isValidEmail(
          campaignForm.replyTo.trim()
        )
      ) {
        alert(
          "Enter a valid reply-to email."
        );

        return false;
      }
    }

    if (
      step ===
      "audience"
    ) {
      if (
        !campaignForm.listId
      ) {
        alert(
          "Choose an audience."
        );

        return false;
      }

      if (
        (subscriberCounts[
          campaignForm.listId
        ] || 0) === 0
      ) {
        alert(
          "This audience has no subscribers."
        );

        return false;
      }
    }

    if (
      step ===
      "design"
    ) {
      if (
        campaignForm.mode ===
        "html"
      ) {
        if (
          !campaignForm.customHtml.trim()
        ) {
          alert(
            "Add your custom HTML."
          );

          return false;
        }
      } else {
        const hasContent =
          campaignForm.blocks.some(
            (
              block
            ) =>
              Boolean(
                block.content?.trim()
              ) ||
              Boolean(
                block.imageUrl
              )
          );

        if (
          !hasContent
        ) {
          alert(
            "Add some content to your email."
          );

          return false;
        }
      }
    }

    return true;
  };

  const goNext =
    () => {
      if (
        !validateStep(
          editorStep
        )
      ) {
        return;
      }

      const index =
        EDITOR_STEPS.findIndex(
          (
            step
          ) =>
            step.id ===
            editorStep
        );

      if (
        index <
        EDITOR_STEPS.length -
          1
      ) {
        setEditorStep(
          EDITOR_STEPS[
            index + 1
          ].id
        );
      }
    };

  const goPrevious =
    () => {
      const index =
        EDITOR_STEPS.findIndex(
          (
            step
          ) =>
            step.id ===
            editorStep
        );

      if (
        index > 0
      ) {
        setEditorStep(
          EDITOR_STEPS[
            index - 1
          ].id
        );
      } else {
        setScreen(
          "campaigns"
        );
      }
    };

  const validateCampaign =
    () =>
      validateStep(
        "details"
      ) &&
      validateStep(
        "audience"
      ) &&
      validateStep(
        "design"
      );

  // ==================================================
  // SEND / SCHEDULE
  // ==================================================

  const callSendApi =
    async (
      campaignId: string
    ) => {
      const response =
        await fetch(
          "/api/campaigns/send",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                campaignId,
              }
            ),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            result.message ||
            "Campaign could not be sent."
        );
      }

      return result;
    };

  const saveAndSendNow =
    async () => {
      if (
        !validateCampaign() ||
        !organisationId
      ) {
        return;
      }

      setSavingCampaign(
        true
      );

      try {
        const payload =
          {
            ...buildPayload(
              null
            ),

            scheduled_for:
              null,

            status:
              "queued",

            sent_at:
              null,

            sent_count:
              0,

            open_count:
              0,

            click_count:
              0,
          };

        let campaignId:
          | string
          | null =
          null;

        if (
          editingCampaignId
        ) {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "campaigns"
              )
              .update(
                payload
              )
              .eq(
                "id",
                editingCampaignId
              )
              .select(
                "id"
              )
              .single();

          if (error) {
            throw error;
          }

          campaignId =
            data.id;
        } else {
          const {
            data: {
              user,
            },
          } =
            await supabase.auth.getUser();

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "campaigns"
              )
              .insert({
                ...payload,
                user_id:
                  user?.id,
              })
              .select(
                "id"
              )
              .single();

          if (error) {
            throw error;
          }

          campaignId =
            data.id;
        }

        await callSendApi(
          campaignId
        );

        await loadCampaigns();

        setEditingCampaignId(
          null
        );

        setScreen(
          "campaigns"
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        alert(
          error instanceof
            Error
            ? error.message
            : "Could not send campaign."
        );
      } finally {
        setSavingCampaign(
          false
        );
      }
    };

  const scheduleCampaign =
    async () => {
      if (
        !validateCampaign() ||
        !organisationId
      ) {
        return;
      }

      if (
        !campaignForm.scheduledFor
      ) {
        alert(
          "Choose a date and time."
        );

        return;
      }

      const isoDate =
        localInputToIso(
          campaignForm.scheduledFor
        );

      if (!isoDate) {
        alert(
          "Invalid date."
        );

        return;
      }

      if (
        new Date(
          isoDate
        ).getTime() <=
        Date.now()
      ) {
        alert(
          "Scheduled time must be in the future."
        );

        return;
      }

      setSavingCampaign(
        true
      );

      try {
        const payload =
          {
            ...buildPayload(
              isoDate
            ),

            status:
              "queued",

            sent_at:
              null,

            sent_count:
              0,

            open_count:
              0,

            click_count:
              0,
          };

        if (
          editingCampaignId
        ) {
          const {
            error,
          } =
            await supabase
              .from(
                "campaigns"
              )
              .update(
                payload
              )
              .eq(
                "id",
                editingCampaignId
              );

          if (error) {
            throw error;
          }
        } else {
          const {
            data: {
              user,
            },
          } =
            await supabase.auth.getUser();

          const {
            error,
          } =
            await supabase
              .from(
                "campaigns"
              )
              .insert({
                ...payload,
                user_id:
                  user?.id,
              });

          if (error) {
            throw error;
          }
        }

        await loadCampaigns();

        setScreen(
          "campaigns"
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        alert(
          "Could not schedule campaign."
        );
      } finally {
        setSavingCampaign(
          false
        );
      }
    };

  const sendExistingCampaign =
    async (
      campaignId: string
    ) => {
      setSendingCampaignId(
        campaignId
      );

      try {
        await callSendApi(
          campaignId
        );

        await loadCampaigns();
      } catch (
        error
      ) {
        alert(
          error instanceof
            Error
            ? error.message
            : "Could not send campaign."
        );
      } finally {
        setSendingCampaignId(
          null
        );
      }
    };

  const deleteCampaign =
    async (
      campaign: Campaign
    ) => {
      if (
        !window.confirm(
          `Delete "${campaign.title}"?`
        )
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "campaigns"
          )
          .delete()
          .eq(
            "id",
            campaign.id
          );

      if (error) {
        alert(
          "Could not delete campaign."
        );

        return;
      }

      setSelectedCampaign(
        null
      );

      setScreen(
        "campaigns"
      );

      await loadCampaigns();
    };

  // ==================================================
  // TEST SEND
  // ==================================================

  const sendTestEmail =
    async () => {
      if (
        !isValidEmail(
          testEmail
        )
      ) {
        setTestSendResult(
          "Enter a valid email."
        );

        return;
      }

      if (
        !validateStep(
          "details"
        ) ||
        !validateStep(
          "design"
        )
      ) {
        return;
      }

      setSendingTest(
        true
      );

      setTestSendResult(
        null
      );

      try {
        const html =
          buildCampaignHtml(
            {
              message:
                campaignForm.message,

              company,

              campaignLogoUrl:
                campaignForm.campaignLogoUrl,

              headerImageUrl:
                campaignForm.headerImageUrl,

              ctaText:
                campaignForm.ctaText,

              ctaUrl:
                campaignForm.ctaUrl,

              brandColor:
                campaignForm.brandColor,

              blocks:
                campaignForm.blocks,

              mode:
                campaignForm.mode,

              customHtml:
                campaignForm.customHtml,
            }
          );

        const response =
          await fetch(
            "/api/campaigns/send-test",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  to: testEmail.trim(),

                  subject: `[TEST] ${
                    campaignForm.subject ||
                    "(no subject)"
                  }`,

                  html,

                  senderName:
                    campaignForm.senderName ||
                    company.name,

                  replyTo:
                    campaignForm.replyTo ||
                    company.email,
                }
              ),
            }
          );

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              "Could not send test."
          );
        }

        setTestSendResult(
          `Test sent to ${testEmail}`
        );
      } catch (
        error
      ) {
        setTestSendResult(
          error instanceof
            Error
            ? error.message
            : "Could not send test."
        );
      } finally {
        setSendingTest(
          false
        );
      }
    };

  // ==================================================
  // AI
  // ==================================================

  const generateWithAi =
    async () => {
      if (
        !aiPrompt.trim()
      ) {
        setAiError(
          "Tell TOTS what you want to write."
        );

        return;
      }

      setAiGenerating(
        true
      );

      setAiError(
        null
      );

      try {
        const response =
          await fetch(
            "/api/campaigns/ai-generate",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  prompt:
                    aiPrompt,

                  tone:
                    aiTone,

                  format:
                    aiTarget,

                  companyName:
                    company.name,
                }
              ),
            }
          );

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              "Could not generate content."
          );
        }

        if (
          aiTarget ===
            "html" &&
          result.html
        ) {
          setCampaignForm(
            (
              previous
            ) => ({
              ...previous,

              mode:
                "html",

              customHtml:
                result.html,
            })
          );
        }

        if (
          aiTarget ===
            "blocks" &&
          Array.isArray(
            result.blocks
          )
        ) {
          setCampaignForm(
            (
              previous
            ) => ({
              ...previous,

              mode:
                "blocks",

              blocks:
                result.blocks.map(
                  (
                    block: any
                  ) => ({
                    id: `${
                      block.type ||
                      "text"
                    }-${Date.now()}-${Math.random()
                      .toString(
                        36
                      )
                      .slice(
                        2,
                        8
                      )}`,

                    type:
                      [
                        "text",
                        "image",
                        "button",
                        "divider",
                        "spacer",
                      ].includes(
                        block.type
                      )
                        ? block.type
                        : "text",

                    content:
                      block.content ||
                      "",

                    url:
                      block.url ||
                      "",

                    imageUrl:
                      block.imageUrl ||
                      "",
                  })
                ),
            })
          );
        }

        if (
          result.subject &&
          !campaignForm.subject
        ) {
          setCampaignForm(
            (
              previous
            ) => ({
              ...previous,
              subject:
                result.subject,
            })
          );
        }

        setShowAiAssist(
          false
        );

        setAiPrompt(
          ""
        );
      } catch (
        error
      ) {
        setAiError(
          error instanceof
            Error
            ? error.message
            : "Could not generate."
        );
      } finally {
        setAiGenerating(
          false
        );
      }
    };

  // ==================================================
  // PREVIEW
  // ==================================================

  const previewHtml =
    buildCampaignHtml(
      {
        message:
          campaignForm.message,

        company,

        campaignLogoUrl:
          campaignForm.campaignLogoUrl.trim(),

        headerImageUrl:
          campaignForm.headerImageUrl.trim(),

        ctaText:
          campaignForm.ctaText.trim(),

        ctaUrl:
          campaignForm.ctaUrl.trim(),

        brandColor:
          campaignForm.brandColor,

        blocks:
          campaignForm.blocks,

        mode:
          campaignForm.mode,

        customHtml:
          campaignForm.customHtml,
      }
    );

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f7]">
        <Loader2 className="h-7 w-7 animate-spin text-stone-400" />
      </div>
    );
  }

  // ==================================================
  // EDITOR SCREEN
  // ==================================================

  if (
    screen ===
    "editor"
  ) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] text-stone-900">
        {/* EDITOR HEADER */}

        <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setScreen(
                    "campaigns"
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50"
              >
                <ArrowLeft
                  size={16}
                />
              </button>

              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#82916f]">
                  {editingCampaignId
                    ? "Edit Campaign"
                    : "New Campaign"}
                </p>

                <h1 className="truncate text-lg font-black">
                  {campaignForm.title ||
                    "Untitled campaign"}
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowAiAssist(
                  true
                )
              }
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-white"
            >
              <Sparkles
                size={13}
              />
              AI Assist
            </button>
          </div>

          <StepBar
            current={
              editorStep
            }
            onStep={
              setEditorStep
            }
          />
        </header>

        {/* EDITOR BODY */}

        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
          {/* STEP 1 DETAILS */}

          {editorStep ===
            "details" && (
            <div className="mx-auto max-w-3xl">
              <div className="mb-8">
                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#82916f]">
                  Step 1
                </p>

                <h2 className="mt-3 text-3xl font-black md:text-4xl">
                  Campaign
                  details
                </h2>

                <p className="mt-3 text-sm leading-7 text-stone-500">
                  Start with
                  what your
                  subscribers will
                  see in their
                  inbox.
                </p>
              </div>

              <div className="space-y-5 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
                <div>
                  <FieldLabel>
                    Campaign
                    name
                  </FieldLabel>

                  <input
                    value={
                      campaignForm.title
                    }
                    onChange={(
                      event
                    ) =>
                      setCampaignForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          title:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="August launch campaign"
                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-4 text-sm font-semibold outline-none transition focus:border-stone-900"
                  />

                  <p className="mt-2 text-[10px] text-stone-400">
                    Only you
                    will see
                    this name.
                  </p>
                </div>

                <div>
                  <FieldLabel>
                    Subject
                    line
                  </FieldLabel>

                  <input
                    value={
                      campaignForm.subject
                    }
                    onChange={(
                      event
                    ) =>
                      setCampaignForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          subject:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Something exciting is here..."
                    className="w-full rounded-xl border border-stone-200 px-4 py-4 text-lg font-bold outline-none transition focus:border-stone-900"
                  />

                  <div className="mt-2 flex justify-between text-[10px] text-stone-400">
                    <span>
                      Aim for
                      something
                      clear and
                      catchy.
                    </span>

                    <span>
                      {
                        campaignForm
                          .subject
                          .length
                      }
                      /60
                    </span>
                  </div>
                </div>

                <div>
                  <FieldLabel>
                    Preview
                    text
                  </FieldLabel>

                  <input
                    value={
                      campaignForm.previewText
                    }
                    onChange={(
                      event
                    ) =>
                      setCampaignForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          previewText:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Shown beside the subject in many inboxes"
                    className="w-full rounded-xl border border-stone-200 px-4 py-4 text-sm outline-none focus:border-stone-900"
                  />
                </div>

                <div className="grid gap-5 border-t border-stone-100 pt-6 md:grid-cols-2">
                  <div>
                    <FieldLabel>
                      Sender
                      name
                    </FieldLabel>

                    <input
                      value={
                        campaignForm.senderName
                      }
                      onChange={(
                        event
                      ) =>
                        setCampaignForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            senderName:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-stone-200 px-4 py-4 text-sm outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Reply-to
                      email
                    </FieldLabel>

                    <input
                      type="email"
                      value={
                        campaignForm.replyTo
                      }
                      onChange={(
                        event
                      ) =>
                        setCampaignForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            replyTo:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-stone-200 px-4 py-4 text-sm outline-none focus:border-stone-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 AUDIENCE */}

          {editorStep ===
            "audience" && (
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#82916f]">
                    Step 2
                  </p>

                  <h2 className="mt-3 text-3xl font-black md:text-4xl">
                    Choose your
                    audience
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-stone-500">
                    Select the
                    subscriber list
                    that should
                    receive this
                    campaign.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateList(
                      true
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-[9px] font-black uppercase tracking-[0.14em]"
                >
                  <Plus
                    size={
                      13
                    }
                  />
                  New
                  audience
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {lists.map(
                  (
                    list
                  ) => {
                    const selected =
                      campaignForm.listId ===
                      list.id;

                    return (
                      <button
                        key={
                          list.id
                        }
                        type="button"
                        onClick={() =>
                          setCampaignForm(
                            (
                              previous
                            ) => ({
                              ...previous,
                              listId:
                                list.id,
                            })
                          )
                        }
                        className={`group flex items-center justify-between rounded-[1.75rem] border p-6 text-left transition ${
                          selected
                            ? "border-[#a9b897] bg-[#a9b897]/10 shadow-sm"
                            : "border-stone-200 bg-white hover:border-stone-400"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                              selected
                                ? "bg-[#a9b897] text-stone-900"
                                : "bg-stone-100 text-stone-500"
                            }`}
                          >
                            <Users
                              size={
                                18
                              }
                            />
                          </div>

                          <div>
                            <p className="font-black">
                              {
                                list.name
                              }
                            </p>

                            <p className="mt-1 text-xs text-stone-400">
                              {subscriberCounts[
                                list
                                  .id
                              ] ||
                                0}{" "}
                              subscribers
                            </p>
                          </div>
                        </div>

                        {selected ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white">
                            <Check
                              size={
                                13
                              }
                            />
                          </div>
                        ) : (
                          <ChevronRight
                            size={
                              16
                            }
                            className="text-stone-300"
                          />
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              {lists.length ===
                0 && (
                <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white p-12 text-center">
                  <Users
                    size={28}
                    className="mx-auto text-stone-300"
                  />

                  <h3 className="mt-5 text-lg font-black">
                    Create your
                    first audience
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-400">
                    Add a list,
                    then add
                    subscribers
                    before sending
                    your campaign.
                  </p>

                  <button
                    onClick={() =>
                      setShowCreateList(
                        true
                      )
                    }
                    className="mt-6 rounded-xl bg-stone-900 px-6 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-[#a9b897]"
                  >
                    Create
                    audience
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 DESIGN */}

          {editorStep ===
            "design" && (
            <div>
              <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#82916f]">
                    Step 3
                  </p>

                  <h2 className="mt-3 text-3xl font-black md:text-4xl">
                    Design your
                    email
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
                    Build it with
                    blocks or paste
                    completely
                    custom HTML.
                  </p>
                </div>

                <div className="flex gap-2 rounded-xl bg-stone-200/70 p-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCampaignForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          mode:
                            "blocks",
                        })
                      )
                    }
                    className={`flex items-center gap-2 rounded-lg px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] ${
                      campaignForm.mode ===
                      "blocks"
                        ? "bg-white text-stone-900 shadow-sm"
                        : "text-stone-500"
                    }`}
                  >
                    <LayoutTemplate
                      size={
                        13
                      }
                    />
                    Builder
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCampaignForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          mode:
                            "html",
                        })
                      )
                    }
                    className={`flex items-center gap-2 rounded-lg px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] ${
                      campaignForm.mode ===
                      "html"
                        ? "bg-white text-stone-900 shadow-sm"
                        : "text-stone-500"
                    }`}
                  >
                    <Code2
                      size={
                        13
                      }
                    />
                    Custom
                    HTML
                  </button>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                {/* DESIGN AREA */}

                <section className="space-y-5">
                  {/* EMAIL BRANDING */}

                  <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6">
                    <div className="mb-5">
                      <p className="text-xs font-black">
                        Email
                        branding
                      </p>

                      <p className="mt-1 text-[10px] text-stone-400">
                        Optional
                        logo and
                        hero image.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <FieldLabel>
                          Campaign
                          logo
                        </FieldLabel>

                        <div className="flex gap-2">
                          <input
                            value={
                              campaignForm.campaignLogoUrl
                            }
                            onChange={(
                              event
                            ) =>
                              setCampaignForm(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  campaignLogoUrl:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            placeholder="Logo URL"
                            className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-3 text-xs outline-none"
                          />

                          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-stone-100 px-3 text-[8px] font-black uppercase">
                            {uploadingLogo ? (
                              <Loader2
                                size={
                                  12
                                }
                                className="animate-spin"
                              />
                            ) : (
                              <ImageIcon
                                size={
                                  12
                                }
                              />
                            )}

                            Upload

                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(
                                event
                              ) => {
                                const file =
                                  event
                                    .target
                                    .files?.[0];

                                if (
                                  file
                                ) {
                                  void handleLogoUpload(
                                    file
                                  );
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <FieldLabel>
                          Header
                          image
                        </FieldLabel>

                        <div className="flex gap-2">
                          <input
                            value={
                              campaignForm.headerImageUrl
                            }
                            onChange={(
                              event
                            ) =>
                              setCampaignForm(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  headerImageUrl:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            placeholder="Image URL"
                            className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-3 text-xs outline-none"
                          />

                          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-stone-100 px-3 text-[8px] font-black uppercase">
                            {uploadingHeaderImage ? (
                              <Loader2
                                size={
                                  12
                                }
                                className="animate-spin"
                              />
                            ) : (
                              <ImageIcon
                                size={
                                  12
                                }
                              />
                            )}

                            Upload

                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(
                                event
                              ) => {
                                const file =
                                  event
                                    .target
                                    .files?.[0];

                                if (
                                  file
                                ) {
                                  void handleHeaderImageUpload(
                                    file
                                  );
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BLOCK MODE */}

                  {campaignForm.mode ===
                    "blocks" && (
                    <>
                      <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-black">
                              Content
                              blocks
                            </p>

                            <p className="mt-1 text-[10px] text-stone-400">
                              Add,
                              duplicate
                              and
                              rearrange
                              sections.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {[
                              "text",
                              "image",
                              "button",
                              "divider",
                              "spacer",
                            ].map(
                              (
                                type
                              ) => (
                                <button
                                  key={
                                    type
                                  }
                                  type="button"
                                  onClick={() =>
                                    addBlock(
                                      type as CampaignBlock["type"]
                                    )
                                  }
                                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-[8px] font-black uppercase tracking-[0.1em] hover:bg-stone-50"
                                >
                                  +
                                  {
                                    type
                                  }
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {campaignForm.blocks.map(
                          (
                            block,
                            index
                          ) => (
                            <div
                              key={
                                block.id
                              }
                              onDragOver={(
                                event
                              ) =>
                                event.preventDefault()
                              }
                              onDrop={() => {
                                if (
                                  draggingBlockId &&
                                  draggingBlockId !==
                                    block.id
                                ) {
                                  moveBlock(
                                    draggingBlockId,
                                    block.id
                                  );
                                }

                                setDraggingBlockId(
                                  null
                                );
                              }}
                              className="rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm"
                            >
                              <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    draggable
                                    onDragStart={() =>
                                      setDraggingBlockId(
                                        block.id
                                      )
                                    }
                                    className="cursor-grab text-stone-300"
                                  >
                                    <GripVertical
                                      size={
                                        16
                                      }
                                    />
                                  </span>

                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-[9px] font-black">
                                    {index +
                                      1}
                                  </span>

                                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-stone-400">
                                    {
                                      block.type
                                    }
                                  </span>
                                </div>

                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      duplicateBlock(
                                        block.id
                                      )
                                    }
                                    className="text-stone-400 hover:text-stone-900"
                                  >
                                    <Copy
                                      size={
                                        14
                                      }
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteBlock(
                                        block.id
                                      )
                                    }
                                    className="text-stone-300 hover:text-red-500"
                                  >
                                    <Trash2
                                      size={
                                        14
                                      }
                                    />
                                  </button>
                                </div>
                              </div>

                              {block.type ===
                                "text" && (
                                <textarea
                                  value={
                                    block.content
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateBlock(
                                      block.id,
                                      {
                                        content:
                                          event
                                            .target
                                            .value,
                                      }
                                    )
                                  }
                                  rows={
                                    6
                                  }
                                  className="w-full resize-y rounded-xl border border-stone-100 bg-[#fafafa] p-4 text-sm leading-7 outline-none focus:border-stone-300"
                                />
                              )}

                              {block.type ===
                                "image" && (
                                <div className="space-y-3">
                                  <input
                                    value={
                                      block.imageUrl ||
                                      ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateBlock(
                                        block.id,
                                        {
                                          imageUrl:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    placeholder="Image URL"
                                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none"
                                  />

                                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 py-3 text-[8px] font-black uppercase">
                                    {uploadingBlockId ===
                                    block.id ? (
                                      <Loader2
                                        size={
                                          12
                                        }
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <ImageIcon
                                        size={
                                          12
                                        }
                                      />
                                    )}

                                    Upload
                                    image

                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(
                                        event
                                      ) => {
                                        const file =
                                          event
                                            .target
                                            .files?.[0];

                                        if (
                                          file
                                        ) {
                                          void handleBlockImageUpload(
                                            block.id,
                                            file
                                          );
                                        }
                                      }}
                                    />
                                  </label>

                                  {block.imageUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={
                                        block.imageUrl
                                      }
                                      alt=""
                                      className="max-h-72 w-full rounded-xl object-cover"
                                    />
                                  )}
                                </div>
                              )}

                              {block.type ===
                                "button" && (
                                <div className="grid gap-3 md:grid-cols-2">
                                  <input
                                    value={
                                      block.content
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateBlock(
                                        block.id,
                                        {
                                          content:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    placeholder="Button text"
                                    className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none"
                                  />

                                  <input
                                    value={
                                      block.url ||
                                      ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateBlock(
                                        block.id,
                                        {
                                          url:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    placeholder="https://..."
                                    className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none"
                                  />
                                </div>
                              )}

                              {block.type ===
                                "divider" && (
                                <div className="py-6">
                                  <div className="h-px bg-stone-200" />
                                </div>
                              )}

                              {block.type ===
                                "spacer" && (
                                <div className="rounded-xl border border-dashed border-stone-200 py-8 text-center text-[9px] text-stone-300">
                                  32px
                                  spacer
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>

                      <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black">
                              Button
                              colour
                            </p>

                            <p className="mt-1 text-[10px] text-stone-400">
                              Used by
                              CTA
                              buttons.
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={
                                campaignForm.brandColor
                              }
                              onChange={(
                                event
                              ) =>
                                setCampaignForm(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    brandColor:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                              className="h-10 w-10 cursor-pointer"
                            />

                            <span className="font-mono text-xs text-stone-500">
                              {
                                campaignForm.brandColor
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* HTML MODE */}

                  {campaignForm.mode ===
                    "html" && (
                    <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white">
                      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                        <div>
                          <p className="text-xs font-black">
                            Custom
                            HTML
                          </p>

                          <p className="mt-1 text-[10px] text-stone-400">
                            Paste a
                            complete
                            email
                            template.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            htmlFileInputRef.current?.click()
                          }
                          className="rounded-lg border border-stone-200 px-3 py-2 text-[8px] font-black uppercase"
                        >
                          Import
                          .html
                        </button>

                        <input
                          ref={
                            htmlFileInputRef
                          }
                          type="file"
                          accept=".html,text/html"
                          className="hidden"
                          onChange={(
                            event
                          ) => {
                            const file =
                              event
                                .target
                                .files?.[0];

                            if (
                              !file
                            ) {
                              return;
                            }

                            const reader =
                              new FileReader();

                            reader.onload =
                              () =>
                                setCampaignForm(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    customHtml:
                                      String(
                                        reader.result ||
                                          ""
                                      ),
                                  })
                                );

                            reader.readAsText(
                              file
                            );
                          }}
                        />
                      </div>

                      <textarea
                        value={
                          campaignForm.customHtml
                        }
                        onChange={(
                          event
                        ) =>
                          setCampaignForm(
                            (
                              previous
                            ) => ({
                              ...previous,
                              customHtml:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        rows={
                          30
                        }
                        spellCheck={
                          false
                        }
                        placeholder="<table>...</table>"
                        className="w-full resize-y bg-[#171717] p-6 font-mono text-xs leading-6 text-emerald-300 outline-none"
                      />
                    </div>
                  )}
                </section>

                {/* PREVIEW */}

                <aside className="xl:sticky xl:top-44 xl:self-start">
                  <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Eye
                          size={
                            14
                          }
                          className="text-stone-400"
                        />

                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-stone-500">
                          Live
                          preview
                        </p>
                      </div>

                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[7px] font-black uppercase text-stone-400">
                        Desktop
                      </span>
                    </div>

                    <div className="max-h-[650px] overflow-y-auto bg-[#efefed] p-4">
                      <div
                        className="mx-auto bg-white p-5 shadow-sm"
                        dangerouslySetInnerHTML={{
                          __html:
                            previewHtml,
                        }}
                      />
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* STEP 4 REVIEW */}

          {editorStep ===
            "review" && (
            <div className="mx-auto max-w-5xl">
              <div className="mb-8">
                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#82916f]">
                  Final step
                </p>

                <h2 className="mt-3 text-3xl font-black md:text-4xl">
                  Review &
                  send
                </h2>

                <p className="mt-3 text-sm leading-7 text-stone-500">
                  Check
                  everything
                  before your
                  campaign leaves
                  the building.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
                <section className="space-y-4">
                  <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-stone-400">
                        Campaign
                        summary
                      </p>

                      <button
                        onClick={() =>
                          setEditorStep(
                            "details"
                          )
                        }
                        className="text-[8px] font-black uppercase text-[#71805f]"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-stone-400">
                          Subject
                        </p>

                        <p className="mt-1 font-black">
                          {
                            campaignForm.subject
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-stone-400">
                          From
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {
                            campaignForm.senderName
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-stone-400">
                          Audience
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {lists.find(
                            (
                              list
                            ) =>
                              list.id ===
                              campaignForm.listId
                          )
                            ?.name ||
                            "Not selected"}
                        </p>

                        <p className="mt-1 text-xs text-stone-400">
                          {subscriberCounts[
                            campaignForm
                              .listId
                          ] ||
                            0}{" "}
                          recipients
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-stone-400">
                          Editor
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {campaignForm.mode ===
                          "html"
                            ? "Custom HTML"
                            : "Block Builder"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Send
                          size={
                            16
                          }
                        />
                      </div>

                      <div>
                        <p className="text-sm font-black">
                          Send a
                          test
                        </p>

                        <p className="text-[10px] text-stone-400">
                          Make
                          sure it
                          looks
                          right in
                          your
                          inbox.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="email"
                        value={
                          testEmail
                        }
                        onChange={(
                          event
                        ) =>
                          setTestEmail(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="you@example.com"
                        className="flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none"
                      />

                      <button
                        disabled={
                          sendingTest
                        }
                        onClick={() =>
                          void sendTestEmail()
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-5 py-3 text-[9px] font-black uppercase text-blue-700 disabled:opacity-50"
                      >
                        {sendingTest ? (
                          <Loader2
                            size={
                              13
                            }
                            className="animate-spin"
                          />
                        ) : (
                          <Send
                            size={
                              13
                            }
                          />
                        )}

                        Send
                        test
                      </button>
                    </div>

                    {testSendResult && (
                      <p className="mt-3 text-xs font-semibold text-stone-500">
                        {
                          testSendResult
                        }
                      </p>
                    )}
                  </div>

                  <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5">
                    <p className="mb-3 text-[9px] font-black uppercase tracking-[0.14em] text-stone-400">
                      Email
                      preview
                    </p>

                    <div
                      className="rounded-xl border border-stone-100 bg-white p-4"
                      dangerouslySetInnerHTML={{
                        __html:
                          previewHtml,
                      }}
                    />
                  </div>
                </section>

                <aside className="space-y-4">
                  <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <Calendar
                        size={
                          17
                        }
                      />

                      <div>
                        <p className="text-sm font-black">
                          When
                          should
                          it send?
                        </p>

                        <p className="text-[10px] text-stone-400">
                          Send
                          immediately
                          or choose
                          a date.
                        </p>
                      </div>
                    </div>

                    <input
                      type="datetime-local"
                      value={
                        campaignForm.scheduledFor
                      }
                      onChange={(
                        event
                      ) =>
                        setCampaignForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            scheduledFor:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  {campaignForm.scheduledFor ? (
                    <button
                      type="button"
                      disabled={
                        savingCampaign
                      }
                      onClick={() =>
                        void scheduleCampaign()
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#a9b897] px-5 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-stone-900 disabled:opacity-50"
                    >
                      {savingCampaign ? (
                        <Loader2
                          size={
                            14
                          }
                          className="animate-spin"
                        />
                      ) : (
                        <Calendar
                          size={
                            14
                          }
                        />
                      )}

                      Schedule
                      campaign
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        savingCampaign
                      }
                      onClick={() =>
                        void saveAndSendNow()
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-[#a9b897] disabled:opacity-50"
                    >
                      {savingCampaign ? (
                        <Loader2
                          size={
                            14
                          }
                          className="animate-spin"
                        />
                      ) : (
                        <Send
                          size={
                            14
                          }
                        />
                      )}

                      Send
                      campaign
                      now
                    </button>
                  )}

                  <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50 p-5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                      Final
                      check
                    </p>

                    <p className="mt-2 text-xs leading-6 text-amber-700/80">
                      Once you
                      send, the
                      campaign
                      cannot be
                      recalled.
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* WIZARD FOOTER */}

          {editorStep !==
            "review" && (
            <div className="mx-auto mt-10 flex max-w-6xl items-center justify-between border-t border-stone-200 pt-6">
              <button
                type="button"
                onClick={
                  goPrevious
                }
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-stone-500 hover:bg-white"
              >
                <ArrowLeft
                  size={13}
                />
                Back
              </button>

              <button
                type="button"
                onClick={
                  goNext
                }
                className="flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-4 text-[9px] font-black uppercase tracking-[0.14em] text-[#a9b897]"
              >
                Continue
                <ArrowRight
                  size={13}
                />
              </button>
            </div>
          )}
        </main>

        {/* TEMPLATE MODAL */}

        <AnimatePresence>
          {showTemplatePicker && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
              <motion.div
                initial={{
                  opacity:
                    0,
                  scale:
                    0.96,
                }}
                animate={{
                  opacity:
                    1,
                  scale:
                    1,
                }}
                exit={{
                  opacity:
                    0,
                  scale:
                    0.96,
                }}
                className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-7 shadow-2xl"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#82916f]">
                      Templates
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Choose a
                      starting
                      point
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      setShowTemplatePicker(
                        false
                      )
                    }
                    className="rounded-full p-2 hover:bg-stone-100"
                  >
                    <X
                      size={
                        18
                      }
                    />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {STARTER_TEMPLATES.map(
                    (
                      template
                    ) => (
                      <button
                        key={
                          template.id
                        }
                        onClick={() =>
                          applyTemplate(
                            template
                          )
                        }
                        className="rounded-2xl border border-stone-200 p-5 text-left transition hover:border-stone-900"
                      >
                        <LayoutTemplate
                          size={
                            19
                          }
                        />

                        <p className="mt-5 text-sm font-black">
                          {
                            template.name
                          }
                        </p>

                        <p className="mt-1 text-[10px] text-stone-400">
                          {
                            template
                              .blocks
                              .length
                          }{" "}
                          blocks
                        </p>
                      </button>
                    )
                  )}
                </div>

                {savedTemplates.length >
                  0 && (
                  <div className="mt-8 border-t border-stone-100 pt-7">
                    <p className="mb-4 text-[9px] font-black uppercase tracking-wider text-stone-400">
                      Saved
                      templates
                    </p>

                    <div className="space-y-2">
                      {savedTemplates.map(
                        (
                          template
                        ) => (
                          <div
                            key={
                              template.id
                            }
                            className="flex items-center justify-between rounded-xl bg-stone-50 p-4"
                          >
                            <button
                              onClick={() =>
                                applyTemplate(
                                  template
                                )
                              }
                              className="flex-1 text-left text-sm font-bold"
                            >
                              {
                                template.name
                              }
                            </button>

                            <button
                              onClick={() =>
                                deleteSavedTemplate(
                                  template.id
                                )
                              }
                              className="text-red-400"
                            >
                              <Trash2
                                size={
                                  14
                                }
                              />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* AI MODAL */}

        <AnimatePresence>
          {showAiAssist && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
              <motion.div
                initial={{
                  opacity:
                    0,
                  scale:
                    0.96,
                }}
                animate={{
                  opacity:
                    1,
                  scale:
                    1,
                }}
                exit={{
                  opacity:
                    0,
                  scale:
                    0.96,
                }}
                className="w-full max-w-lg rounded-[2rem] bg-white p-7 shadow-2xl"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-violet-500">
                      TOTS AI
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Write
                      campaign
                      content
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      setShowAiAssist(
                        false
                      )
                    }
                  >
                    <X
                      size={
                        18
                      }
                    />
                  </button>
                </div>

                <FieldLabel>
                  What should the
                  email be about?
                </FieldLabel>

                <textarea
                  value={
                    aiPrompt
                  }
                  onChange={(
                    event
                  ) =>
                    setAiPrompt(
                      event
                        .target
                        .value
                    )
                  }
                  rows={5}
                  placeholder="Launch our new service and encourage people to book..."
                  className="w-full rounded-xl border border-stone-200 p-4 text-sm outline-none"
                />

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <select
                    value={
                      aiTone
                    }
                    onChange={(
                      event
                    ) =>
                      setAiTone(
                        event
                          .target
                          .value
                      )
                    }
                    className="rounded-xl border border-stone-200 p-3 text-xs"
                  >
                    <option value="friendly">
                      Friendly
                    </option>

                    <option value="professional">
                      Professional
                    </option>

                    <option value="playful">
                      Playful
                    </option>

                    <option value="urgent">
                      Promotional
                    </option>
                  </select>

                  <select
                    value={
                      aiTarget
                    }
                    onChange={(
                      event
                    ) =>
                      setAiTarget(
                        event
                          .target
                          .value as
                          | "blocks"
                          | "html"
                      )
                    }
                    className="rounded-xl border border-stone-200 p-3 text-xs"
                  >
                    <option value="blocks">
                      Editable
                      blocks
                    </option>

                    <option value="html">
                      Custom HTML
                    </option>
                  </select>
                </div>

                {aiError && (
                  <p className="mt-3 text-xs font-bold text-red-500">
                    {
                      aiError
                    }
                  </p>
                )}

                <button
                  disabled={
                    aiGenerating
                  }
                  onClick={() =>
                    void generateWithAi()
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-4 text-[9px] font-black uppercase tracking-[0.14em] text-white disabled:opacity-50"
                >
                  {aiGenerating ? (
                    <Loader2
                      size={
                        14
                      }
                      className="animate-spin"
                    />
                  ) : (
                    <Wand2
                      size={
                        14
                      }
                    />
                  )}

                  Generate
                  campaign
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CREATE LIST MODAL */}

        <AnimatePresence>
          {showCreateList && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
              <motion.div
                initial={{
                  opacity:
                    0,
                  scale:
                    0.96,
                }}
                animate={{
                  opacity:
                    1,
                  scale:
                    1,
                }}
                exit={{
                  opacity:
                    0,
                  scale:
                    0.96,
                }}
                className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black">
                    New
                    audience
                  </h2>

                  <button
                    onClick={() =>
                      setShowCreateList(
                        false
                      )
                    }
                  >
                    <X
                      size={
                        18
                      }
                    />
                  </button>
                </div>

                <input
                  value={
                    newListName
                  }
                  onChange={(
                    event
                  ) =>
                    setNewListName(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Newsletter subscribers"
                  className="mt-6 w-full rounded-xl border border-stone-200 px-4 py-4 text-sm outline-none"
                />

                <button
                  onClick={() =>
                    void createList()
                  }
                  className="mt-4 w-full rounded-xl bg-stone-900 py-4 text-[9px] font-black uppercase text-[#a9b897]"
                >
                  Create
                  audience
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==================================================
  // AUDIENCE DETAIL SCREEN
  // ==================================================

  if (
    screen ===
      "audiences" &&
    selectedList
  ) {
    return (
      <div className="min-h-screen bg-[#f8f8f7] p-5 text-stone-900 md:p-10">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() =>
              setScreen(
                "campaigns"
              )
            }
            className="mb-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-stone-500"
          >
            <ArrowLeft
              size={13}
            />
            Campaigns
          </button>

          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#82916f]">
                Audience
              </p>

              <h1 className="mt-3 text-4xl font-black md:text-5xl">
                {
                  selectedList.name
                }
              </h1>

              <p className="mt-3 text-sm text-stone-400">
                {
                  listSubscribers.length
                }{" "}
                subscriber
                {listSubscribers.length ===
                1
                  ? ""
                  : "s"}
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedProfiles(
                  []
                );

                setManualEmails(
                  ""
                );

                setShowSubscriberManager(
                  true
                );
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-4 text-[9px] font-black uppercase tracking-[0.14em] text-[#a9b897]"
            >
              <Plus
                size={13}
              />
              Add
              subscribers
            </button>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_auto] border-b border-stone-100 bg-stone-50 px-6 py-4 text-[8px] font-black uppercase tracking-wider text-stone-400">
              <span>
                Subscriber
              </span>

              <span>
                Actions
              </span>
            </div>

            {loadingList ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-stone-300" />
              </div>
            ) : listSubscribers.length ===
              0 ? (
              <div className="py-16 text-center">
                <Mail
                  size={26}
                  className="mx-auto text-stone-200"
                />

                <p className="mt-4 text-sm font-semibold text-stone-400">
                  This
                  audience is
                  empty.
                </p>
              </div>
            ) : (
              listSubscribers.map(
                (
                  subscriber
                ) => (
                  <div
                    key={`${subscriber.source}-${subscriber.id}`}
                    className="flex items-center justify-between border-b border-stone-100 px-6 py-5 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-bold">
                        {subscriber.name ||
                          subscriber.email}
                      </p>

                      {subscriber.name && (
                        <p className="mt-1 text-xs text-stone-400">
                          {
                            subscriber.email
                          }
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        void removeSubscriber(
                          subscriber
                        )
                      }
                      className="rounded-lg p-2 text-red-400 hover:bg-red-50"
                    >
                      <Trash2
                        size={
                          14
                        }
                      />
                    </button>
                  </div>
                )
              )
            )}
          </div>
        </div>

        {/* SUBSCRIBER MANAGER */}

        <AnimatePresence>
          {showSubscriberManager && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
              <motion.div
                initial={{
                  opacity:
                    0,
                  scale:
                    0.96,
                }}
                animate={{
                  opacity:
                    1,
                  scale:
                    1,
                }}
                exit={{
                  opacity:
                    0,
                  scale:
                    0.96,
                }}
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-stone-100 p-6">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[#82916f]">
                      {
                        selectedList.name
                      }
                    </p>

                    <h2 className="mt-2 text-xl font-black">
                      Add
                      subscribers
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      setShowSubscriberManager(
                        false
                      )
                    }
                  >
                    <X
                      size={
                        18
                      }
                    />
                  </button>
                </div>

                <div className="flex-1 space-y-7 overflow-y-auto p-6">
                  <div>
                    <FieldLabel>
                      Add email
                      addresses
                    </FieldLabel>

                    <textarea
                      value={
                        manualEmails
                      }
                      onChange={(
                        event
                      ) =>
                        setManualEmails(
                          event
                            .target
                            .value
                        )
                      }
                      rows={6}
                      placeholder={`hello@example.com\nclient@business.co.uk`}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-7 outline-none"
                    />

                    <p className="mt-2 text-[10px] text-stone-400">
                      {
                        parseEmails(
                          manualEmails
                        ).length
                      }{" "}
                      valid
                      email(s)
                    </p>
                  </div>

                  <div className="border-t border-stone-100 pt-6">
                    <FieldLabel>
                      Existing
                      contacts
                    </FieldLabel>

                    <div className="space-y-2">
                      {profiles.map(
                        (
                          profile
                        ) => {
                          const selected =
                            selectedProfiles.includes(
                              profile.id
                            );

                          return (
                            <label
                              key={
                                profile.id
                              }
                              className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 ${
                                selected
                                  ? "border-[#a9b897] bg-[#a9b897]/10"
                                  : "border-stone-100 bg-stone-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selected
                                }
                                onChange={(
                                  event
                                ) => {
                                  if (
                                    event
                                      .target
                                      .checked
                                  ) {
                                    setSelectedProfiles(
                                      (
                                        previous
                                      ) => [
                                        ...previous,
                                        profile.id,
                                      ]
                                    );
                                  } else {
                                    setSelectedProfiles(
                                      (
                                        previous
                                      ) =>
                                        previous.filter(
                                          (
                                            id
                                          ) =>
                                            id !==
                                            profile.id
                                        )
                                    );
                                  }
                                }}
                              />

                              <div>
                                <p className="text-sm font-bold">
                                  {profile.full_name ||
                                    profile.name ||
                                    profile.email}
                                </p>

                                <p className="mt-1 text-xs text-stone-400">
                                  {
                                    profile.email
                                  }
                                </p>
                              </div>
                            </label>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-100 p-6">
                  <button
                    disabled={
                      savingSubscribers
                    }
                    onClick={() =>
                      void saveSubscribers()
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-[9px] font-black uppercase tracking-[0.14em] text-[#a9b897]"
                  >
                    {savingSubscribers ? (
                      <Loader2
                        size={
                          14
                        }
                        className="animate-spin"
                      />
                    ) : (
                      <Check
                        size={
                          14
                        }
                      />
                    )}

                    Save
                    subscribers
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==================================================
  // ANALYTICS SCREEN
  // ==================================================

  if (
    screen ===
      "analytics" &&
    selectedCampaign
  ) {
    const status =
      getStatusLabel(
        selectedCampaign
      );

    return (
      <div className="min-h-screen bg-[#f8f8f7] p-5 text-stone-900 md:p-10">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() =>
              setScreen(
                "campaigns"
              )
            }
            className="mb-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-stone-500"
          >
            <ArrowLeft
              size={13}
            />
            Campaigns
          </button>

          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#82916f]">
                  Campaign
                  report
                </p>

                <StatusBadge
                  status={
                    status
                  }
                />
              </div>

              <h1 className="mt-3 text-4xl font-black md:text-5xl">
                {
                  selectedCampaign.title
                }
              </h1>

              <p className="mt-3 font-serif italic text-stone-500">
                {
                  selectedCampaign.subject
                }
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {status !==
                "sent" && (
                <button
                  onClick={() =>
                    editCampaign(
                      selectedCampaign
                    )
                  }
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[9px] font-black uppercase"
                >
                  <Edit3
                    size={
                      13
                    }
                  />
                  Edit
                </button>
              )}

              <button
                onClick={() =>
                  duplicateCampaign(
                    selectedCampaign
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[9px] font-black uppercase"
              >
                <Copy
                  size={13}
                />
                Duplicate
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                label:
                  "Sent",
                value:
                  selectedCampaign.sent_count ||
                  0,
                icon:
                  Send,
              },
              {
                label:
                  "Opens",
                value:
                  selectedCampaign.open_count ||
                  0,
                icon:
                  Eye,
              },
              {
                label:
                  "Open rate",
                value: `${getOpenRate(
                  selectedCampaign
                )}%`,
                icon:
                  BarChart3,
              },
              {
                label:
                  "Clicks",
                value:
                  selectedCampaign.click_count ||
                  0,
                icon:
                  MousePointerClick,
              },
              {
                label:
                  "Click rate",
                value: `${getClickRate(
                  selectedCampaign
                )}%`,
                icon:
                  BarChart3,
              },
            ].map(
              (
                stat
              ) => {
                const Icon =
                  stat.icon;

                return (
                  <div
                    key={
                      stat.label
                    }
                    className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
                      <Icon
                        size={
                          15
                        }
                      />
                    </div>

                    <p className="mt-5 text-3xl font-black">
                      {
                        stat.value
                      }
                    </p>

                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.15em] text-stone-400">
                      {
                        stat.label
                      }
                    </p>
                  </div>
                );
              }
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-[2rem] border border-stone-200 bg-white p-6">
              <p className="mb-5 text-[9px] font-black uppercase tracking-[0.16em] text-stone-400">
                Email
                preview
              </p>

              <div
                dangerouslySetInnerHTML={{
                  __html:
                    selectedCampaign.content ||
                    "",
                }}
              />
            </div>

            <aside className="space-y-4">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                  Audience
                </p>

                <p className="mt-2 text-sm font-bold">
                  {selectedCampaign
                    .subscriber_lists
                    ?.name ||
                    "Unknown"}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                  Sent
                </p>

                <p className="mt-2 text-sm font-bold">
                  {selectedCampaign.sent_at
                    ? formatDate(
                        selectedCampaign.sent_at
                      )
                    : selectedCampaign.scheduled_for
                      ? formatDate(
                          selectedCampaign.scheduled_for
                        )
                      : "Not sent"}
                </p>
              </div>

              {status !==
                "sent" && (
                <button
                  disabled={
                    sendingCampaignId ===
                    selectedCampaign.id
                  }
                  onClick={() =>
                    void sendExistingCampaign(
                      selectedCampaign.id
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-[9px] font-black uppercase tracking-[0.14em] text-[#a9b897]"
                >
                  <Send
                    size={
                      13
                    }
                  />
                  Send now
                </button>
              )}

              <button
                onClick={() =>
                  void deleteCampaign(
                    selectedCampaign
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-4 text-[9px] font-black uppercase tracking-[0.14em] text-red-600"
              >
                <Trash2
                  size={13}
                />
                Delete
                campaign
              </button>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // CAMPAIGN DASHBOARD
  // ==================================================

  return (
    <div className="min-h-screen bg-[#f8f8f7] p-4 text-stone-900 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}

        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#82916f]">
              Marketing
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Email
              Campaigns
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
              Create,
              schedule and
              track email
              campaigns from
              one place.
            </p>
          </div>

          <button
            onClick={
              openNewCampaign
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-[#a9b897] shadow-lg"
          >
            <Plus
              size={14}
            />
            Create
            campaign
          </button>
        </header>

        {/* TABS */}

        <div className="mb-7 flex items-center justify-between border-b border-stone-200">
          <div className="flex gap-7">
            <button className="border-b-2 border-stone-900 pb-4 text-[10px] font-black uppercase tracking-[0.12em] text-stone-900">
              Campaigns
            </button>

            <button
              onClick={() => {
                if (
                  lists[0]
                ) {
                  void openAudience(
                    lists[0]
                  );
                }
              }}
              className="pb-4 text-[10px] font-black uppercase tracking-[0.12em] text-stone-400"
            >
              Audiences
            </button>
          </div>

          <button
            onClick={() =>
              void refreshStats()
            }
            disabled={
              refreshingStats
            }
            className="mb-3 flex items-center gap-2 text-[8px] font-black uppercase tracking-wider text-stone-400"
          >
            <RefreshCw
              size={12}
              className={
                refreshingStats
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* SUMMARY CARDS */}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">
              Campaigns
            </p>

            <p className="mt-2 text-3xl font-black">
              {
                campaigns.length
              }
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">
              Sent
            </p>

            <p className="mt-2 text-3xl font-black">
              {
                campaigns.filter(
                  (
                    campaign
                  ) =>
                    getStatusLabel(
                      campaign
                    ) ===
                    "sent"
                ).length
              }
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">
              Audiences
            </p>

            <p className="mt-2 text-3xl font-black">
              {
                lists.length
              }
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">
              Subscribers
            </p>

            <p className="mt-2 text-3xl font-black">
              {Object.values(
                subscriberCounts
              ).reduce(
                (
                  total,
                  count
                ) =>
                  total +
                  count,
                0
              )}
            </p>
          </div>
        </div>

        {/* CAMPAIGNS TABLE */}

        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
          {campaigns.length ===
          0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
                <Mail
                  size={
                    22
                  }
                  className="text-stone-400"
                />
              </div>

              <h2 className="mt-5 text-xl font-black">
                No
                campaigns
                yet
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-400">
                Create your
                first email,
                choose your
                audience and
                send it from
                TOTS-OS.
              </p>

              <button
                onClick={
                  openNewCampaign
                }
                className="mt-6 rounded-xl bg-stone-900 px-6 py-4 text-[9px] font-black uppercase tracking-[0.14em] text-[#a9b897]"
              >
                Create
                campaign
              </button>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto] gap-4 border-b border-stone-100 bg-stone-50 px-6 py-4 text-[8px] font-black uppercase tracking-[0.14em] text-stone-400 md:grid">
                <span>
                  Campaign
                </span>
                <span>
                  Audience
                </span>
                <span>
                  Status
                </span>
                <span>
                  Results
                </span>
                <span />
              </div>

              {campaigns.map(
                (
                  campaign
                ) => {
                  const status =
                    getStatusLabel(
                      campaign
                    );

                  return (
                    <button
                      key={
                        campaign.id
                      }
                      type="button"
                      onClick={() => {
                        setSelectedCampaign(
                          campaign
                        );

                        setScreen(
                          "analytics"
                        );
                      }}
                      className="grid w-full gap-4 border-b border-stone-100 px-6 py-5 text-left transition last:border-0 hover:bg-stone-50 md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto] md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-black">
                            {
                              campaign.title
                            }
                          </p>

                          {campaign.editor_mode ===
                            "html" && (
                            <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-[7px] font-black uppercase text-violet-600">
                              <Code2
                                size={
                                  8
                                }
                              />
                              HTML
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-xs text-stone-400">
                          {campaign.subject ||
                            "No subject"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-stone-600">
                          {campaign
                            .subscriber_lists
                            ?.name ||
                            "No audience"}
                        </p>
                      </div>

                      <div>
                        <StatusBadge
                          status={
                            status
                          }
                        />
                      </div>

                      <div>
                        {status ===
                        "sent" ? (
                          <div className="flex gap-4 text-xs">
                            <span>
                              <strong>
                                {getOpenRate(
                                  campaign
                                )}
                                %
                              </strong>
                              <span className="ml-1 text-stone-400">
                                open
                              </span>
                            </span>

                            <span>
                              <strong>
                                {getClickRate(
                                  campaign
                                )}
                                %
                              </strong>
                              <span className="ml-1 text-stone-400">
                                click
                              </span>
                            </span>
                          </div>
                        ) : campaign.scheduled_for ? (
                          <p className="text-[10px] text-stone-400">
                            {formatDate(
                              campaign.scheduled_for
                            )}
                          </p>
                        ) : (
                          <span className="text-[10px] text-stone-300">
                            —
                          </span>
                        )}
                      </div>

                      <ChevronRight
                        size={
                          15
                        }
                        className="text-stone-300"
                      />
                    </button>
                  );
                }
              )}
            </>
          )}
        </section>

        {/* AUDIENCE SECTION */}

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
                Audiences
              </p>

              <p className="mt-1 text-xs text-stone-400">
                Your
                subscriber
                lists
              </p>
            </div>

            <button
              onClick={() =>
                setShowCreateList(
                  true
                )
              }
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[8px] font-black uppercase"
            >
              <Plus
                size={12}
              />
              New list
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map(
              (
                list
              ) => (
                <button
                  key={
                    list.id
                  }
                  onClick={() =>
                    void openAudience(
                      list
                    )
                  }
                  className="flex items-center justify-between rounded-[1.5rem] border border-stone-200 bg-white p-5 text-left transition hover:border-stone-400"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a9b897]/15 text-[#71805f]">
                      <Hash
                        size={
                          15
                        }
                      />
                    </div>

                    <div>
                      <p className="text-sm font-black">
                        {
                          list.name
                        }
                      </p>

                      <p className="mt-1 text-[10px] text-stone-400">
                        {subscriberCounts[
                          list.id
                        ] ||
                          0}{" "}
                        subscribers
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    size={
                      14
                    }
                    className="text-stone-300"
                  />
                </button>
              )
            )}
          </div>
        </section>
      </div>

      {/* CREATE LIST MODAL */}

      <AnimatePresence>
        {showCreateList && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{
                opacity:
                  0,
                scale:
                  0.96,
              }}
              animate={{
                opacity:
                  1,
                scale:
                  1,
              }}
              exit={{
                opacity:
                  0,
                scale:
                  0.96,
              }}
              className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[#82916f]">
                    Audience
                  </p>

                  <h2 className="mt-2 text-xl font-black">
                    Create a
                    subscriber
                    list
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setShowCreateList(
                      false
                    )
                  }
                >
                  <X
                    size={
                      18
                    }
                  />
                </button>
              </div>

              <input
                value={
                  newListName
                }
                onChange={(
                  event
                ) =>
                  setNewListName(
                    event
                      .target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    void createList();
                  }
                }}
                placeholder="Newsletter"
                className="mt-6 w-full rounded-xl border border-stone-200 px-4 py-4 text-sm outline-none"
              />

              <button
                onClick={() =>
                  void createList()
                }
                className="mt-4 w-full rounded-xl bg-stone-900 py-4 text-[9px] font-black uppercase tracking-[0.14em] text-[#a9b897]"
              >
                Create
                audience
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}