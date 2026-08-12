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
  FileText,
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
  Wand2,
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
          linkError,
      } = await supabase
        .from(
          "profile_subscriber_lists"
        )
        .delete()
        .eq("list_id", id);

      if (linkError) {
        console.error(
          "deleteList subscriber link error:",
          linkError
        );

        throw linkError;
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
      if (!organisationId) {
        return;
      }

      const rows =
        profileIds.map(
          (profile_id) => ({
            profile_id,
            list_id: listId,
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
        .upsert(rows, {
          onConflict:
            "profile_id,list_id",
        });

      if (error) {
        console.error(
          "addSubscribers error:",
          error
        );

        throw error;
      }
    },

    async subscriberCounts() {
      if (!organisationId) {
        return {};
      }

      const {
        data,
        error,
      } = await supabase
        .from(
          "profile_subscriber_lists"
        )
        .select("list_id")
        .eq(
          "organisation_id",
          organisationId
        );

      if (
        error ||
        !data
      ) {
        return {};
      }

      const counts: Record<
        string,
        number
      > = {};

      data.forEach(
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
        .from("profiles")
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
          .from("team")
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
        team?.name ||
        profile
          ?.company_name ||
        profile
          ?.business_name ||
        profile
          ?.full_name ||
        profile?.name ||
        "Your Company";

      const logoUrl =
        profile
          ?.logo_url ||
        profile
          ?.company_logo_url ||
        team?.logo_url ||
        "";

      const email =
        profile?.email ||
        "";

      const details =
        profile?.bio ||
        team?.description ||
        "";

      setCompanyBranding({
        name:
          companyName,
        logoUrl,
        email,
        details,
      });

      if (
        !orgId &&
        team
          ?.organisation_id
      ) {
        setOrganisationId(
          team.organisation_id
        );
      }
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
          name: trimmed,
        })
      );

      const {
        error,
      } = await supabase
        .from("team")
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

        return {} as Record<
          string,
          number
        >;
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

      cacheRef.current = {
        data,
        ts: now,
      };

      const incoming =
        data || [];

      const clickCounts =
        await loadClickCounts(
          incoming.map(
            (campaign: any) =>
              campaign.id
          )
        );

      setCampaigns(
        incoming.map(
          (campaign: any) => {
            const optimisticStatus =
              optimisticStatusRef
                .current[
                campaign.id
              ];

            return {
              ...campaign,

              status:
                optimisticStatus ||
                campaign.status,

              click_count:
                clickCounts[
                  campaign.id
                ] || 0,
            };
          }
        )
      );
    };

  // ==================================================
  // INITIAL USER / ORG
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
  // LOAD ORG DATA
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
          await Promise.all(
            [
              service.listCampaigns(),
              service.listSubscriberLists(),
              service.listProfiles(),
              service.subscriberCounts(),
            ]
          );

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

        setCampaigns(
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
          )
        );

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
    supabase,
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
        name?.trim();

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
          name: trimmed,

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
        (previous) => [
          ...previous,
          data,
        ]
      );

      return true;
    };

  // ==================================================
  // SCHEDULE
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
          (previous) => [
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
  // LIST SUBSCRIBERS
  // ==================================================

  const loadListSubscribers =
    async (
      listId: string
    ) => {
      if (
        !listId ||
        !organisationId
      ) {
        return [];
      }

      const {
        data,
        error,
      } = await supabase
        .from(
          "profile_subscriber_lists"
        )
        .select(
          "profile_id, profiles:profiles(id, name, full_name, email)"
        )
        .eq(
          "list_id",
          listId
        );

      if (error) {
        console.error(
          "Load subscribers error:",
          error
        );

        return [];
      }

      return (
        data || []
      ).map(
        (
          row: any,
          index: number
        ) => ({
          profile_id:
            row.profile_id ??
            `missing-${index}`,

          profiles:
            row.profiles ?? {
              id: null,
              name: null,
              full_name:
                null,
              email: null,
            },
        })
      );
    };

  // ==================================================
  // UPDATE CAMPAIGN
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
          (previous) =>
            previous.map(
              (campaign) =>
                campaign.id ===
                id
                  ? {
                      ...campaign,
                      ...updated,
                    }
                  : campaign
            )
        );

        if (
          updated?.status
        ) {
          optimisticStatusRef.current[
            id
          ] =
            updated.status;
        }
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
        (previous) =>
          previous.filter(
            (campaign) =>
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
        (previous) =>
          previous.filter(
            (list) =>
              list.id !== id
          )
      );
    };

  // ==================================================
  // REMOVE SUBSCRIBER
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

      const counts =
        await service.subscriberCounts();

      setSubscriberCounts(
        counts
      );
    };

  // ==================================================
  // SEND NOW
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
                JSON.stringify(
                  {
                    campaignId,
                  }
                ),
            }
          );

        if (
          !response.ok
        ) {
          const error =
            await response.json();

          alert(
            error.error ||
              "Failed to send campaign."
          );

          optimisticStatusRef.current[
            campaignId
          ] = "failed";

          return response;
        }

        optimisticStatusRef.current[
          campaignId
        ] = "sent";

        cacheRef.current.ts =
          0;

        await refreshCampaigns();

        return response;
      } catch (error) {
        optimisticStatusRef.current[
          campaignId
        ] = "failed";

        throw error;
      }
    };

  // ==================================================
  // ADD SUBSCRIBERS
  // ==================================================

  const addSubscribersToList =
    async (
      listId: string,
      profileIds: string[]
    ) => {
      await service.addSubscribers(
        listId,
        profileIds
      );

      const counts =
        await service.subscriberCounts();

      setSubscriberCounts(
        counts
      );
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
          "realtime-campaigns-lists"
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
            service
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
            void refreshCampaigns();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "campaign_opens",
          },
          async () => {
            const {
              data,
            } = await supabase
              .from(
                "campaign_opens"
              )
              .select(
                "campaign_id"
              );

            const counts: Record<
              string,
              number
            > = {};

            (
              data || []
            ).forEach(
              (
                row: any
              ) => {
                counts[
                  row.campaign_id
                ] =
                  (counts[
                    row
                      .campaign_id
                  ] || 0) +
                  1;
              }
            );

            setCampaigns(
              (previous) =>
                previous.map(
                  (
                    campaign
                  ) => ({
                    ...campaign,

                    open_count:
                      counts[
                        campaign
                          .id
                      ] || 0,
                  })
                )
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
              "campaign_clicks",
          },
          () => {
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
    supabase,
    service,
  ]);

  return {
    campaigns,
    setCampaigns,

    lists,

    companyBranding,
    updateCompanyName,

    organisationId,

    createList,
    scheduleCampaign,
    loadListSubscribers,
    updateCampaign,
    deleteCampaign,
    deleteList,
    removeSubscriber,

    subscriberCounts,
    profiles,

    sendCampaignNow,

    addSubscribersToList,

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

    subscriberCounts,
    profiles,

    sendCampaignNow:
      sendCampaignNowBase,

    addSubscribersToList,

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
  ] = useState<any[]>(
    []
  );

  const [
    selectedProfiles,
    setSelectedProfiles,
  ] = useState<
    string[]
  >([]);

  const [
    showSubscriberManager,
    setShowSubscriberManager,
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

  // ==================================================
  // BRANDING SYNC
  // ==================================================

  useEffect(() => {
    setCompanyNameInput(
      companyBranding.name
    );
  }, [
    companyBranding.name,
  ]);

  // ==================================================
  // CONTENT EDITOR SYNC
  // ==================================================

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

  // ==================================================
  // COMPANY FOOTER
  // ==================================================

  const withAutomaticCompanyDetails =
    (
      contentHtml: string
    ) => {
      const cleanContent =
        stripAutomaticCompanyFooter(
          contentHtml || ""
        );

      const footer =
        buildCompanyFooterHtml(
          companyBranding,
          campaignCompanyDetails,
          form.social_links
        );

      return `${cleanContent}${footer}`;
    };

  // ==================================================
  // SEND NOW
  // ==================================================

  const sendCampaignNow =
    async (
      campaignId: string
    ) => {
      setCampaigns(
        (previous) =>
          previous.map(
            (campaign) =>
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

      if (
        selectedCampaign
          ?.id ===
        campaignId
      ) {
        setSelectedCampaign(
          (previous: any) =>
            previous
              ? {
                  ...previous,
                  status:
                    "sending",
                }
              : previous
        );
      }

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

        setCampaigns(
          (previous) =>
            previous.map(
              (campaign) =>
                campaign.id ===
                campaignId
                  ? {
                      ...campaign,

                      status:
                        "sent",

                      sent_at:
                        campaign.sent_at ||
                        new Date().toISOString(),
                    }
                  : campaign
            )
        );

        if (
          selectedCampaign
            ?.id ===
          campaignId
        ) {
          setSelectedCampaign(
            (previous: any) =>
              previous
                ? {
                    ...previous,

                    status:
                      "sent",

                    sent_at:
                      previous.sent_at ||
                      new Date().toISOString(),
                  }
                : previous
          );
        }

        window.setTimeout(
          () => {
            void refreshCampaigns();
          },
          1500
        );
      } catch (error) {
        console.error(
          "sendCampaignNow error:",
          error
        );

        setCampaigns(
          (previous) =>
            previous.map(
              (campaign) =>
                campaign.id ===
                campaignId
                  ? {
                      ...campaign,
                      status:
                        "failed",
                    }
                  : campaign
            )
        );

        if (
          selectedCampaign
            ?.id ===
          campaignId
        ) {
          setSelectedCampaign(
            (previous: any) =>
              previous
                ? {
                    ...previous,
                    status:
                      "failed",
                  }
                : previous
          );
        }

        await refreshCampaigns();
      }
    };

  // ==================================================
  // FORMAT
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

      try {
        document.execCommand(
          command,
          false,
          value
        );
      } catch (error) {
        console.error(
          "Format command failed:",
          command,
          error
        );
      }

      setForm(
        (previous: any) => ({
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
        (previous: any) => ({
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
      if (
        !contentEditableRef.current
      ) {
        return;
      }

      setForm(
        (previous: any) => ({
          ...previous,

          content:
            contentEditableRef
              .current
              ?.innerHTML ||
            "",
        })
      );
    };

  // ==================================================
  // EDITOR ACTIONS
  // ==================================================

  const handleInsertLink =
    () => {
      const url =
        window.prompt(
          "Link URL (include https://)"
        );

      if (!url) {
        return;
      }

      applyFormat(
        "createLink",
        url
      );
    };

  const handleInsertImage =
    () => {
      const url =
        window.prompt(
          "Image URL (include https://)"
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

  const toggleHeading =
    () => {
      applyFormat(
        "formatBlock",
        "H2"
      );
    };

  // ==================================================
  // CONTENT BLOCKS
  // ==================================================

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
        <blockquote style="margin:36px 0;padding:10px 0 10px 24px;border-left:3px solid ${form.brand_color || DEFAULT_BRAND_COLOR};font-size:24px;line-height:1.5;font-style:italic;color:#57534e;">
          Add your quote or key message here.
        </blockquote>
      `);
    };

  const insertTwoColumn =
    () => {
      insertHtml(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
          <tr>
            <td width="48%" valign="top" style="padding-right:4%;">
              <p style="font-size:16px;line-height:1.7;">
                Left column content.
              </p>
            </td>

            <td width="48%" valign="top">
              <p style="font-size:16px;line-height:1.7;">
                Right column content.
              </p>
            </td>
          </tr>
        </table>
      `);
    };

  // ==================================================
  // APPLY TEMPLATE
  // ==================================================

  const applyTemplate =
    (
      template: CampaignTemplate
    ) => {
      const content =
        template.buildContent(
          companyBranding
        );

      setForm(
        (previous: any) => ({
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

  // ==================================================
  // AI GENERATION
  // ==================================================

  const executeGeneration =
    () => {
      if (!clarityTopic) {
        return;
      }

      setIsGenerating(
        true
      );

      window.setTimeout(
        () => {
          const generatedSubject =
            `Update: ${clarityTopic
              .split(" ")
              .slice(0, 4)
              .join(" ")}`;

          const generatedContent = `
            <p style="font-size:17px;line-height:1.8;">
              Hi,
            </p>

            <p style="font-size:17px;line-height:1.8;">
              We wanted to share an update about ${clarityTopic}.
            </p>

            <h2 style="font-size:30px;line-height:1.2;margin:32px 0 16px;">
              Here’s what you need to know
            </h2>

            <p style="font-size:17px;line-height:1.8;">
              Add the key details, value and next steps for your audience here.
            </p>
          `;

          setForm(
            (previous: any) => ({
              ...previous,

              subject:
                generatedSubject,

              content:
                generatedContent,
            })
          );

          if (
            contentEditableRef.current
          ) {
            contentEditableRef.current.innerHTML =
              generatedContent;
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

  // ==================================================
  // SOCIAL
  // ==================================================

  const updateSocialLink =
    (
      platform:
        keyof SocialLinks,
      value: string
    ) => {
      setForm(
        (previous: any) => ({
          ...previous,

          social_links: {
            ...(
              previous.social_links ||
              {}
            ),

            [platform]:
              value,
          },
        })
      );
    };

  // ==================================================
  // DATE
  // ==================================================

  const formatScheduledDate =
    (
      dateString:
        | string
        | null
    ) => {
      if (!dateString) {
        return "Immediate Release";
      }

      try {
        const date =
          new Date(
            dateString
          );

        return date.toLocaleString(
          "en-GB",
          {
            day:
              "numeric",

            month:
              "short",

            year:
              "numeric",

            hour:
              "2-digit",

            minute:
              "2-digit",
          }
        );
      } catch {
        return dateString;
      }
    };

  const activeBrandColor =
    form.brand_color ||
    DEFAULT_BRAND_COLOR;

  const activeBrandFont =
    form.brand_font ||
    FONT_OPTIONS[0]
      .value;

  // ==================================================
  // OPEN NEW CAMPAIGN
  // ==================================================

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

      setShowTemplates(
        true
      );

      setShowModal(
        true
      );
    };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#faf9f6] p-4 font-sans text-stone-900 md:p-12">
      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="mx-auto mb-8 flex max-w-7xl flex-col gap-6 border-b border-stone-200 pb-10 md:mb-16 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.5em] text-[#8fa07d]">
            Campaign Dashboard
          </p>

          <h1 className="font-serif text-5xl italic tracking-tighter text-stone-800 md:text-7xl">
            Campaigns
          </h1>

          <div className="mt-5 flex items-center gap-3">
            {companyBranding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  companyBranding.logoUrl
                }
                alt={
                  companyBranding.name
                }
                className="h-9 w-9 rounded-xl border border-stone-200 bg-white object-contain p-1"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-[9px] font-black text-stone-400">
                OS
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-stone-700">
                {
                  companyBranding.name
                }
              </p>

              <p className="text-[9px] uppercase tracking-wider text-stone-400">
                Brand synced from
                settings
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={
            openNewCampaign
          }
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-stone-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] shadow-xl transition-all hover:scale-[1.02] md:w-auto md:py-5 md:text-[11px]"
        >
          <Plus size={18} />

          Create Campaign
        </button>
      </header>

      {/* ==================================================
          MAIN GRID
      ================================================== */}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-12">
        {/* ==================================================
            CAMPAIGN PIPELINE
        ================================================== */}

        <div className="order-2 space-y-6 lg:order-1 lg:col-span-8">
          <p className="ml-4 text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">
            Campaign Status
            Pipeline
          </p>

          {campaigns.length ===
          0 ? (
            <div className="rounded-[3.5rem] border border-stone-100 bg-white p-24 text-center shadow-sm">
              <p className="font-serif text-2xl italic text-stone-200">
                No campaigns
                scheduled at this
                time.
              </p>
            </div>
          ) : (
            campaigns.map(
              (campaign) => (
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
                  className="group flex cursor-pointer flex-col justify-between gap-6 rounded-[3rem] border border-stone-100 bg-white p-8 shadow-sm transition-all hover:border-stone-200 hover:shadow-md md:flex-row md:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-6">
                    <div
                      className="shrink-0 rounded-2xl bg-stone-50 p-5"
                      style={{
                        color:
                          campaign.brand_color ||
                          "#a9b897",
                      }}
                    >
                      <Radio
                        size={20}
                        className="animate-pulse"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-xl font-black uppercase tracking-tight text-stone-800">
                          {
                            campaign.title
                          }
                        </h3>

                        <span className="rounded-full bg-stone-100 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-stone-500">
                          {campaign
                            .subscriber_lists
                            ?.name ||
                            "Unassigned List"}
                        </span>
                      </div>

                      <p className="block truncate font-serif text-xs italic text-stone-500">
                        Subject:{" "}
                        {campaign.subject ||
                          "No Subject Specified"}
                      </p>

                      {campaign.preview_text && (
                        <p className="block truncate text-[11px] text-stone-400">
                          {
                            campaign.preview_text
                          }
                        </p>
                      )}

                      <div className="flex items-center gap-4 pt-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        <span className="flex items-center gap-1">
                          <Clock
                            size={
                              12
                            }
                          />

                          {formatScheduledDate(
                            campaign.scheduled_for
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                        campaign.status ===
                        "sent"
                          ? "bg-emerald-100 text-emerald-700"
                          : campaign.status ===
                                "sending" ||
                              campaign.status ===
                                "processing"
                            ? "bg-amber-100 text-amber-700"
                            : campaign.status ===
                                "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {campaign.status ||
                        "queued"}
                    </span>

                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                      Opens:{" "}
                      {campaign.open_count ||
                        0}
                    </span>

                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                      Clicks:{" "}
                      {campaign.click_count ||
                        0}
                    </span>
                  </div>
                </div>
              )
            )
          )}
        </div>

        {/* ==================================================
            LISTS
        ================================================== */}

        <aside className="order-1 lg:order-2 lg:col-span-4">
          <div className="rounded-[3.5rem] border border-stone-200 bg-stone-50 p-8 shadow-sm md:p-12">
            <div className="mb-10 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#8fa07d]">
                Campaign Lists
              </p>

              <button
                onClick={() =>
                  setShowListModal(
                    true
                  )
                }
                className="rounded-full border border-stone-200 bg-white p-2 transition-colors hover:bg-stone-100"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-6">
              {lists.map(
                (list) => (
                  <div
                    key={list.id}
                    onClick={async () => {
                      setSelectedList(
                        list
                      );

                      setShowListDetailModal(
                        true
                      );

                      const result =
                        await loadListSubscribers(
                          list.id
                        );

                      setListSubscribers(
                        result
                      );
                    }}
                    className="flex cursor-pointer items-center justify-between border-b border-stone-200 pb-4 text-[10px] font-black uppercase tracking-widest text-stone-600 hover:text-stone-900"
                  >
                    <span>
                      {list.name} (
                      {subscriberCounts?.[
                        list.id
                      ] || 0}
                      )
                    </span>

                    <Hash
                      size={10}
                      className="text-stone-300"
                    />
                  </div>
                )
              )}

              {lists.length ===
                0 && (
                <p className="font-serif text-[10px] italic text-stone-400">
                  No subscriber
                  lists created
                  yet.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ==================================================
          CAMPAIGN VIEW MODAL
      ================================================== */}

      <AnimatePresence>
        {showViewModal &&
          selectedCampaign && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xl md:p-10">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                }}
                className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[3.5rem] border border-stone-200 bg-[#faf9f6] shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4 border-b border-stone-200 bg-stone-50 p-8 md:p-12">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      {companyBranding.logoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            companyBranding.logoUrl
                          }
                          alt={
                            companyBranding.name
                          }
                          className="h-10 w-10 rounded-xl border border-stone-200 bg-white object-contain p-1"
                        />
                      )}

                      <span className="rounded-full bg-stone-900 px-4 py-1 text-[9px] font-black uppercase tracking-widest text-[#a9b897]">
                        Campaign
                        Profile
                      </span>
                    </div>

                    <h2 className="text-3xl font-black uppercase tracking-tight text-stone-800">
                      {
                        selectedCampaign.title
                      }
                    </h2>
                  </div>

                  <button
                    onClick={() => {
                      setShowViewModal(
                        false
                      );

                      setSelectedCampaign(
                        null
                      );
                    }}
                    className="rounded-full border border-stone-200 bg-white p-3 transition-colors hover:bg-stone-100"
                  >
                    <X
                      size={18}
                    />
                  </button>
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto p-8 md:p-12">
                  <div>
                    <p className="mb-2 text-[9px] font-black uppercase tracking-wider text-stone-400">
                      Subject
                    </p>

                    <div className="rounded-2xl border border-stone-100 bg-white p-5 font-serif text-lg italic text-stone-900">
                      {selectedCampaign.subject ||
                        "No Subject Specified"}
                    </div>
                  </div>

                  {selectedCampaign.header_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        selectedCampaign.header_image_url
                      }
                      alt=""
                      className="h-48 w-full rounded-3xl border border-stone-200 object-cover"
                    />
                  )}

                  <div
                    className="min-h-[200px] rounded-[2.5rem] border border-stone-200 bg-white p-8 text-base leading-relaxed shadow-sm md:p-10"
                    style={{
                      fontFamily:
                        selectedCampaign.brand_font ||
                        undefined,
                    }}
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedCampaign.content ||
                        "Empty content payload.",
                    }}
                  />

                  {selectedCampaign.cta_text &&
                    selectedCampaign.cta_url && (
                      <div className="text-center">
                        <a
                          href={
                            selectedCampaign.cta_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white"
                          style={{
                            backgroundColor:
                              selectedCampaign.brand_color ||
                              DEFAULT_BRAND_COLOR,

                            borderRadius:
                              "14px",
                          }}
                        >
                          {
                            selectedCampaign.cta_text
                          }
                        </a>
                      </div>
                    )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
                      <p className="text-[9px] font-black uppercase text-stone-400">
                        Sent
                      </p>

                      <p className="text-xl font-bold">
                        {selectedCampaign.sent_count ||
                          0}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
                      <p className="text-[9px] font-black uppercase text-stone-400">
                        Opens
                      </p>

                      <p className="text-xl font-bold">
                        {selectedCampaign.open_count ||
                          0}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
                      <p className="text-[9px] font-black uppercase text-stone-400">
                        Clicks
                      </p>

                      <p className="text-xl font-bold">
                        {selectedCampaign.click_count ||
                          0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-between gap-3 border-t border-stone-200 bg-stone-50 p-6">
                  <button
                    onClick={() => {
                      setShowViewModal(
                        false
                      );

                      setEditingCampaignId(
                        selectedCampaign.id
                      );

                      const rawContent =
                        stripAutomaticCompanyFooter(
                          selectedCampaign.content ||
                            ""
                        );

                      setForm({
                        title:
                          selectedCampaign.title ||
                          "",

                        subject:
                          selectedCampaign.subject ||
                          "",

                        preview_text:
                          selectedCampaign.preview_text ||
                          "",

                        list_id:
                          selectedCampaign.list_id
                            ? String(
                                selectedCampaign.list_id
                              )
                            : "",

                        scheduled_for:
                          selectedCampaign.scheduled_for ||
                          "",

                        content:
                          rawContent,

                        sender_name:
                          selectedCampaign.sender_name ||
                          companyBranding.name,

                        reply_to:
                          selectedCampaign.reply_to ||
                          companyBranding.email,

                        header_image_url:
                          selectedCampaign.header_image_url ||
                          "",

                        brand_color:
                          selectedCampaign.brand_color ||
                          DEFAULT_BRAND_COLOR,

                        brand_font:
                          selectedCampaign.brand_font ||
                          FONT_OPTIONS[0]
                            .value,

                        cta_text:
                          selectedCampaign.cta_text ||
                          "",

                        cta_url:
                          selectedCampaign.cta_url ||
                          "",

                        social_links:
                          selectedCampaign.social_links || {
                            twitter:
                              "",
                            facebook:
                              "",
                            instagram:
                              "",
                            linkedin:
                              "",
                          },
                      });

                      setShowModal(
                        true
                      );
                    }}
                    className="rounded-xl border border-stone-200 bg-white px-8 py-4 text-[10px] font-black uppercase text-stone-700"
                  >
                    Edit Campaign
                  </button>

                  <button
                    onClick={() =>
                      setShowEmailPreview(
                        true
                      )
                    }
                    className="rounded-xl border border-stone-200 bg-stone-100 px-8 py-4 text-[10px] font-black uppercase text-stone-700"
                  >
                    Preview Email
                  </button>

                  <button
                    onClick={() =>
                      void sendCampaignNow(
                        selectedCampaign.id
                      )
                    }
                    disabled={
                      selectedCampaign.status ===
                        "sending" ||
                      selectedCampaign.status ===
                        "sent"
                    }
                    className="rounded-xl bg-emerald-700 px-8 py-4 text-[10px] font-black uppercase text-white disabled:opacity-50"
                  >
                    {selectedCampaign.status ===
                    "sent"
                      ? "Sent"
                      : selectedCampaign.status ===
                          "sending"
                        ? "Sending..."
                        : "Send Now"}
                  </button>

                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Delete "${selectedCampaign.title}"?`
                        )
                      ) {
                        return;
                      }

                      await deleteCampaign(
                        selectedCampaign.id
                      );

                      setShowViewModal(
                        false
                      );

                      setSelectedCampaign(
                        null
                      );
                    }}
                    className="rounded-xl bg-red-600 px-8 py-4 text-[10px] font-black uppercase text-white"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
      </AnimatePresence>

      {/* ==================================================
          CREATE LIST MODAL
      ================================================== */}

      <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/40 p-6 backdrop-blur-sm">
            <motion.div
              initial={{
                scale: 0.9,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              className="relative w-full max-w-md rounded-[3rem] border border-stone-200 bg-white p-10 shadow-2xl"
            >
              <button
                onClick={() =>
                  setShowListModal(
                    false
                  )
                }
                className="absolute right-8 top-8 rounded-full p-2 text-stone-400 hover:text-stone-900"
              >
                <X size={16} />
              </button>

              <h3 className="mb-6 font-serif text-2xl italic">
                Create Campaign
                List
              </h3>

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
                placeholder="Segment name"
                className="mb-6 w-full rounded-2xl border border-stone-100 bg-stone-50 p-4 outline-none focus:border-stone-900"
              />

              <button
                onClick={async () => {
                  const created =
                    await createList(
                      newListName
                    );

                  if (!created) {
                    return;
                  }

                  setNewListName(
                    ""
                  );

                  setShowListModal(
                    false
                  );
                }}
                className="w-full rounded-2xl bg-stone-900 py-4 text-[10px] font-black uppercase tracking-widest text-white"
              >
                Create List
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================
          CAMPAIGN EDITOR
      ================================================== */}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-xl md:p-6">
            <motion.div
              initial={{
                opacity: 0,
                y: 50,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="relative flex h-full w-full flex-col overflow-hidden border border-stone-200 bg-[#faf9f6] shadow-2xl md:h-[92vh] md:max-w-[1500px] md:flex-row md:rounded-[3rem]"
            >
              <button
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
                className="absolute right-6 top-6 z-[110] rounded-full border border-stone-200 bg-white p-3 text-stone-700 shadow-sm hover:bg-stone-100"
              >
                <X size={18} />
              </button>

              {/* ==================================================
                  SIDEBAR
              ================================================== */}

              <div className="no-scrollbar w-full shrink-0 space-y-4 overflow-y-auto border-r border-stone-200 bg-stone-50 p-6 md:w-[350px] md:p-8">
                <div className="mb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">
                    Campaign Studio
                  </p>

                  <p className="mt-2 text-xs leading-relaxed text-stone-500">
                    Build a branded
                    email with your
                    company details
                    automatically
                    included.
                  </p>
                </div>

                {/* BRAND SYNC */}
                <div className="rounded-2xl border border-[#a9b897]/30 bg-[#a9b897]/10 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    {companyBranding.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          companyBranding.logoUrl
                        }
                        alt=""
                        className="h-12 w-12 rounded-xl border border-white bg-white object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                        <ImageIcon
                          size={
                            17
                          }
                          className="text-stone-300"
                        />
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-black text-stone-800">
                        {
                          companyBranding.name
                        }
                      </p>

                      <p className="text-[8px] font-black uppercase tracking-wider text-[#71805f]">
                        Synced from
                        settings
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] leading-relaxed text-stone-500">
                    Your logo, company
                    name, contact details
                    and profile summary
                    will automatically be
                    included in the
                    campaign footer.
                  </p>
                </div>

                {/* TEMPLATES */}
                <div className="rounded-2xl border border-stone-100 bg-white p-4">
                  <button
                    type="button"
                    onClick={() =>
                      setShowTemplates(
                        (
                          previous
                        ) =>
                          !previous
                      )
                    }
                    className="flex w-full items-center justify-between"
                  >
                    <span className="flex items-center gap-2 text-[8px] font-black uppercase tracking-wider text-stone-400">
                      <LayoutTemplate
                        size={12}
                      />
                      Templates
                    </span>

                    <span className="text-[9px] text-stone-400">
                      {showTemplates
                        ? "Hide"
                        : "Show"}
                    </span>
                  </button>

                  {showTemplates && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {CAMPAIGN_TEMPLATES.map(
                        (
                          template
                        ) => (
                          <button
                            key={
                              template.id
                            }
                            type="button"
                            onClick={() =>
                              applyTemplate(
                                template
                              )
                            }
                            className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-left transition hover:border-[#a9b897] hover:bg-white"
                          >
                            <p className="text-[9px] font-black uppercase text-stone-800">
                              {
                                template.name
                              }
                            </p>

                            <p className="mt-1 text-[8px] leading-relaxed text-stone-400">
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

                {/* CONTENT BLOCKS */}
                <div className="rounded-2xl border border-stone-100 bg-white p-4">
                  <p className="mb-3 text-[8px] font-black uppercase tracking-wider text-stone-400">
                    Insert Block
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={
                        insertHeadingBlock
                      }
                      className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-[9px] font-bold text-stone-600 hover:bg-stone-100"
                    >
                      <Type
                        size={12}
                      />
                      Heading
                    </button>

                    <button
                      type="button"
                      onClick={
                        insertQuote
                      }
                      className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-[9px] font-bold text-stone-600 hover:bg-stone-100"
                    >
                      <Quote
                        size={12}
                      />
                      Quote
                    </button>

                    <button
                      type="button"
                      onClick={
                        insertDivider
                      }
                      className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-[9px] font-bold text-stone-600 hover:bg-stone-100"
                    >
                      <Minus
                        size={12}
                      />
                      Divider
                    </button>

                    <button
                      type="button"
                      onClick={
                        insertTwoColumn
                      }
                      className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-[9px] font-bold text-stone-600 hover:bg-stone-100"
                    >
                      <Columns2
                        size={12}
                      />
                      2 Columns
                    </button>
                  </div>
                </div>

                {/* COMPANY NAME */}
                <div className="rounded-2xl border border-stone-100 bg-white p-4">
                  <label className="mb-2 block text-[8px] font-black uppercase tracking-wider text-stone-400">
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
                    className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs font-bold outline-none"
                  />

                  <button
                    onClick={() =>
                      void updateCompanyName(
                        companyNameInput
                      )
                    }
                    className="mt-3 w-full rounded-xl bg-stone-900 py-2 text-[9px] font-black uppercase text-[#a9b897]"
                  >
                    Save Company Name
                  </button>
                </div>

                {/* EXTRA FOOTER */}
                <div className="rounded-2xl border border-stone-100 bg-white p-4">
                  <label className="mb-2 block text-[8px] font-black uppercase tracking-wider text-stone-400">
                    Extra Footer Note
                  </label>

                  <textarea
                    value={
                      campaignCompanyDetails
                    }
                    onChange={(
                      event
                    ) =>
                      setCampaignCompanyDetails(
                        event.target
                          .value
                      )
                    }
                    placeholder="Optional campaign-specific footer details..."
                    className="min-h-[70px] w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none"
                  />

                  <p className="mt-2 text-[9px] leading-relaxed text-stone-400">
                    Leave blank to use
                    the company summary
                    from Settings.
                  </p>
                </div>

                {/* SENDER */}
                <div className="space-y-3 rounded-2xl border border-stone-100 bg-white p-4">
                  <p className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-stone-400">
                    <Mail
                      size={10}
                    />
                    Sender
                  </p>

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
                    placeholder="Sender name"
                    className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs font-bold outline-none"
                  />

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
                    placeholder="Reply-to email"
                    className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none"
                  />
                </div>

                {/* PREVIEW TEXT */}
                <div className="rounded-2xl border border-stone-100 bg-white p-4">
                  <label className="mb-2 block text-[8px] font-black uppercase tracking-wider text-stone-400">
                    Inbox Preview
                  </label>

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
                    placeholder="Preview text shown after the subject"
                    className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none"
                  />
                </div>

                {/* HEADER IMAGE */}
                <div className="rounded-2xl border border-stone-100 bg-white p-4">
                  <label className="mb-2 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-stone-400">
                    <ImageIcon
                      size={10}
                    />

                    Header Image
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
                    placeholder="https://..."
                    className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none"
                  />

                  {form.header_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        form.header_image_url
                      }
                      alt=""
                      className="mt-3 h-24 w-full rounded-xl border border-stone-100 object-cover"
                    />
                  )}
                </div>

                {/* BRAND STYLE */}
                <div className="space-y-3 rounded-2xl border border-stone-100 bg-white p-4">
                  <p className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-stone-400">
                    <Palette
                      size={10}
                    />
                    Brand Style
                  </p>

                  <div className="flex items-center gap-3">
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
                            event
                              .target
                              .value,
                        })
                      }
                      className="h-10 w-10 cursor-pointer rounded-lg border border-stone-200"
                    />

                    <input
                      value={
                        form.brand_color
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,

                          brand_color:
                            event
                              .target
                              .value,
                        })
                      }
                      className="flex-1 rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs font-bold outline-none"
                    />
                  </div>

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
                    className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none"
                  >
                    {FONT_OPTIONS.map(
                      (font) => (
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

                {/* CTA */}
                <div className="space-y-3 rounded-2xl border border-stone-100 bg-white p-4">
                  <p className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-stone-400">
                    <MousePointerClick
                      size={10}
                    />

                    Call To Action
                  </p>

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
                    placeholder="Button text"
                    className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs font-bold outline-none"
                  />

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
                    placeholder="Button URL"
                    className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none"
                  />
                </div>

                {/* SOCIAL */}
                <div className="space-y-3 rounded-2xl border border-stone-100 bg-white p-4">
                  <p className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-stone-400">
                    <Share2
                      size={10}
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
                          ] || ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateSocialLink(
                            platform,
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={`${platform} URL`}
                        className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none"
                      />
                    )
                  )}
                </div>
              </div>

              {/* ==================================================
                  EDITOR AREA
              ================================================== */}

              <div className="no-scrollbar flex-1 overflow-y-auto bg-stone-100/30 p-6 md:p-12">
                {step ===
                  "editor" && (
                  <div className="mx-auto w-full max-w-4xl pb-20">
                    <div className="mb-8 flex items-center justify-between gap-4 pr-14 md:pr-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                        Email Design
                        Canvas
                      </span>

                      <button
                        onClick={() =>
                          setShowClarityPrompt(
                            true
                          )
                        }
                        className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-widest text-[#a9b897] shadow-md"
                      >
                        <Zap
                          size={13}
                        />

                        Clarity
                        Assistant
                      </button>
                    </div>

                    <AnimatePresence>
                      {showClarityPrompt && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: -10,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                          }}
                          className="relative mb-8 rounded-[2rem] bg-stone-900 p-7 text-white"
                        >
                          <button
                            onClick={() =>
                              setShowClarityPrompt(
                                false
                              )
                            }
                            className="absolute right-5 top-5 text-stone-400"
                          >
                            <X
                              size={
                                15
                              }
                            />
                          </button>

                          <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-[#a9b897]">
                            Campaign
                            Objective
                          </h4>

                          <input
                            value={
                              clarityTopic
                            }
                            onChange={(
                              event
                            ) =>
                              setClarityTopic(
                                event
                                  .target
                                  .value
                              )
                            }
                            className="mb-4 w-full rounded-2xl border border-white/10 bg-white/5 p-5 font-serif text-sm italic text-white outline-none"
                            placeholder="What is this campaign about?"
                          />

                          <button
                            onClick={
                              executeGeneration
                            }
                            className="flex items-center gap-2 rounded-xl bg-[#a9b897] px-8 py-3 text-[9px] font-black uppercase tracking-widest text-stone-900"
                          >
                            {isGenerating ? (
                              <Loader2
                                size={
                                  12
                                }
                                className="animate-spin"
                              />
                            ) : (
                              <Sparkles
                                size={
                                  12
                                }
                              />
                            )}

                            Generate
                            Draft
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* EMAIL CANVAS */}
                    <div className="min-h-[850px] w-full rounded-[3rem] border border-stone-200 bg-white p-8 text-stone-600 shadow-2xl md:p-16">
                      {/* BRAND HEADER */}
                      <div className="mb-12 flex items-center justify-between border-b border-stone-100 pb-8">
                        <div className="flex items-center gap-4">
                          {companyBranding.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                companyBranding.logoUrl
                              }
                              alt={
                                companyBranding.name
                              }
                              className="max-h-16 max-w-[150px] object-contain"
                            />
                          ) : (
                            <span className="font-serif text-xl italic text-stone-300">
                              {
                                companyBranding.name
                              }
                            </span>
                          )}
                        </div>

                        <span className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-300">
                          Email
                          Campaign
                        </span>
                      </div>

                      {form.header_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            form.header_image_url
                          }
                          alt=""
                          className="mb-10 h-56 w-full rounded-3xl object-cover"
                        />
                      )}

                      <input
                        placeholder="Campaign title..."
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
                        className="mb-5 w-full border-b border-stone-100 bg-transparent pb-4 text-xl font-bold text-stone-900 outline-none"
                      />

                      <input
                        placeholder="Inbox preview text..."
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
                        className="mb-6 w-full bg-transparent text-xs italic text-stone-400 outline-none"
                      />

                      <textarea
                        placeholder="Email subject line..."
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
                        className="mb-8 h-32 w-full resize-none border-b border-stone-100 bg-transparent pb-8 font-serif text-3xl italic leading-tight text-stone-900 outline-none md:text-5xl"
                      />

                      {/* TOOLBAR */}
                      <div className="mb-5 flex w-fit flex-wrap items-center gap-1 rounded-2xl border border-stone-100 bg-stone-50 p-2">
                        <button
                          type="button"
                          onClick={() =>
                            applyFormat(
                              "bold"
                            )
                          }
                          className="rounded-lg p-2 hover:bg-stone-200"
                        >
                          <Bold
                            size={
                              14
                            }
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            applyFormat(
                              "italic"
                            )
                          }
                          className="rounded-lg p-2 hover:bg-stone-200"
                        >
                          <Italic
                            size={
                              14
                            }
                          />
                        </button>

                        <button
                          type="button"
                          onClick={
                            toggleHeading
                          }
                          className="rounded-lg p-2 hover:bg-stone-200"
                        >
                          <Heading2
                            size={
                              14
                            }
                          />
                        </button>

                        <span className="mx-1 h-5 w-px bg-stone-200" />

                        <button
                          type="button"
                          onClick={() =>
                            applyFormat(
                              "justifyLeft"
                            )
                          }
                          className="rounded-lg p-2 hover:bg-stone-200"
                        >
                          <AlignLeft
                            size={
                              14
                            }
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            applyFormat(
                              "justifyCenter"
                            )
                          }
                          className="rounded-lg p-2 hover:bg-stone-200"
                        >
                          <AlignCenter
                            size={
                              14
                            }
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            applyFormat(
                              "justifyRight"
                            )
                          }
                          className="rounded-lg p-2 hover:bg-stone-200"
                        >
                          <AlignRight
                            size={
                              14
                            }
                          />
                        </button>

                        <span className="mx-1 h-5 w-px bg-stone-200" />

                        <button
                          type="button"
                          onClick={
                            handleInsertLink
                          }
                          className="rounded-lg p-2 hover:bg-stone-200"
                        >
                          <Link2
                            size={
                              14
                            }
                          />
                        </button>

                        <button
                          type="button"
                          onClick={
                            handleInsertImage
                          }
                          className="rounded-lg p-2 hover:bg-stone-200"
                        >
                          <ImageIcon
                            size={
                              14
                            }
                          />
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setShowColorPicker(
                                (
                                  previous
                                ) =>
                                  !previous
                              )
                            }
                            className="rounded-lg p-2 hover:bg-stone-200"
                          >
                            <Palette
                              size={
                                14
                              }
                            />
                          </button>

                          {showColorPicker && (
                            <div className="absolute left-0 top-10 z-20 flex gap-1 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
                              {COLOR_SWATCHES.map(
                                (
                                  color
                                ) => (
                                  <button
                                    key={
                                      color
                                    }
                                    type="button"
                                    onClick={() => {
                                      applyFormat(
                                        "foreColor",
                                        color
                                      );

                                      setShowColorPicker(
                                        false
                                      );
                                    }}
                                    className="h-6 w-6 rounded-full border border-stone-200"
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

                      {/* CONTENT */}
                      <div
                        ref={
                          contentEditableRef
                        }
                        contentEditable
                        suppressContentEditableWarning
                        onInput={
                          handleContentInput
                        }
                        data-placeholder="Write your campaign here..."
                        className="min-h-[400px] text-base leading-relaxed text-stone-700 outline-none empty:before:content-[attr(data-placeholder)] empty:before:opacity-20 md:text-lg"
                        style={{
                          fontFamily:
                            activeBrandFont,
                        }}
                      />

                      {/* CTA */}
                      {form.cta_text && (
                        <div className="mt-12 text-center">
                          <a
                            href={
                              form.cta_url ||
                              "#"
                            }
                            className="inline-block px-10 py-5 text-[11px] font-black uppercase tracking-widest text-white"
                            style={{
                              backgroundColor:
                                activeBrandColor,

                              borderRadius:
                                "14px",
                            }}
                          >
                            {
                              form.cta_text
                            }
                          </a>
                        </div>
                      )}

                      {/* LIVE AUTO FOOTER PREVIEW */}
                      <footer className="mt-16 border-t border-stone-100 pt-10 text-center">
                        {companyBranding.logoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              companyBranding.logoUrl
                            }
                            alt={
                              companyBranding.name
                            }
                            className="mx-auto mb-5 max-h-14 max-w-[120px] object-contain"
                          />
                        )}

                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.35em] text-stone-900">
                          {
                            companyBranding.name
                          }
                        </p>

                        {(campaignCompanyDetails ||
                          companyBranding.details) && (
                          <p className="mx-auto mb-3 max-w-xl whitespace-pre-wrap text-[10px] leading-relaxed text-stone-500">
                            {campaignCompanyDetails ||
                              companyBranding.details}
                          </p>
                        )}

                        {companyBranding.email && (
                          <p className="text-[10px] text-stone-400">
                            {
                              companyBranding.email
                            }
                          </p>
                        )}

                        <p className="mt-4 text-[8px] font-medium uppercase tracking-[0.3em] text-stone-300">
                          Powered by
                          TOTS-OS
                        </p>
                      </footer>
                    </div>

                    <div className="mt-12 flex justify-center">
                      <button
                        onClick={() =>
                          setStep(
                            "schedule"
                          )
                        }
                        className="rounded-3xl bg-stone-900 px-12 py-6 text-[11px] font-black uppercase tracking-[0.3em] text-[#a9b897] shadow-2xl transition hover:scale-[1.02] md:px-24"
                      >
                        Proceed to
                        Scheduling
                      </button>
                    </div>
                  </div>
                )}

                {/* ==================================================
                    SCHEDULE
                ================================================== */}

                {step ===
                  "schedule" && (
                  <div className="mx-auto mt-10 w-full max-w-2xl rounded-[4rem] border border-stone-200 bg-white p-8 text-center shadow-2xl md:p-16">
                    <Users
                      size={32}
                      className="mx-auto mb-6 text-stone-200"
                    />

                    <h2 className="mb-8 font-serif text-4xl italic text-stone-800">
                      Scheduling
                    </h2>

                    <div className="mb-12 space-y-8 text-left">
                      <div>
                        <label className="mb-3 block text-[9px] font-black uppercase text-stone-400">
                          Target
                          Campaign List
                        </label>

                        <select
                          value={
                            form.list_id ??
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            setForm({
                              ...form,

                              list_id:
                                event
                                  .target
                                  .value ||
                                "",
                            })
                          }
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-5 text-xs outline-none focus:border-stone-900"
                        >
                          <option value="">
                            Select
                            audience
                            list...
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
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-3 block text-[9px] font-black uppercase text-stone-400">
                          Scheduled
                          Time
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
                                event
                                  .target
                                  .value,
                            })
                          }
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-5 text-xs outline-none focus:border-stone-900"
                        />
                      </div>

                      {/* BRAND SUMMARY */}
                      <div className="rounded-2xl border border-[#a9b897]/30 bg-[#a9b897]/10 p-5">
                        <div className="flex items-center gap-4">
                          {companyBranding.logoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                companyBranding.logoUrl
                              }
                              alt=""
                              className="h-12 w-12 rounded-xl bg-white object-contain p-1"
                            />
                          )}

                          <div>
                            <p className="text-xs font-black text-stone-800">
                              Company
                              branding
                              ready
                            </p>

                            <p className="mt-1 text-[10px] text-stone-500">
                              Logo and
                              company
                              details will
                              be attached
                              automatically.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                      <button
                        onClick={() =>
                          setStep(
                            "editor"
                          )
                        }
                        className="rounded-2xl bg-stone-100 px-10 py-5 text-[10px] font-black uppercase tracking-widest text-stone-500"
                      >
                        Return to
                        Editor
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
                        className="flex items-center justify-center gap-3 rounded-2xl bg-stone-900 px-12 py-5 text-[10px] font-black uppercase tracking-widest text-[#a9b897] shadow-xl"
                      >
                        <CalendarIcon
                          size={16}
                        />

                        Schedule
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================
          EMAIL PREVIEW
      ================================================== */}

      {showEmailPreview &&
        selectedCampaign && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-900/70 p-6">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[3rem] border border-stone-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-stone-100 p-8">
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

              <div className="no-scrollbar overflow-y-auto">
                <div className="border-b border-stone-100 bg-stone-50 p-6 text-xs">
                  <p className="text-stone-800">
                    <span className="font-black">
                      From:
                    </span>{" "}
                    {selectedCampaign.sender_name ||
                      companyBranding.name}
                  </p>

                  <p className="mt-1 font-bold text-stone-800">
                    {
                      selectedCampaign.subject
                    }
                  </p>

                  {selectedCampaign.preview_text && (
                    <p className="mt-1 text-stone-400">
                      {
                        selectedCampaign.preview_text
                      }
                    </p>
                  )}
                </div>

                <div
                  style={{
                    fontFamily:
                      selectedCampaign.brand_font ||
                      undefined,
                  }}
                >
                  {selectedCampaign.header_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        selectedCampaign.header_image_url
                      }
                      alt=""
                      className="h-48 w-full object-cover"
                    />
                  )}

                  <div
                    className="p-10 leading-relaxed text-stone-700"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedCampaign.content ||
                        "",
                    }}
                  />

                  {selectedCampaign.cta_text &&
                    selectedCampaign.cta_url && (
                      <div className="pb-10 text-center">
                        <a
                          href={
                            selectedCampaign.cta_url
                          }
                          className="inline-block px-10 py-4 text-[11px] font-black uppercase tracking-widest text-white"
                          style={{
                            backgroundColor:
                              selectedCampaign.brand_color ||
                              DEFAULT_BRAND_COLOR,

                            borderRadius:
                              "14px",
                          }}
                        >
                          {
                            selectedCampaign.cta_text
                          }
                        </a>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ==================================================
          LIST DETAILS
      ================================================== */}

      <AnimatePresence>
        {showListDetailModal &&
          selectedList && (
            <div className="fixed inset-0 z-[210] flex items-center justify-center bg-stone-900/50 p-6 backdrop-blur-sm">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                }}
                className="w-full max-w-2xl rounded-[3rem] border border-stone-200 bg-white p-10 shadow-2xl"
              >
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="font-serif text-2xl italic">
                    {
                      selectedList.name
                    }
                  </h2>

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

                <p className="mb-6 text-[10px] font-black uppercase tracking-widest text-stone-400">
                  Active
                  Subscribers (
                  {
                    listSubscribers.length
                  }
                  )
                </p>

                <button
                  onClick={() => {
                    setSelectedProfiles(
                      []
                    );

                    setShowSubscriberManager(
                      true
                    );
                  }}
                  className="mb-4 rounded-xl bg-stone-900 px-4 py-2 text-[10px] font-black uppercase text-white"
                >
                  Add
                  Subscribers
                </button>

                <div className="max-h-[400px] space-y-3 overflow-y-auto">
                  {listSubscribers.length ===
                    0 && (
                    <p className="text-sm italic text-stone-400">
                      No subscribers
                      found.
                    </p>
                  )}

                  {listSubscribers.map(
                    (
                      subscriber: any,
                      index: number
                    ) => (
                      <div
                        key={`${subscriber.profile_id}-${index}`}
                        className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4"
                      >
                        <div>
                          <p className="text-sm font-bold text-stone-800">
                            {subscriber
                              .profiles
                              ?.full_name ||
                              subscriber
                                .profiles
                                ?.name ||
                              "Unnamed User"}
                          </p>

                          <p className="text-xs text-stone-500">
                            {subscriber
                              .profiles
                              ?.email ||
                              "No email"}
                          </p>
                        </div>

                        <button
                          onClick={async () => {
                            await removeSubscriber(
                              selectedList.id,
                              subscriber.profile_id
                            );

                            const updated =
                              await loadListSubscribers(
                                selectedList.id
                              );

                            setListSubscribers(
                              updated
                            );
                          }}
                          className="text-xs font-black uppercase text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Delete list "${selectedList.name}"?`
                        )
                      ) {
                        return;
                      }

                      try {
                        await deleteList(
                          selectedList.id
                        );
                      } catch (error) {
                        console.error(
                          error
                        );

                        alert(
                          "Failed to delete list."
                        );

                        return;
                      }

                      setShowListDetailModal(
                        false
                      );

                      setSelectedList(
                        null
                      );
                    }}
                    className="rounded-xl bg-red-600 px-6 py-3 text-[10px] font-black uppercase text-white"
                  >
                    Delete List
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

      {/* ==================================================
          SUBSCRIBER MANAGER
      ================================================== */}

      {showSubscriberManager &&
        selectedList && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 p-6">
            <div className="w-full max-w-2xl rounded-[3rem] bg-white p-8">
              <div className="mb-6 flex justify-between">
                <h3 className="text-xl font-bold">
                  Manage
                  Subscribers
                </h3>

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

              <div className="max-h-[400px] space-y-2 overflow-y-auto">
                {profiles.map(
                  (
                    profile: any
                  ) => (
                    <label
                      key={
                        profile.id
                      }
                      className="flex items-center gap-3 rounded-xl border p-3"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProfiles.includes(
                          profile.id
                        )}
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
                        <p className="font-bold">
                          {profile.full_name ||
                            profile.name}
                        </p>

                        <p className="text-xs text-stone-500">
                          {
                            profile.email
                          }
                        </p>
                      </div>
                    </label>
                  )
                )}
              </div>

              <button
                onClick={async () => {
                  await addSubscribersToList(
                    selectedList.id,
                    selectedProfiles
                  );

                  const result =
                    await loadListSubscribers(
                      selectedList.id
                    );

                  setListSubscribers(
                    result
                  );

                  setShowSubscriberManager(
                    false
                  );
                }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 font-black text-white"
              >
                <Check
                  size={16}
                />

                Save Subscribers
              </button>
            </div>
          </div>
        )}

      {/* ==================================================
          GLOBAL STYLES
      ================================================== */}

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

        [contenteditable="true"]:empty:before {
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}