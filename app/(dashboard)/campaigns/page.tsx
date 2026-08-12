"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createBrowserClient } from "@supabase/ssr";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Columns2,
  Hash,
  Heading2,
  Image as ImageIcon,
  Italic,
  LayoutTemplate,
  Link2,
  Loader2,
  Mail,
  Minus,
  MousePointerClick,
  Palette,
  Plus,
  Quote,
  Radio,
  Share2,
  Sparkles,
  Type,
  Users,
  X,
  Zap,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

// ==================================================
// TYPES
// ==================================================

type SocialLinks = {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
};

type Campaign = {
  id: string;
  title: string;
  subject: string | null;
  preview_text?: string | null;
  content: string | null;
  list_id: string | null;
  scheduled_for: string | null;
  status?: string;
  sent_at?: string | null;
  sent_count?: number | null;
  open_count?: number | null;
  click_count?: number | null;
  sender_name?: string | null;
  reply_to?: string | null;
  header_image_url?: string | null;
  brand_color?: string | null;
  brand_font?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  social_links?: SocialLinks | null;

  subscriber_lists?: {
    name: string | null;
  } | null;
};

type CompanyBranding = {
  name: string;
  logoUrl: string;
  email: string;
  details: string;
};

type CampaignTemplate = {
  id: string;
  name: string;
  description: string;
  brandColor: string;
  font: string;
  buildContent: (
    company: CompanyBranding
  ) => string;
};

type ListSubscriber = {
  id: string;
  source: "profile" | "manual";
  profile_id: string | null;
  manual_email_id: string | null;
  name: string | null;
  email: string;
};

// ==================================================
// CONSTANTS
// ==================================================

const FONT_OPTIONS = [
  {
    label: "Editorial Serif",
    value:
      "Georgia, 'Times New Roman', serif",
  },
  {
    label: "Classic Serif",
    value:
      "'Times New Roman', Times, serif",
  },
  {
    label: "Clean Helvetica",
    value:
      "Helvetica, Arial, sans-serif",
  },
  {
    label: "Modern Verdana",
    value:
      "Verdana, Geneva, sans-serif",
  },
  {
    label: "Trebuchet",
    value:
      "'Trebuchet MS', sans-serif",
  },
  {
    label: "Monospace",
    value:
      "'Courier New', Courier, monospace",
  },
];

const DEFAULT_BRAND_COLOR =
  "#1c1917";

const COLOR_SWATCHES = [
  "#1c1917",
  "#a9b897",
  "#4f4a46",
  "#b91c1c",
  "#0f766e",
  "#7c3aed",
  "#c2410c",
  "#0369a1",
];

const COMPANY_FOOTER_START =
  "<!-- TOTS_COMPANY_FOOTER_START -->";

const COMPANY_FOOTER_END =
  "<!-- TOTS_COMPANY_FOOTER_END -->";

// ==================================================
// FORM
// ==================================================

const emptyForm = () => ({
  title: "",
  subject: "",
  preview_text: "",
  list_id: "",
  scheduled_for: "",
  content: "",
  sender_name: "",
  reply_to: "",
  header_image_url: "",
  brand_color:
    DEFAULT_BRAND_COLOR,
  brand_font:
    FONT_OPTIONS[0].value,
  cta_text: "",
  cta_url: "",

  social_links: {
    twitter: "",
    facebook: "",
    instagram: "",
    linkedin: "",
  } as SocialLinks,
});

// ==================================================
// TEMPLATES
// ==================================================

const CAMPAIGN_TEMPLATES: CampaignTemplate[] =
  [
    {
      id: "minimal",
      name: "Minimal",
      description:
        "Clean, premium and text-led.",

      brandColor:
        "#1c1917",

      font:
        "Helvetica, Arial, sans-serif",

      buildContent: (
        company
      ) => `
        <p style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#78716c;margin:0 0 28px;">
          ${company.name}
        </p>

        <h2 style="font-size:34px;line-height:1.08;margin:0 0 24px;color:#1c1917;">
          Your headline goes here.
        </h2>

        <p style="font-size:17px;line-height:1.8;margin:0 0 20px;">
          Introduce your update in a simple, direct way. Keep the opening focused on the reason your reader should care.
        </p>

        <p style="font-size:17px;line-height:1.8;margin:0;">
          Add another paragraph here with the important detail, story or next step.
        </p>
      `,
    },

    {
      id: "editorial",
      name: "Editorial",
      description:
        "Luxury magazine-style newsletter.",

      brandColor:
        "#4f4a46",

      font:
        "Georgia, 'Times New Roman', serif",

      buildContent: (
        company
      ) => `
        <p style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#a8a29e;text-align:center;margin:0 0 28px;">
          A note from ${company.name}
        </p>

        <h2 style="font-size:42px;line-height:1.05;font-weight:400;font-style:italic;text-align:center;margin:0 0 32px;color:#292524;">
          Something worth sharing.
        </h2>

        <p style="font-size:18px;line-height:1.9;margin:0 0 24px;">
          Start with the story. Explain what has changed, what you have learned or what you want your audience to know.
        </p>

        <blockquote style="margin:38px 0;padding:8px 0 8px 24px;border-left:2px solid #a9b897;font-size:24px;line-height:1.5;font-style:italic;color:#57534e;">
          Add the one line you want people to remember.
        </blockquote>

        <p style="font-size:18px;line-height:1.9;margin:0;">
          Finish with context and a natural next step.
        </p>
      `,
    },

    {
      id: "launch",
      name: "Launch",
      description:
        "Bold structure for launches and offers.",

      brandColor:
        "#1c1917",

      font:
        "Helvetica, Arial, sans-serif",

      buildContent: (
        company
      ) => `
        <p style="font-size:12px;letter-spacing:0.25em;text-transform:uppercase;color:#a9b897;font-weight:700;margin:0 0 18px;">
          New from ${company.name}
        </p>

        <h2 style="font-size:44px;line-height:1.05;margin:0 0 28px;color:#1c1917;">
          It’s finally here.
        </h2>

        <p style="font-size:18px;line-height:1.75;margin:0 0 30px;">
          Introduce your launch, service, product or announcement here. Make the value clear before getting into the details.
        </p>

        <div style="padding:28px;border-radius:18px;background:#f5f5f4;margin:0 0 30px;">
          <p style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 12px;color:#78716c;">
            Why it matters
          </p>

          <p style="font-size:16px;line-height:1.75;margin:0;">
            Add the strongest benefit, result or reason someone should pay attention.
          </p>
        </div>

        <p style="font-size:18px;line-height:1.75;margin:0;">
          Add any final details before directing readers to your call to action.
        </p>
      `,
    },

    {
      id: "newsletter",
      name: "Newsletter",
      description:
        "Structured company update.",

      brandColor:
        "#a9b897",

      font:
        "Helvetica, Arial, sans-serif",

      buildContent: (
        company
      ) => `
        <h2 style="font-size:34px;line-height:1.1;margin:0 0 14px;color:#292524;">
          The ${company.name} update.
        </h2>

        <p style="font-size:15px;line-height:1.7;color:#78716c;margin:0 0 32px;">
          A quick round-up of what has been happening.
        </p>

        <hr style="border:none;border-top:1px solid #e7e5e4;margin:0 0 32px;" />

        <h3 style="font-size:20px;margin:0 0 12px;color:#292524;">
          01 — What’s new
        </h3>

        <p style="font-size:16px;line-height:1.75;margin:0 0 30px;">
          Share your first update here.
        </p>

        <h3 style="font-size:20px;margin:0 0 12px;color:#292524;">
          02 — Behind the scenes
        </h3>

        <p style="font-size:16px;line-height:1.75;margin:0 0 30px;">
          Add something personal, useful or interesting from behind the business.
        </p>

        <h3 style="font-size:20px;margin:0 0 12px;color:#292524;">
          03 — What’s next
        </h3>

        <p style="font-size:16px;line-height:1.75;margin:0;">
          Tell readers what they can expect next.
        </p>
      `,
    },
  ];

// ==================================================
// EMAIL HELPERS
// ==================================================

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}

function parseManualEmails(
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

// ==================================================
// HTML HELPERS
// ==================================================

function stripAutomaticCompanyFooter(
  html: string
) {
  if (!html) {
    return "";
  }

  const start =
    html.indexOf(
      COMPANY_FOOTER_START
    );

  const end =
    html.indexOf(
      COMPANY_FOOTER_END
    );

  if (
    start === -1 ||
    end === -1
  ) {
    return html;
  }

  return (
    html.slice(0, start) +
    html.slice(
      end +
        COMPANY_FOOTER_END.length
    )
  ).trim();
}

function buildCompanyFooterHtml(
  company: CompanyBranding,
  extraDetails: string,
  socialLinks?: SocialLinks
) {
  const details =
    extraDetails.trim() ||
    company.details.trim();

  const socialItems = [
    socialLinks?.instagram
      ? `<a href="${socialLinks.instagram}" style="color:#78716c;text-decoration:none;margin:0 8px;">Instagram</a>`
      : "",
    socialLinks?.facebook
      ? `<a href="${socialLinks.facebook}" style="color:#78716c;text-decoration:none;margin:0 8px;">Facebook</a>`
      : "",
    socialLinks?.linkedin
      ? `<a href="${socialLinks.linkedin}" style="color:#78716c;text-decoration:none;margin:0 8px;">LinkedIn</a>`
      : "",
    socialLinks?.twitter
      ? `<a href="${socialLinks.twitter}" style="color:#78716c;text-decoration:none;margin:0 8px;">X</a>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  return `
    ${COMPANY_FOOTER_START}

    <div style="margin-top:56px;padding-top:36px;border-top:1px solid #e7e5e4;text-align:center;font-family:Helvetica,Arial,sans-serif;">

      ${
        company.logoUrl
          ? `
            <div style="margin-bottom:18px;">
              <img
                src="${company.logoUrl}"
                alt="${company.name}"
                style="display:inline-block;max-width:120px;max-height:70px;width:auto;height:auto;object-fit:contain;"
              />
            </div>
          `
          : ""
      }

      <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#292524;">
        ${company.name}
      </p>

      ${
        details
          ? `
            <p style="max-width:520px;margin:0 auto 12px;font-size:11px;line-height:1.7;color:#78716c;white-space:pre-line;">
              ${details}
            </p>
          `
          : ""
      }

      ${
        company.email
          ? `
            <p style="margin:0 0 12px;font-size:11px;color:#a8a29e;">
              ${company.email}
            </p>
          `
          : ""
      }

      ${
        socialItems
          ? `
            <div style="margin:16px 0;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;">
              ${socialItems}
            </div>
          `
          : ""
      }

      <p style="margin:18px 0 0;font-size:9px;color:#d6d3d1;letter-spacing:0.18em;text-transform:uppercase;">
        Powered by TOTS-OS
      </p>
    </div>

    ${COMPANY_FOOTER_END}
  `;
}

// ==================================================
// CAMPAIGN SERVICE
// ==================================================

function createCampaignService(
  supabase: any,
  organisationId: string | null
) {
  return {
    async listCampaigns() {
      if (!organisationId) {
        return [];
      }

      const {
        data,
        error,
      } = await supabase
        .from("campaigns")
        .select(
          "*, subscriber_lists(name)"
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .order(
          "scheduled_for",
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          "listCampaigns error:",
          error
        );

        return [];
      }

      return data || [];
    },

    async createCampaign(
      payload: any
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("campaigns")
        .insert(payload)
        .select();

      if (error) {
        console.error(
          "createCampaign error:",
          error
        );

        throw error;
      }

      return data?.[0] || null;
    },

    async updateCampaign(
      id: string,
      payload: any
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("campaigns")
        .update(payload)
        .eq("id", id)
        .select();

      if (error) {
        console.error(
          "updateCampaign error:",
          error
        );

        throw error;
      }

      return data?.[0] || null;
    },

    async deleteCampaign(
      id: string
    ) {
      const {
        error,
      } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          "deleteCampaign error:",
          error
        );

        throw error;
      }
    },

    async deleteList(
      id: string
    ) {
      const {
        error:
          campaignError,
      } = await supabase
        .from("campaigns")
        .update({
          list_id: null,
        })
        .eq("list_id", id);

      if (
        campaignError
      ) {
        console.error(
          "deleteList campaign detach error:",
          campaignError
        );

        throw campaignError;
      }

      const {
        error:
          profileLinkError,
      } = await supabase
        .from(
          "profile_subscriber_lists"
        )
        .delete()
        .eq("list_id", id);

      if (
        profileLinkError
      ) {
        console.error(
          "deleteList profile subscriber link error:",
          profileLinkError
        );

        throw profileLinkError;
      }

      const {
        error:
          manualEmailError,
      } = await supabase
        .from(
          "campaign_list_emails"
        )
        .delete()
        .eq("list_id", id);

      if (
        manualEmailError
      ) {
        console.error(
          "deleteList manual emails error:",
          manualEmailError
        );

        throw manualEmailError;
      }

      const {
        error,
      } = await supabase
        .from(
          "subscriber_lists"
        )
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          "deleteList error:",
          error
        );

        throw error;
      }
    },

    async removeSubscriber(
      listId: string,
      profileId: string
    ) {
      const {
        error,
      } = await supabase
        .from(
          "profile_subscriber_lists"
        )
        .delete()
        .eq(
          "list_id",
          listId
        )
        .eq(
          "profile_id",
          profileId
        );

      if (error) {
        console.error(
          "removeSubscriber error:",
          error
        );

        throw error;
      }
    },

    async removeManualSubscriber(
      id: string
    ) {
      if (
        !organisationId
      ) {
        return;
      }

      const {
        error,
      } = await supabase
        .from(
          "campaign_list_emails"
        )
        .delete()
        .eq(
          "id",
          id
        )
        .eq(
          "organisation_id",
          organisationId
        );

      if (error) {
        console.error(
          "removeManualSubscriber error:",
          {
            message:
              error.message,
            details:
              error.details,
            hint:
              error.hint,
            code:
              error.code,
          }
        );

        throw error;
      }
    },

    async listSubscriberLists() {
      if (!organisationId) {
        return [];
      }

      const {
        data,
        error,
      } = await supabase
        .from(
          "subscriber_lists"
        )
        .select("*")
        .eq(
          "organisation_id",
          organisationId
        );

      if (error) {
        console.error(
          "listSubscriberLists error:",
          error
        );

        return [];
      }

      return data || [];
    },

    async listProfiles() {
      if (!organisationId) {
        return [];
      }

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
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
          "listProfiles error:",
          error
        );

        return [];
      }

      return data || [];
    },

    async addSubscribers(
      listId: string,
      profileIds: string[]
    ) {
      if (
        !organisationId ||
        !profileIds.length
      ) {
        return;
      }

      const rows =
        profileIds.map(
          (profile_id) => ({
            profile_id,
            list_id:
              listId,
            organisation_id:
              organisationId,
          })
        );

      const {
        error,
      } = await supabase
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
        console.error(
          "addSubscribers error:",
          error
        );

        throw error;
      }
    },

    // ==================================================
    // FIXED MANUAL EMAIL INSERT
    // ==================================================

    async addManualSubscribers(
      listId: string,
      emails: string[]
    ) {
      if (
        !organisationId ||
        !emails.length
      ) {
        return;
      }

      const cleanedEmails =
        Array.from(
          new Set(
            emails
              .map(
                (
                  email
                ) =>
                  email
                    .trim()
                    .toLowerCase()
              )
              .filter(
                Boolean
              )
          )
        );

      if (
        !cleanedEmails.length
      ) {
        return;
      }

      const {
        data:
          existingRows,
        error:
          existingError,
      } = await supabase
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
        )
        .in(
          "email",
          cleanedEmails
        );

      if (
        existingError
      ) {
        console.error(
          "Check existing manual subscribers error:",
          {
            message:
              existingError.message,
            details:
              existingError.details,
            hint:
              existingError.hint,
            code:
              existingError.code,
          }
        );

        throw existingError;
      }

      const existingEmails =
        new Set(
          (
            existingRows ||
            []
          )
            .map(
              (
                row: {
                  email:
                    string;
                }
              ) =>
                row.email
                  ?.trim()
                  .toLowerCase()
            )
            .filter(
              Boolean
            )
        );

      const newEmails =
        cleanedEmails.filter(
          (email) =>
            !existingEmails.has(
              email
            )
        );

      if (
        !newEmails.length
      ) {
        return;
      }

      const rows =
        newEmails.map(
          (email) => ({
            list_id:
              listId,

            organisation_id:
              organisationId,

            email,
          })
        );

      const {
        error:
          insertError,
      } = await supabase
        .from(
          "campaign_list_emails"
        )
        .insert(
          rows
        );

      if (
        insertError
      ) {
        console.error(
          "addManualSubscribers insert error:",
          {
            message:
              insertError.message,
            details:
              insertError.details,
            hint:
              insertError.hint,
            code:
              insertError.code,
          }
        );

        console.error(
          "Attempted manual email rows:",
          rows
        );

        throw insertError;
      }
    },

    async subscriberCounts() {
      if (!organisationId) {
        return {};
      }

      const [
        profileResult,
        manualResult,
      ] =
        await Promise.all([
          supabase
            .from(
              "profile_subscriber_lists"
            )
            .select(
              "list_id"
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
              "list_id"
            )
            .eq(
              "organisation_id",
              organisationId
            ),
        ]);

      if (
        profileResult.error
      ) {
        console.error(
          "subscriberCounts profile error:",
          profileResult.error
        );
      }

      if (
        manualResult.error
      ) {
        console.error(
          "subscriberCounts manual error:",
          manualResult.error
        );
      }

      const counts: Record<
        string,
        number
      > = {};

      (
        profileResult.data ||
        []
      ).forEach(
        (row: any) => {
          counts[
            row.list_id
          ] =
            (counts[
              row.list_id
            ] || 0) + 1;
        }
      );

      (
        manualResult.data ||
        []
      ).forEach(
        (row: any) => {
          counts[
            row.list_id
          ] =
            (counts[
              row.list_id
            ] || 0) + 1;
        }
      );

      return counts;
    },
  };
}

// ==================================================
// CAMPAIGNS HOOK
// ==================================================

function useCampaigns(
  supabase: any
) {
  const [
    campaigns,
    setCampaigns,
  ] = useState<
    Campaign[]
  >([]);

  const [
    lists,
    setLists,
  ] = useState<any[]>(
    []
  );

  const [
    organisationId,
    setOrganisationId,
  ] = useState<
    string | null
  >(null);

  const [
    companyBranding,
    setCompanyBranding,
  ] = useState<CompanyBranding>({
    name: "Your Company",
    logoUrl: "",
    email: "",
    details: "",
  });

  const [
    subscriberCounts,
    setSubscriberCounts,
  ] = useState<
    Record<string, number>
  >({});

  const [
    profiles,
    setProfiles,
  ] = useState<any[]>(
    []
  );

  const cacheRef =
    useRef<{
      data:
        | Campaign[]
        | null;
      ts: number;
    }>({
      data: null,
      ts: 0,
    });

  const abortRef =
    useRef<
      AbortController | null
    >(null);

  const optimisticStatusRef =
    useRef<
      Record<
        string,
        string
      >
    >({});

  const service =
    useMemo(
      () =>
        createCampaignService(
          supabase,
          organisationId
        ),
      [
        supabase,
        organisationId,
      ]
    );

  // ==================================================
  // COMPANY BRANDING
  // ==================================================

  const loadCompanyBranding =
    async (
      userId: string
    ) => {
      const {
        data: profile,
        error:
          profileError,
      } = await supabase
        .from(
          "profiles"
        )
        .select("*")
        .eq(
          "id",
          userId
        )
        .maybeSingle();

      if (
        profileError
      ) {
        console.warn(
          "Profile branding lookup error:",
          profileError
        );
      }

      const orgId =
        profile
          ?.organisation_id ??
        null;

      if (orgId) {
        setOrganisationId(
          orgId
        );
      }

      let team:
        | any
        | null = null;

      if (orgId) {
        const {
          data:
            teamRecord,
          error:
            teamError,
        } = await supabase
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
            "Team branding lookup error:",
            teamError
          );
        }

        team =
          teamRecord;
      }

      const companyName =
        team
          ?.company_name ||
        team
          ?.name ||
        profile
          ?.company_name ||
        profile
          ?.business_name ||
        profile
          ?.full_name ||
        profile
          ?.name ||
        "Your Company";

      const logoUrl =
        profile
          ?.logo_url ||
        profile
          ?.company_logo_url ||
        team
          ?.logo_url ||
        "";

      const email =
        profile
          ?.email ||
        "";

      const details =
        profile
          ?.bio ||
        team
          ?.description ||
        "";

      setCompanyBranding({
        name:
          companyName,
        logoUrl,
        email,
        details,
      });
    };

  const updateCompanyName =
    async (
      newName: string
    ) => {
      const trimmed =
        newName.trim();

      if (
        !trimmed ||
        !organisationId
      ) {
        return;
      }

      setCompanyBranding(
        (previous) => ({
          ...previous,
          name:
            trimmed,
        })
      );

      const {
        error,
      } = await supabase
        .from(
          "team"
        )
        .update({
          company_name:
            trimmed,
        })
        .eq(
          "organisation_id",
          organisationId
        );

      if (error) {
        console.error(
          "Company name update failed:",
          error
        );
      }
    };

  // ==================================================
  // CLICK COUNTS
  // ==================================================

  const loadClickCounts =
    async (
      campaignIds: string[]
    ) => {
      if (
        !campaignIds.length
      ) {
        return {} as Record<
          string,
          number
        >;
      }

      const {
        data,
        error,
      } = await supabase
        .from(
          "campaign_clicks"
        )
        .select(
          "campaign_id"
        )
        .in(
          "campaign_id",
          campaignIds
        );

      if (
        error ||
        !data
      ) {
        console.error(
          "loadClickCounts error:",
          error
        );

        return {};
      }

      const counts: Record<
        string,
        number
      > = {};

      data.forEach(
        (row: any) => {
          counts[
            row.campaign_id
          ] =
            (counts[
              row.campaign_id
            ] || 0) + 1;
        }
      );

      return counts;
    };

  // ==================================================
  // REFRESH
  // ==================================================

  const refreshCampaigns =
    async () => {
      const now =
        Date.now();

      if (
        cacheRef.current
          .data &&
        now -
          cacheRef.current
            .ts <
          30000
      ) {
        setCampaigns(
          cacheRef.current
            .data
        );

        return;
      }

      if (
        abortRef.current
      ) {
        abortRef.current.abort();
      }

      const controller =
        new AbortController();

      abortRef.current =
        controller;

      const data =
        await service.listCampaigns();

      if (
        controller.signal
          .aborted
      ) {
        return;
      }

      const incoming =
        data || [];

      const clickCounts =
        await loadClickCounts(
          incoming.map(
            (
              campaign: any
            ) =>
              campaign.id
          )
        );

      const processed =
        incoming.map(
          (
            campaign: any
          ) => ({
            ...campaign,

            status:
              optimisticStatusRef
                .current[
                campaign.id
              ] ||
              campaign.status,

            click_count:
              clickCounts[
                campaign.id
              ] || 0,
          })
        );

      cacheRef.current = {
        data:
          processed,
        ts:
          now,
      };

      setCampaigns(
        processed
      );
    };

  // ==================================================
  // INITIAL USER
  // ==================================================

  useEffect(() => {
    const init =
      async () => {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {
          return;
        }

        await loadCompanyBranding(
          user.id
        );
      };

    void init();
  }, [supabase]);

  // ==================================================
  // LOAD ORG
  // ==================================================

  useEffect(() => {
    if (
      !organisationId
    ) {
      return;
    }

    const load =
      async () => {
        const [
          camps,
          listsData,
          profilesData,
          counts,
        ] =
          await Promise.all([
            service.listCampaigns(),
            service.listSubscriberLists(),
            service.listProfiles(),
            service.subscriberCounts(),
          ]);

        const clickCounts =
          await loadClickCounts(
            (
              camps || []
            ).map(
              (
                campaign: any
              ) =>
                campaign.id
            )
          );

        const processed =
          (
            camps || []
          ).map(
            (
              campaign: any
            ) => ({
              ...campaign,

              click_count:
                clickCounts[
                  campaign.id
                ] || 0,
            })
          );

        setCampaigns(
          processed
        );

        cacheRef.current = {
          data:
            processed,
          ts:
            Date.now(),
        };

        setLists(
          listsData
        );

        setProfiles(
          profilesData
        );

        setSubscriberCounts(
          counts
        );
      };

    void load();
  }, [
    organisationId,
    service,
  ]);

  // ==================================================
  // CREATE LIST
  // ==================================================

  const createList =
    async (
      name: string
    ) => {
      const trimmed =
        name.trim();

      if (
        !organisationId
      ) {
        alert(
          "Organisation not loaded yet."
        );

        return false;
      }

      if (!trimmed) {
        alert(
          "List name cannot be empty."
        );

        return false;
      }

      const {
        data,
        error,
      } = await supabase
        .from(
          "subscriber_lists"
        )
        .insert({
          name:
            trimmed,

          organisation_id:
            organisationId,
        })
        .select()
        .single();

      if (error) {
        console.error(
          "createList error:",
          error
        );

        alert(
          error.message ||
            "Failed to create list."
        );

        return false;
      }

      setLists(
        (
          previous
        ) => [
          ...previous,
          data,
        ]
      );

      return true;
    };

  // ==================================================
  // SCHEDULE CAMPAIGN
  // ==================================================

  const scheduleCampaign =
    async (
      form: any
    ) => {
      if (
        !organisationId
      ) {
        return;
      }

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      const payload = {
        ...form,

        list_id:
          form.list_id ||
          null,

        user_id:
          user?.id,

        organisation_id:
          organisationId,
      };

      const created =
        await service.createCampaign(
          payload
        );

      if (created) {
        setCampaigns(
          (
            previous
          ) => [
            created,
            ...previous,
          ]
        );

        optimisticStatusRef.current[
          created.id
        ] =
          created.status ||
          "queued";
      }

      cacheRef.current.ts =
        0;

      await refreshCampaigns();
    };

  // ==================================================
  // LOAD LIST SUBSCRIBERS
  // ==================================================

  const loadListSubscribers =
    async (
      listId: string
    ): Promise<
      ListSubscriber[]
    > => {
      if (
        !listId ||
        !organisationId
      ) {
        return [];
      }

      const [
        profileResult,
        manualResult,
      ] =
        await Promise.all([
          supabase
            .from(
              "profile_subscriber_lists"
            )
            .select(
              "profile_id, profiles:profiles(id,name,full_name,email)"
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
              "list_id",
              listId
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
            ),
        ]);

      if (
        profileResult.error
      ) {
        console.error(
          "Load profile subscribers error:",
          profileResult.error
        );
      }

      if (
        manualResult.error
      ) {
        console.error(
          "Load manual subscribers error:",
          manualResult.error
        );
      }

      const profileSubscribers: ListSubscriber[] =
        (
          profileResult.data ||
          []
        )
          .filter(
            (
              row: any
            ) =>
              row.profiles
                ?.email
          )
          .map(
            (
              row: any
            ) => ({
              id:
                row.profile_id,

              source:
                "profile",

              profile_id:
                row.profile_id,

              manual_email_id:
                null,

              name:
                row.profiles
                  ?.full_name ||
                row.profiles
                  ?.name ||
                null,

              email:
                row.profiles
                  ?.email ||
                "",
            })
          );

      const manualSubscribers: ListSubscriber[] =
        (
          manualResult.data ||
          []
        ).map(
          (
            row: any
          ) => ({
            id:
              row.id,

            source:
              "manual",

            profile_id:
              null,

            manual_email_id:
              row.id,

            name:
              null,

            email:
              row.email,
          })
        );

      const combined = [
        ...profileSubscribers,
        ...manualSubscribers,
      ];

      const seen =
        new Set<string>();

      return combined.filter(
        (
          subscriber
        ) => {
          const email =
            subscriber.email
              .trim()
              .toLowerCase();

          if (
            !email ||
            seen.has(email)
          ) {
            return false;
          }

          seen.add(email);

          return true;
        }
      );
    };

  // ==================================================
  // UPDATE
  // ==================================================

  const updateCampaign =
    async (
      form: any,
      id: string
    ) => {
      const updated =
        await service.updateCampaign(
          id,
          {
            ...form,

            list_id:
              form.list_id ||
              null,
          }
        );

      if (updated) {
        setCampaigns(
          (
            previous
          ) =>
            previous.map(
              (
                campaign
              ) =>
                campaign.id ===
                id
                  ? {
                      ...campaign,
                      ...updated,
                    }
                  : campaign
            )
        );
      }

      cacheRef.current.ts =
        0;

      await refreshCampaigns();
    };

  // ==================================================
  // DELETE CAMPAIGN
  // ==================================================

  const deleteCampaign =
    async (
      id: string
    ) => {
      await service.deleteCampaign(
        id
      );

      delete optimisticStatusRef
        .current[id];

      setCampaigns(
        (
          previous
        ) =>
          previous.filter(
            (
              campaign
            ) =>
              campaign.id !==
              id
          )
      );

      cacheRef.current.ts =
        0;
    };

  // ==================================================
  // DELETE LIST
  // ==================================================

  const deleteList =
    async (
      id: string
    ) => {
      await service.deleteList(
        id
      );

      setLists(
        (
          previous
        ) =>
          previous.filter(
            (
              list
            ) =>
              list.id !== id
          )
      );

      setSubscriberCounts(
        (
          previous
        ) => {
          const next = {
            ...previous,
          };

          delete next[id];

          return next;
        }
      );
    };

  // ==================================================
  // REMOVE SUBSCRIBERS
  // ==================================================

  const removeSubscriber =
    async (
      listId: string,
      profileId: string
    ) => {
      await service.removeSubscriber(
        listId,
        profileId
      );

      setSubscriberCounts(
        await service.subscriberCounts()
      );
    };

  const removeManualSubscriber =
    async (
      id: string
    ) => {
      await service.removeManualSubscriber(
        id
      );

      setSubscriberCounts(
        await service.subscriberCounts()
      );
    };

  // ==================================================
  // ADD SUBSCRIBERS
  // ==================================================

  const addSubscribersToList =
    async (
      listId: string,
      profileIds: string[]
    ) => {
      if (
        !profileIds.length
      ) {
        return;
      }

      await service.addSubscribers(
        listId,
        profileIds
      );

      setSubscriberCounts(
        await service.subscriberCounts()
      );
    };

  const addManualSubscribersToList =
    async (
      listId: string,
      emails: string[]
    ) => {
      if (
        !emails.length
      ) {
        return;
      }

      await service.addManualSubscribers(
        listId,
        emails
      );

      setSubscriberCounts(
        await service.subscriberCounts()
      );
    };

  // ==================================================
  // SEND
  // ==================================================

  const sendCampaignNow =
    async (
      campaignId: string
    ) => {
      optimisticStatusRef.current[
        campaignId
      ] = "sending";

      try {
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

              body:
                JSON.stringify({
                  campaignId,
                }),
            }
          );

        if (
          !response.ok
        ) {
          const error =
            await response
              .json()
              .catch(
                () => ({})
              );

          alert(
            error.error ||
              "Failed to send campaign."
          );

          optimisticStatusRef.current[
            campaignId
          ] =
            "failed";

          return response;
        }

        optimisticStatusRef.current[
          campaignId
        ] =
          "sent";

        cacheRef.current.ts =
          0;

        await refreshCampaigns();

        return response;
      } catch (error) {
        optimisticStatusRef.current[
          campaignId
        ] =
          "failed";

        throw error;
      }
    };

  // ==================================================
  // REALTIME
  // ==================================================

  useEffect(() => {
    if (
      !organisationId
    ) {
      return;
    }

    const channel =
      supabase
        .channel(
          `campaigns-${organisationId}`
        )

        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "profile_subscriber_lists",
          },
          () => {
            void service
              .subscriberCounts()
              .then(
                setSubscriberCounts
              );
          }
        )

        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "campaign_list_emails",
          },
          () => {
            void service
              .subscriberCounts()
              .then(
                setSubscriberCounts
              );
          }
        )

        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "campaigns",
          },
          () => {
            cacheRef.current.ts =
              0;

            void refreshCampaigns();
          }
        )

        .subscribe();

    return () => {
      void supabase.removeChannel(
        channel
      );
    };
  }, [
    organisationId,
    service,
    supabase,
  ]);

  return {
    campaigns,
    setCampaigns,
    lists,
    companyBranding,
    updateCompanyName,
    createList,
    scheduleCampaign,
    loadListSubscribers,
    updateCampaign,
    deleteCampaign,
    deleteList,
    removeSubscriber,
    removeManualSubscriber,
    subscriberCounts,
    profiles,
    sendCampaignNow,
    addSubscribersToList,
    addManualSubscribersToList,
    refreshCampaigns,
  };
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

  const {
    campaigns,
    setCampaigns,
    lists,
    companyBranding,
    updateCompanyName,
    createList,
    scheduleCampaign,
    loadListSubscribers,
    updateCampaign,
    deleteCampaign,
    deleteList,
    removeSubscriber,
    removeManualSubscriber,
    subscriberCounts,
    profiles,
    sendCampaignNow:
      sendCampaignNowBase,
    addSubscribersToList,
    addManualSubscribersToList,
    refreshCampaigns,
  } = useCampaigns(
    supabase
  );

  // ==================================================
  // UI STATE
  // ==================================================

  const [
    selectedCampaign,
    setSelectedCampaign,
  ] = useState<
    any | null
  >(null);

  const [
    showViewModal,
    setShowViewModal,
  ] = useState(false);

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    showListModal,
    setShowListModal,
  ] = useState(false);

  const [
    showListDetailModal,
    setShowListDetailModal,
  ] = useState(false);

  const [
    selectedList,
    setSelectedList,
  ] = useState<
    any | null
  >(null);

  const [
    listSubscribers,
    setListSubscribers,
  ] = useState<
    ListSubscriber[]
  >([]);

  const [
    selectedProfiles,
    setSelectedProfiles,
  ] = useState<
    string[]
  >([]);

  const [
    manualEmails,
    setManualEmails,
  ] = useState("");

  const [
    showSubscriberManager,
    setShowSubscriberManager,
  ] = useState(false);

  const [
    savingSubscribers,
    setSavingSubscribers,
  ] = useState(false);

  const [
    step,
    setStep,
  ] = useState<
    "editor" | "schedule"
  >("editor");

  const [
    newListName,
    setNewListName,
  ] = useState("");

  const [
    showClarityPrompt,
    setShowClarityPrompt,
  ] = useState(false);

  const [
    clarityTopic,
    setClarityTopic,
  ] = useState("");

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const [
    editingCampaignId,
    setEditingCampaignId,
  ] = useState<
    string | null
  >(null);

  const [
    campaignCompanyDetails,
    setCampaignCompanyDetails,
  ] = useState("");

  const [
    showColorPicker,
    setShowColorPicker,
  ] = useState(false);

  const [
    showEmailPreview,
    setShowEmailPreview,
  ] = useState(false);

  const [
    showTemplates,
    setShowTemplates,
  ] = useState(true);

  const [
    form,
    setForm,
  ] = useState<any>(
    emptyForm()
  );

  const [
    companyNameInput,
    setCompanyNameInput,
  ] = useState(
    companyBranding.name
  );

  const contentEditableRef =
    useRef<HTMLDivElement>(
      null
    );

  useEffect(() => {
    setCompanyNameInput(
      companyBranding.name
    );
  }, [
    companyBranding.name,
  ]);

  useEffect(() => {
    if (
      showModal &&
      contentEditableRef.current
    ) {
      const content =
        form.content ||
        "";

      if (
        contentEditableRef
          .current
          .innerHTML !==
        content
      ) {
        contentEditableRef.current.innerHTML =
          content;
      }
    }
  }, [
    showModal,
    editingCampaignId,
  ]);

  const withAutomaticCompanyDetails =
    (
      contentHtml: string
    ) => {
      const cleanContent =
        stripAutomaticCompanyFooter(
          contentHtml ||
            ""
        );

      return `${cleanContent}${buildCompanyFooterHtml(
        companyBranding,
        campaignCompanyDetails,
        form.social_links
      )}`;
    };

  // ==================================================
  // SEND NOW
  // ==================================================

  const sendCampaignNow =
    async (
      campaignId: string
    ) => {
      setCampaigns(
        (
          previous
        ) =>
          previous.map(
            (
              campaign
            ) =>
              campaign.id ===
              campaignId
                ? {
                    ...campaign,
                    status:
                      "sending",
                  }
                : campaign
          )
      );

      try {
        const response =
          await sendCampaignNowBase(
            campaignId
          );

        if (
          !response ||
          !response.ok
        ) {
          throw new Error(
            "Failed to send campaign"
          );
        }

        await refreshCampaigns();
      } catch (error) {
        console.error(
          error
        );
      }
    };

  // ==================================================
  // EDITOR HELPERS
  // ==================================================

  const applyFormat =
    (
      command: string,
      value?: string
    ) => {
      if (
        !contentEditableRef.current
      ) {
        return;
      }

      contentEditableRef.current.focus();

      document.execCommand(
        command,
        false,
        value
      );

      setForm(
        (
          previous: any
        ) => ({
          ...previous,

          content:
            contentEditableRef
              .current
              ?.innerHTML ||
            "",
        })
      );
    };

  const insertHtml =
    (
      html: string
    ) => {
      if (
        !contentEditableRef.current
      ) {
        return;
      }

      contentEditableRef.current.focus();

      document.execCommand(
        "insertHTML",
        false,
        html
      );

      setForm(
        (
          previous: any
        ) => ({
          ...previous,

          content:
            contentEditableRef
              .current
              ?.innerHTML ||
            "",
        })
      );
    };

  const handleContentInput =
    () => {
      setForm(
        (
          previous: any
        ) => ({
          ...previous,

          content:
            contentEditableRef
              .current
              ?.innerHTML ||
            "",
        })
      );
    };

  const handleInsertLink =
    () => {
      const url =
        window.prompt(
          "Link URL"
        );

      if (url) {
        applyFormat(
          "createLink",
          url
        );
      }
    };

  const handleInsertImage =
    () => {
      const url =
        window.prompt(
          "Image URL"
        );

      if (!url) {
        return;
      }

      insertHtml(`
        <div style="margin:28px 0;">
          <img
            src="${url}"
            alt=""
            style="width:100%;height:auto;border-radius:18px;display:block;"
          />
        </div>
      `);
    };

  const insertHeadingBlock =
    () => {
      insertHtml(`
        <h2 style="font-size:32px;line-height:1.15;margin:32px 0 16px;color:#292524;">
          Add your heading
        </h2>
      `);
    };

  const insertDivider =
    () => {
      insertHtml(`
        <hr style="border:none;border-top:1px solid #e7e5e4;margin:36px 0;" />
      `);
    };

  const insertQuote =
    () => {
      insertHtml(`
        <blockquote style="margin:36px 0;padding:10px 0 10px 24px;border-left:3px solid ${form.brand_color || DEFAULT_BRAND_COLOR};font-size:24px;">
          Add your quote here.
        </blockquote>
      `);
    };

  const insertTwoColumn =
    () => {
      insertHtml(`
        <table width="100%" style="margin:32px 0;">
          <tr>
            <td width="48%" style="padding-right:4%;">
              Left column content.
            </td>

            <td width="48%">
              Right column content.
            </td>
          </tr>
        </table>
      `);
    };

  const applyTemplate =
    (
      template: CampaignTemplate
    ) => {
      const content =
        template.buildContent(
          companyBranding
        );

      setForm(
        (
          previous: any
        ) => ({
          ...previous,

          brand_color:
            template.brandColor,

          brand_font:
            template.font,

          content,
        })
      );

      requestAnimationFrame(
        () => {
          if (
            contentEditableRef.current
          ) {
            contentEditableRef.current.innerHTML =
              content;
          }
        }
      );
    };

  const executeGeneration =
    () => {
      if (
        !clarityTopic.trim()
      ) {
        return;
      }

      setIsGenerating(
        true
      );

      window.setTimeout(
        () => {
          const generated =
            `
              <p>Hi,</p>

              <p>
                We wanted to share an update about
                ${clarityTopic}.
              </p>

              <h2>
                Here’s what you need to know
              </h2>

              <p>
                Add the key details here.
              </p>
            `;

          setForm(
            (
              previous: any
            ) => ({
              ...previous,

              subject:
                `Update: ${clarityTopic}`,

              content:
                generated,
            })
          );

          if (
            contentEditableRef.current
          ) {
            contentEditableRef.current.innerHTML =
              generated;
          }

          setIsGenerating(
            false
          );

          setShowClarityPrompt(
            false
          );
        },
        1000
      );
    };

  const formatScheduledDate =
    (
      value:
        | string
        | null
    ) => {
      if (!value) {
        return "Immediate Release";
      }

      return new Date(
        value
      ).toLocaleString(
        "en-GB"
      );
    };

  const openNewCampaign =
    () => {
      setEditingCampaignId(
        null
      );

      setStep(
        "editor"
      );

      setForm({
        ...emptyForm(),

        sender_name:
          companyBranding.name,

        reply_to:
          companyBranding.email,
      });

      setCampaignCompanyDetails(
        ""
      );

      setShowModal(
        true
      );
    };

  const activeBrandColor =
    form.brand_color ||
    DEFAULT_BRAND_COLOR;

  const activeBrandFont =
    form.brand_font ||
    FONT_OPTIONS[0]
      .value;

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#faf9f6] p-4 font-sans text-stone-900 md:p-12">

      {/* HEADER */}

      <header className="mx-auto mb-12 flex max-w-7xl flex-col gap-6 border-b border-stone-200 pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.5em] text-[#8fa07d]">
            Campaign Dashboard
          </p>

          <h1 className="font-serif text-5xl italic md:text-7xl">
            Campaigns
          </h1>
        </div>

        <button
          onClick={
            openNewCampaign
          }
          className="flex items-center justify-center gap-3 rounded-2xl bg-stone-900 px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897]"
        >
          <Plus
            size={18}
          />

          Create Campaign
        </button>
      </header>

      {/* MAIN */}

      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">

        <div className="space-y-6 lg:col-span-8">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">
            Campaign Status Pipeline
          </p>

          {campaigns.length ===
            0 && (
            <div className="rounded-[3rem] bg-white p-20 text-center">
              <p className="font-serif italic text-stone-300">
                No campaigns
                scheduled.
              </p>
            </div>
          )}

          {campaigns.map(
            (
              campaign
            ) => (
              <div
                key={
                  campaign.id
                }
                onClick={() => {
                  setSelectedCampaign(
                    campaign
                  );

                  setShowViewModal(
                    true
                  );
                }}
                className="cursor-pointer rounded-[3rem] border border-stone-100 bg-white p-8"
              >
                <div className="flex justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-black uppercase">
                      {
                        campaign.title
                      }
                    </h3>

                    <p className="mt-2 font-serif text-sm italic text-stone-500">
                      {
                        campaign.subject
                      }
                    </p>

                    <p className="mt-3 flex items-center gap-2 text-[10px] text-stone-400">
                      <Clock
                        size={12}
                      />

                      {formatScheduledDate(
                        campaign.scheduled_for
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-[9px] font-black uppercase">
                      {campaign.status ||
                        "queued"}
                    </span>

                    <p className="mt-3 text-[9px] text-stone-400">
                      Opens{" "}
                      {campaign.open_count ||
                        0}
                    </p>

                    <p className="text-[9px] text-stone-400">
                      Clicks{" "}
                      {campaign.click_count ||
                        0}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* LISTS */}

        <aside className="lg:col-span-4">
          <div className="rounded-[3rem] border border-stone-200 bg-stone-50 p-8">
            <div className="mb-8 flex justify-between">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#8fa07d]">
                Campaign Lists
              </p>

              <button
                onClick={() =>
                  setShowListModal(
                    true
                  )
                }
              >
                <Plus
                  size={16}
                />
              </button>
            </div>

            <div className="space-y-5">
              {lists.map(
                (
                  list
                ) => (
                  <button
                    key={
                      list.id
                    }
                    onClick={async () => {
                      setSelectedList(
                        list
                      );

                      setShowListDetailModal(
                        true
                      );

                      setListSubscribers(
                        await loadListSubscribers(
                          list.id
                        )
                      );
                    }}
                    className="flex w-full justify-between border-b border-stone-200 pb-4 text-left text-[10px] font-black uppercase tracking-widest"
                  >
                    <span>
                      {
                        list.name
                      }{" "}
                      (
                      {subscriberCounts[
                        list.id
                      ] || 0}
                      )
                    </span>

                    <Hash
                      size={11}
                    />
                  </button>
                )
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* CREATE LIST */}

      <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="relative w-full max-w-md rounded-[3rem] bg-white p-10"
            >
              <button
                onClick={() =>
                  setShowListModal(
                    false
                  )
                }
                className="absolute right-8 top-8"
              >
                <X
                  size={17}
                />
              </button>

              <h2 className="mb-6 font-serif text-2xl italic">
                Create Campaign List
              </h2>

              <input
                value={
                  newListName
                }
                onChange={(
                  event
                ) =>
                  setNewListName(
                    event.target
                      .value
                  )
                }
                placeholder="List name"
                className="mb-5 w-full rounded-2xl border bg-stone-50 p-4 outline-none"
              />

              <button
                onClick={async () => {
                  if (
                    await createList(
                      newListName
                    )
                  ) {
                    setNewListName(
                      ""
                    );

                    setShowListModal(
                      false
                    );
                  }
                }}
                className="w-full rounded-2xl bg-stone-900 py-4 text-[10px] font-black uppercase text-white"
              >
                Create List
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIST DETAILS */}

      <AnimatePresence>
        {showListDetailModal &&
          selectedList && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[3rem] bg-white"
              >
                <div className="flex justify-between border-b p-8">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#8fa07d]">
                      Campaign List
                    </p>

                    <h2 className="mt-2 font-serif text-2xl italic">
                      {
                        selectedList.name
                      }
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      setShowListDetailModal(
                        false
                      )
                    }
                  >
                    <X
                      size={18}
                    />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  <div className="mb-6 flex justify-between">
                    <p className="text-[10px] font-black uppercase text-stone-400">
                      Subscribers (
                      {
                        listSubscribers.length
                      }
                      )
                    </p>

                    <button
                      onClick={() => {
                        setManualEmails(
                          ""
                        );

                        setSelectedProfiles(
                          []
                        );

                        setShowSubscriberManager(
                          true
                        );
                      }}
                      className="rounded-xl bg-stone-900 px-5 py-3 text-[9px] font-black uppercase text-[#a9b897]"
                    >
                      Add Subscribers
                    </button>
                  </div>

                  <div className="space-y-3">
                    {listSubscribers.map(
                      (
                        subscriber
                      ) => (
                        <div
                          key={`${subscriber.source}-${subscriber.id}`}
                          className="flex items-center justify-between rounded-2xl bg-stone-50 p-4"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold">
                                {subscriber.name ||
                                  subscriber.email}
                              </p>

                              {subscriber.source ===
                                "manual" && (
                                <span className="rounded-full bg-[#a9b897]/20 px-2 py-1 text-[7px] font-black uppercase text-[#71805f]">
                                  Manual
                                </span>
                              )}
                            </div>

                            {subscriber.name && (
                              <p className="mt-1 text-xs text-stone-500">
                                {
                                  subscriber.email
                                }
                              </p>
                            )}
                          </div>

                          <button
                            onClick={async () => {
                              if (
                                subscriber.source ===
                                  "manual" &&
                                subscriber.manual_email_id
                              ) {
                                await removeManualSubscriber(
                                  subscriber.manual_email_id
                                );
                              } else if (
                                subscriber.profile_id
                              ) {
                                await removeSubscriber(
                                  selectedList.id,
                                  subscriber.profile_id
                                );
                              }

                              setListSubscribers(
                                await loadListSubscribers(
                                  selectedList.id
                                )
                              );
                            }}
                            className="text-[9px] font-black uppercase text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t p-6">
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Delete list "${selectedList.name}"?`
                        )
                      ) {
                        return;
                      }

                      await deleteList(
                        selectedList.id
                      );

                      setShowListDetailModal(
                        false
                      );

                      setSelectedList(
                        null
                      );
                    }}
                    className="rounded-xl bg-red-600 px-6 py-3 text-[10px] font-black uppercase text-white"
                  >
                    Delete
                  </button>

                  <button
                    onClick={() =>
                      setShowListDetailModal(
                        false
                      )
                    }
                    className="rounded-xl bg-stone-900 px-6 py-3 text-[10px] font-black uppercase text-[#a9b897]"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
      </AnimatePresence>

      {/* SUBSCRIBER MANAGER */}

      {showSubscriberManager &&
        selectedList && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 p-4">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[3rem] bg-white">
              <div className="flex justify-between border-b p-8">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#8fa07d]">
                    {
                      selectedList.name
                    }
                  </p>

                  <h3 className="mt-2 text-xl font-bold">
                    Add Subscribers
                  </h3>
                </div>

                <button
                  onClick={() =>
                    setShowSubscriberManager(
                      false
                    )
                  }
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <div className="flex-1 space-y-8 overflow-y-auto p-8">

                {/* MANUAL EMAIL */}

                <section>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-[#a9b897]/20 p-3">
                      <Mail
                        size={16}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-black">
                        Add Any Email
                      </p>

                      <p className="text-[10px] text-stone-400">
                        They do not need a TOTS-OS account.
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={
                      manualEmails
                    }
                    onChange={(
                      event
                    ) =>
                      setManualEmails(
                        event.target
                          .value
                      )
                    }
                    placeholder={`hello@example.com
marketing@business.com
another@email.co.uk`}
                    className="min-h-[150px] w-full rounded-2xl border bg-stone-50 p-5 outline-none"
                  />

                  <p className="mt-3 text-[9px] text-stone-400">
                    One email per
                    line, or separate
                    with commas or
                    semicolons.
                  </p>

                  {manualEmails.trim() && (
                    <p className="mt-2 text-[9px] font-black text-[#71805f]">
                      {
                        parseManualEmails(
                          manualEmails
                        ).length
                      }{" "}
                      valid email(s)
                    </p>
                  )}
                </section>

                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-stone-200" />

                  <span className="text-[8px] uppercase tracking-widest text-stone-400">
                    Or existing
                    subscribers
                  </span>

                  <div className="h-px flex-1 bg-stone-200" />
                </div>

                {/* PROFILES */}

                <section className="space-y-2">
                  {profiles.map(
                    (
                      profile: any
                    ) => {
                      const checked =
                        selectedProfiles.includes(
                          profile.id
                        );

                      return (
                        <label
                          key={
                            profile.id
                          }
                          className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 ${
                            checked
                              ? "border-[#a9b897] bg-[#a9b897]/10"
                              : "bg-stone-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              checked
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
                                  ) =>
                                    previous.includes(
                                      profile.id
                                    )
                                      ? previous
                                      : [
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

                            <p className="text-xs text-stone-500">
                              {
                                profile.email
                              }
                            </p>
                          </div>
                        </label>
                      );
                    }
                  )}
                </section>
              </div>

              <div className="border-t bg-stone-50 p-8">
                <button
                  disabled={
                    savingSubscribers
                  }
                  onClick={async () => {
                    const emails =
                      parseManualEmails(
                        manualEmails
                      );

                    if (
                      !emails.length &&
                      !selectedProfiles.length
                    ) {
                      alert(
                        "Enter at least one valid email or select a subscriber."
                      );

                      return;
                    }

                    setSavingSubscribers(
                      true
                    );

                    try {
                      if (
                        selectedProfiles.length
                      ) {
                        await addSubscribersToList(
                          selectedList.id,
                          selectedProfiles
                        );
                      }

                      if (
                        emails.length
                      ) {
                        await addManualSubscribersToList(
                          selectedList.id,
                          emails
                        );
                      }

                      setListSubscribers(
                        await loadListSubscribers(
                          selectedList.id
                        )
                      );

                      setManualEmails(
                        ""
                      );

                      setSelectedProfiles(
                        []
                      );

                      setShowSubscriberManager(
                        false
                      );
                    } catch (
                      error
                    ) {
                      console.error(
                        "Save subscribers error:",
                        error
                      );

                      alert(
                        "Failed to save subscribers. Check the browser console for the exact Supabase error."
                      );
                    } finally {
                      setSavingSubscribers(
                        false
                      );
                    }
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-stone-900 py-5 text-[10px] font-black uppercase tracking-widest text-[#a9b897] disabled:opacity-50"
                >
                  {savingSubscribers ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Check
                      size={16}
                    />
                  )}

                  {savingSubscribers
                    ? "Saving..."
                    : "Save Subscribers"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* CAMPAIGN VIEW */}

      {showViewModal &&
        selectedCampaign && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-3xl rounded-[3rem] bg-white p-8">
              <div className="flex justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#8fa07d]">
                    Campaign
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {
                      selectedCampaign.title
                    }
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <p className="mt-8 font-serif text-2xl italic">
                {
                  selectedCampaign.subject
                }
              </p>

              <div
                className="mt-8 rounded-2xl bg-stone-50 p-6"
                dangerouslySetInnerHTML={{
                  __html:
                    selectedCampaign.content ||
                    "",
                }}
              />

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setEditingCampaignId(
                      selectedCampaign.id
                    );

                    setForm({
                      ...selectedCampaign,

                      content:
                        stripAutomaticCompanyFooter(
                          selectedCampaign.content ||
                            ""
                        ),
                    });

                    setStep(
                      "editor"
                    );

                    setShowViewModal(
                      false
                    );

                    setShowModal(
                      true
                    );
                  }}
                  className="rounded-xl bg-stone-100 px-6 py-3 text-[10px] font-black uppercase"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    setShowEmailPreview(
                      true
                    )
                  }
                  className="rounded-xl bg-stone-100 px-6 py-3 text-[10px] font-black uppercase"
                >
                  Preview
                </button>

                <button
                  onClick={() =>
                    void sendCampaignNow(
                      selectedCampaign.id
                    )
                  }
                  className="rounded-xl bg-emerald-700 px-6 py-3 text-[10px] font-black uppercase text-white"
                >
                  Send Now
                </button>

                <button
                  onClick={async () => {
                    await deleteCampaign(
                      selectedCampaign.id
                    );

                    setShowViewModal(
                      false
                    );
                  }}
                  className="rounded-xl bg-red-600 px-6 py-3 text-[10px] font-black uppercase text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      {/* CAMPAIGN EDITOR */}

      {showModal && (
        <div className="fixed inset-0 z-[700] overflow-y-auto bg-stone-900/70 p-4 backdrop-blur-lg">
          <div className="relative mx-auto min-h-[90vh] max-w-6xl rounded-[3rem] bg-[#faf9f6] p-6 md:p-12">
            <button
              onClick={() =>
                setShowModal(
                  false
                )
              }
              className="absolute right-8 top-8"
            >
              <X
                size={20}
              />
            </button>

            {step ===
            "editor" ? (
              <div className="grid gap-10 lg:grid-cols-[300px_1fr]">

                {/* SIDEBAR */}

                <aside className="space-y-5">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8fa07d]">
                      Campaign Studio
                    </p>

                    <h2 className="mt-3 font-serif text-3xl italic">
                      Build Email
                    </h2>
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <button
                      onClick={() =>
                        setShowTemplates(
                          (
                            previous
                          ) =>
                            !previous
                        )
                      }
                      className="flex w-full justify-between text-[9px] font-black uppercase"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutTemplate
                          size={13}
                        />

                        Templates
                      </span>

                      <span>
                        {showTemplates
                          ? "Hide"
                          : "Show"}
                      </span>
                    </button>

                    {showTemplates && (
                      <div className="mt-4 space-y-2">
                        {CAMPAIGN_TEMPLATES.map(
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
                              className="w-full rounded-xl bg-stone-50 p-3 text-left"
                            >
                              <p className="text-[9px] font-black uppercase">
                                {
                                  template.name
                                }
                              </p>

                              <p className="mt-1 text-[8px] text-stone-400">
                                {
                                  template.description
                                }
                              </p>
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <p className="mb-3 text-[8px] font-black uppercase text-stone-400">
                      Insert Block
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={
                          insertHeadingBlock
                        }
                        className="rounded-xl bg-stone-50 p-3 text-[9px]"
                      >
                        Heading
                      </button>

                      <button
                        onClick={
                          insertQuote
                        }
                        className="rounded-xl bg-stone-50 p-3 text-[9px]"
                      >
                        Quote
                      </button>

                      <button
                        onClick={
                          insertDivider
                        }
                        className="rounded-xl bg-stone-50 p-3 text-[9px]"
                      >
                        Divider
                      </button>

                      <button
                        onClick={
                          insertTwoColumn
                        }
                        className="rounded-xl bg-stone-50 p-3 text-[9px]"
                      >
                        Columns
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <label className="text-[8px] font-black uppercase text-stone-400">
                      Company Name
                    </label>

                    <input
                      value={
                        companyNameInput
                      }
                      onChange={(
                        event
                      ) =>
                        setCompanyNameInput(
                          event.target
                            .value
                        )
                      }
                      className="mt-2 w-full rounded-xl bg-stone-50 p-3 text-xs"
                    />

                    <button
                      onClick={() =>
                        void updateCompanyName(
                          companyNameInput
                        )
                      }
                      className="mt-3 w-full rounded-xl bg-stone-900 py-3 text-[9px] font-black uppercase text-[#a9b897]"
                    >
                      Save
                    </button>
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <label className="text-[8px] font-black uppercase text-stone-400">
                      Sender Name
                    </label>

                    <input
                      value={
                        form.sender_name
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,

                          sender_name:
                            event.target
                              .value,
                        })
                      }
                      className="mt-2 w-full rounded-xl bg-stone-50 p-3 text-xs"
                    />

                    <label className="mt-4 block text-[8px] font-black uppercase text-stone-400">
                      Reply To
                    </label>

                    <input
                      value={
                        form.reply_to
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,

                          reply_to:
                            event.target
                              .value,
                        })
                      }
                      className="mt-2 w-full rounded-xl bg-stone-50 p-3 text-xs"
                    />
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <label className="text-[8px] font-black uppercase text-stone-400">
                      Header Image URL
                    </label>

                    <input
                      value={
                        form.header_image_url
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,

                          header_image_url:
                            event.target
                              .value,
                        })
                      }
                      className="mt-2 w-full rounded-xl bg-stone-50 p-3 text-xs"
                    />
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <label className="text-[8px] font-black uppercase text-stone-400">
                      Brand Colour
                    </label>

                    <input
                      type="color"
                      value={
                        form.brand_color
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,

                          brand_color:
                            event.target
                              .value,
                        })
                      }
                      className="mt-3 h-10 w-full"
                    />

                    <select
                      value={
                        form.brand_font
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,

                          brand_font:
                            event.target
                              .value,
                        })
                      }
                      className="mt-4 w-full rounded-xl bg-stone-50 p-3 text-xs"
                    >
                      {FONT_OPTIONS.map(
                        (
                          font
                        ) => (
                          <option
                            key={
                              font.value
                            }
                            value={
                              font.value
                            }
                          >
                            {
                              font.label
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <label className="text-[8px] font-black uppercase text-stone-400">
                      CTA Text
                    </label>

                    <input
                      value={
                        form.cta_text
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,

                          cta_text:
                            event.target
                              .value,
                        })
                      }
                      className="mt-2 w-full rounded-xl bg-stone-50 p-3 text-xs"
                    />

                    <label className="mt-4 block text-[8px] font-black uppercase text-stone-400">
                      CTA URL
                    </label>

                    <input
                      value={
                        form.cta_url
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,

                          cta_url:
                            event.target
                              .value,
                        })
                      }
                      className="mt-2 w-full rounded-xl bg-stone-50 p-3 text-xs"
                    />
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <p className="mb-3 flex items-center gap-2 text-[8px] font-black uppercase text-stone-400">
                      <Share2
                        size={11}
                      />

                      Social Links
                    </p>

                    {(
                      [
                        "instagram",
                        "facebook",
                        "linkedin",
                        "twitter",
                      ] as (
                        keyof SocialLinks
                      )[]
                    ).map(
                      (
                        platform
                      ) => (
                        <input
                          key={
                            platform
                          }
                          value={
                            form
                              .social_links?.[
                              platform
                            ] ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            setForm({
                              ...form,

                              social_links:
                                {
                                  ...form.social_links,

                                  [platform]:
                                    event.target
                                      .value,
                                },
                            })
                          }
                          placeholder={`${platform} URL`}
                          className="mb-2 w-full rounded-xl bg-stone-50 p-3 text-xs"
                        />
                      )
                    )}
                  </div>
                </aside>

                {/* EMAIL CANVAS */}

                <main>
                  <div className="mb-6 flex justify-between">
                    <p className="text-[9px] font-black uppercase text-stone-400">
                      Email Design Canvas
                    </p>

                    <button
                      onClick={() =>
                        setShowClarityPrompt(
                          true
                        )
                      }
                      className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-[9px] font-black uppercase text-[#a9b897]"
                    >
                      <Zap
                        size={13}
                      />

                      Clarity Assistant
                    </button>
                  </div>

                  {showClarityPrompt && (
                    <div className="mb-6 rounded-2xl bg-stone-900 p-6">
                      <input
                        value={
                          clarityTopic
                        }
                        onChange={(
                          event
                        ) =>
                          setClarityTopic(
                            event.target
                              .value
                          )
                        }
                        placeholder="Campaign topic"
                        className="w-full rounded-xl bg-white/10 p-4 text-white"
                      />

                      <button
                        onClick={
                          executeGeneration
                        }
                        className="mt-3 flex items-center gap-2 rounded-xl bg-[#a9b897] px-5 py-3 text-[9px] font-black uppercase"
                      >
                        {isGenerating ? (
                          <Loader2
                            size={13}
                            className="animate-spin"
                          />
                        ) : (
                          <Sparkles
                            size={13}
                          />
                        )}

                        Generate
                      </button>
                    </div>
                  )}

                  <div className="min-h-[800px] rounded-[3rem] bg-white p-8 shadow-xl md:p-14">
                    <input
                      value={
                        form.title
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,

                          title:
                            event.target
                              .value,
                        })
                      }
                      placeholder="Campaign title..."
                      className="mb-5 w-full border-b pb-4 text-xl font-bold outline-none"
                    />

                    <input
                      value={
                        form.preview_text
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,

                          preview_text:
                            event.target
                              .value,
                        })
                      }
                      placeholder="Inbox preview..."
                      className="mb-5 w-full text-xs italic outline-none"
                    />

                    <textarea
                      value={
                        form.subject
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,

                          subject:
                            event.target
                              .value,
                        })
                      }
                      placeholder="Email subject..."
                      className="mb-8 h-28 w-full resize-none border-b font-serif text-4xl italic outline-none"
                    />

                    <div className="mb-5 flex flex-wrap gap-1 rounded-xl bg-stone-50 p-2">
                      <button
                        onClick={() =>
                          applyFormat(
                            "bold"
                          )
                        }
                        className="p-2"
                      >
                        <Bold
                          size={14}
                        />
                      </button>

                      <button
                        onClick={() =>
                          applyFormat(
                            "italic"
                          )
                        }
                        className="p-2"
                      >
                        <Italic
                          size={14}
                        />
                      </button>

                      <button
                        onClick={() =>
                          applyFormat(
                            "formatBlock",
                            "H2"
                          )
                        }
                        className="p-2"
                      >
                        <Heading2
                          size={14}
                        />
                      </button>

                      <button
                        onClick={() =>
                          applyFormat(
                            "justifyLeft"
                          )
                        }
                        className="p-2"
                      >
                        <AlignLeft
                          size={14}
                        />
                      </button>

                      <button
                        onClick={() =>
                          applyFormat(
                            "justifyCenter"
                          )
                        }
                        className="p-2"
                      >
                        <AlignCenter
                          size={14}
                        />
                      </button>

                      <button
                        onClick={() =>
                          applyFormat(
                            "justifyRight"
                          )
                        }
                        className="p-2"
                      >
                        <AlignRight
                          size={14}
                        />
                      </button>

                      <button
                        onClick={
                          handleInsertLink
                        }
                        className="p-2"
                      >
                        <Link2
                          size={14}
                        />
                      </button>

                      <button
                        onClick={
                          handleInsertImage
                        }
                        className="p-2"
                      >
                        <ImageIcon
                          size={14}
                        />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowColorPicker(
                              (
                                previous
                              ) =>
                                !previous
                            )
                          }
                          className="p-2"
                        >
                          <Palette
                            size={14}
                          />
                        </button>

                        {showColorPicker && (
                          <div className="absolute z-20 flex gap-2 rounded-xl bg-white p-3 shadow-xl">
                            {COLOR_SWATCHES.map(
                              (
                                color
                              ) => (
                                <button
                                  key={
                                    color
                                  }
                                  onClick={() => {
                                    applyFormat(
                                      "foreColor",
                                      color
                                    );

                                    setShowColorPicker(
                                      false
                                    );
                                  }}
                                  className="h-6 w-6 rounded-full"
                                  style={{
                                    backgroundColor:
                                      color,
                                  }}
                                />
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      ref={
                        contentEditableRef
                      }
                      contentEditable
                      suppressContentEditableWarning
                      onInput={
                        handleContentInput
                      }
                      className="min-h-[400px] outline-none"
                      style={{
                        fontFamily:
                          activeBrandFont,
                      }}
                    />

                    {form.cta_text && (
                      <div className="mt-12 text-center">
                        <a
                          href={
                            form.cta_url ||
                            "#"
                          }
                          className="inline-block rounded-xl px-10 py-5 text-[10px] font-black uppercase text-white"
                          style={{
                            backgroundColor:
                              activeBrandColor,
                          }}
                        >
                          {
                            form.cta_text
                          }
                        </a>
                      </div>
                    )}

                    <div className="mt-16 border-t pt-8 text-center">
                      <p className="font-black uppercase tracking-widest">
                        {
                          companyBranding.name
                        }
                      </p>

                      <p className="mt-3 text-xs text-stone-400">
                        {
                          companyBranding.email
                        }
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setStep(
                        "schedule"
                      )
                    }
                    className="mx-auto mt-10 block rounded-2xl bg-stone-900 px-12 py-5 text-[10px] font-black uppercase text-[#a9b897]"
                  >
                    Proceed to Scheduling
                  </button>
                </main>
              </div>
            ) : (
              <div className="mx-auto max-w-2xl py-20">
                <div className="rounded-[3rem] bg-white p-10 shadow-xl">
                  <Users
                    size={30}
                    className="mx-auto mb-5 text-stone-300"
                  />

                  <h2 className="mb-8 text-center font-serif text-4xl italic">
                    Scheduling
                  </h2>

                  <label className="text-[9px] font-black uppercase text-stone-400">
                    Target List
                  </label>

                  <select
                    value={
                      form.list_id
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,

                        list_id:
                          event.target
                            .value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border bg-stone-50 p-5"
                  >
                    <option value="">
                      Select list
                    </option>

                    {lists.map(
                      (
                        list
                      ) => (
                        <option
                          key={
                            list.id
                          }
                          value={
                            list.id
                          }
                        >
                          {
                            list.name
                          }{" "}
                          (
                          {subscriberCounts[
                            list.id
                          ] || 0}
                          )
                        </option>
                      )
                    )}
                  </select>

                  <label className="mt-6 block text-[9px] font-black uppercase text-stone-400">
                    Scheduled Time
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      form.scheduled_for
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,

                        scheduled_for:
                          event.target
                            .value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border bg-stone-50 p-5"
                  />

                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() =>
                        setStep(
                          "editor"
                        )
                      }
                      className="flex-1 rounded-2xl bg-stone-100 py-4 text-[10px] font-black uppercase"
                    >
                      Back
                    </button>

                    <button
                      onClick={async () => {
                        if (
                          !form.title ||
                          !form.subject ||
                          !form.list_id
                        ) {
                          alert(
                            "Please fill in title, subject and target list."
                          );

                          return;
                        }

                        const payload = {
                          ...form,

                          content:
                            withAutomaticCompanyDetails(
                              form.content
                            ),
                        };

                        if (
                          editingCampaignId
                        ) {
                          await updateCampaign(
                            payload,
                            editingCampaignId
                          );
                        } else {
                          await scheduleCampaign(
                            payload
                          );
                        }

                        setEditingCampaignId(
                          null
                        );

                        setShowModal(
                          false
                        );

                        setStep(
                          "editor"
                        );
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-[10px] font-black uppercase text-[#a9b897]"
                    >
                      <CalendarIcon
                        size={14}
                      />

                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREVIEW */}

      {showEmailPreview &&
        selectedCampaign && (
          <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[3rem] bg-white">
              <div className="flex justify-between border-b p-8">
                <h2 className="font-serif text-xl italic">
                  Email Preview
                </h2>

                <button
                  onClick={() =>
                    setShowEmailPreview(
                      false
                    )
                  }
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <div
                className="p-10"
                dangerouslySetInnerHTML={{
                  __html:
                    selectedCampaign.content ||
                    "",
                }}
              />
            </div>
          </div>
        )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        [contenteditable="true"] a {
          text-decoration: underline;
        }

        [contenteditable="true"] img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}