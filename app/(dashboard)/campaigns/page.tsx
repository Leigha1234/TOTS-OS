"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createBrowserClient } from "@supabase/ssr";

import {
  Calendar,
  Check,
  Clock,
  Edit3,
  Eye,
  Hash,
  Image as ImageIcon,
  Loader2,
  Mail,
  Plus,
  Send,
  Trash2,
  Users,
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

  subject:
    | string
    | null;

  preview_text?:
    | string
    | null;

  content:
    | string
    | null;

  list_id:
    | string
    | null;

  scheduled_for:
    | string
    | null;

  status?:
    | string
    | null;

  sent_at?:
    | string
    | null;

  sent_count?:
    | number
    | null;

  open_count?:
    | number
    | null;

  click_count?:
    | number
    | null;

  sender_name?:
    | string
    | null;

  reply_to?:
    | string
    | null;

  header_image_url?:
    | string
    | null;

  brand_color?:
    | string
    | null;

  cta_text?:
    | string
    | null;

  cta_url?:
    | string
    | null;

  organisation_id?:
    | string
    | null;

  subscriber_lists?: {
    name:
      | string
      | null;
  } | null;
};

type SubscriberList = {
  id: string;
  name: string;
  organisation_id?: string;
};

type ExistingProfile = {
  id: string;

  name?:
    | string
    | null;

  full_name?:
    | string
    | null;

  email?:
    | string
    | null;

  is_subscribed?:
    | boolean
    | null;
};

type ListSubscriber = {
  id: string;

  source:
    | "profile"
    | "manual";

  profileId:
    | string
    | null;

  manualId:
    | string
    | null;

  name:
    | string
    | null;

  email: string;
};

type CompanyBranding = {
  name: string;
  email: string;
  logoUrl: string;
};

type CampaignForm = {
  title: string;
  subject: string;
  previewText: string;
  message: string;
  listId: string;

  scheduledFor:
    string;

  senderName: string;
  replyTo: string;

  headerImageUrl:
    string;

  ctaText: string;
  ctaUrl: string;

  brandColor: string;
};

// ==================================================
// CONSTANTS
// ==================================================

const DEFAULT_BRAND_COLOR =
  "#1c1917";

// ==================================================
// FORM
// ==================================================

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

    headerImageUrl: "",

    ctaText: "",

    ctaUrl: "",

    brandColor:
      DEFAULT_BRAND_COLOR,
  };
}

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

function parseEmails(
  value: string
) {
  return Array.from(
    new Set(
      value
        .split(
          /[\n,;]+/
        )
        .map(
          (email) =>
            email
              .trim()
              .toLowerCase()
        )
        .filter(Boolean)
        .filter(
          isValidEmail
        )
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
    .split(
      /\n{2,}/
    )
    .map(
      (paragraph) =>
        `<p style="font-size:16px;line-height:1.8;margin:0 0 20px;color:#44403c;">${escapeHtml(
          paragraph
        ).replace(
          /\n/g,
          "<br />"
        )}</p>`
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

// ==================================================
// EMAIL HTML
// ==================================================

function buildCampaignHtml({
  message,
  company,
  headerImageUrl,
  ctaText,
  ctaUrl,
  brandColor,
}: {
  message: string;
  company: CompanyBranding;
  headerImageUrl: string;
  ctaText: string;
  ctaUrl: string;
  brandColor: string;
}) {
  return `
    <div style="max-width:640px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#292524;">

      ${
        company.logoUrl
          ? `
            <div style="text-align:center;margin:0 0 32px;">
              <img
                src="${company.logoUrl}"
                alt="${escapeHtml(
                  company.name
                )}"
                style="max-width:130px;max-height:70px;width:auto;height:auto;"
              />
            </div>
          `
          : ""
      }

      ${
        headerImageUrl
          ? `
            <img
              src="${headerImageUrl}"
              alt=""
              style="display:block;width:100%;height:auto;border-radius:20px;margin:0 0 32px;"
            />
          `
          : ""
      }

      <div>
        ${plainTextToHtml(
          message
        )}
      </div>

      ${
        ctaText &&
        ctaUrl
          ? `
            <div style="text-align:center;margin:36px 0;">
              <a
                href="${ctaUrl}"
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

      <div style="margin-top:48px;padding-top:28px;border-top:1px solid #e7e5e4;text-align:center;">

        ${
          company.logoUrl
            ? `
              <img
                src="${company.logoUrl}"
                alt="${escapeHtml(
                  company.name
                )}"
                style="max-width:90px;max-height:50px;width:auto;height:auto;margin-bottom:14px;"
              />
            `
            : ""
        }

        <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#44403c;">
          ${escapeHtml(
            company.name
          )}
        </p>

        ${
          company.email
            ? `
              <p style="margin:8px 0 0;font-size:10px;color:#a8a29e;">
                ${escapeHtml(
                  company.email
                )}
              </p>
            `
            : ""
        }

        <p style="margin:16px 0 0;font-size:8px;color:#d6d3d1;text-transform:uppercase;letter-spacing:0.2em;">
          Powered by TOTS-OS
        </p>
      </div>
    </div>
  `;
}

// ==================================================
// DATE HELPERS
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
    .slice(
      0,
      16
    );
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
}

// ==================================================
// PAGE
// ==================================================

export default function CampaignsPage() {
  // ==================================================
  // SUPABASE
  // ==================================================

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
  // CORE STATE
  // ==================================================

  const [
    organisationId,
    setOrganisationId,
  ] = useState<
    string | null
  >(null);

  const [
    company,
    setCompany,
  ] =
    useState<CompanyBranding>({
      name:
        "Your Company",

      email: "",

      logoUrl: "",
    });

  const [
    campaigns,
    setCampaigns,
  ] = useState<
    Campaign[]
  >([]);

  const [
    lists,
    setLists,
  ] = useState<
    SubscriberList[]
  >([]);

  const [
    profiles,
    setProfiles,
  ] = useState<
    ExistingProfile[]
  >([]);

  const [
    subscriberCounts,
    setSubscriberCounts,
  ] = useState<
    Record<
      string,
      number
    >
  >({});

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  // ==================================================
  // CAMPAIGN UI
  // ==================================================

  const [
    showEditor,
    setShowEditor,
  ] =
    useState(false);

  const [
    showCampaignView,
    setShowCampaignView,
  ] =
    useState(false);

  const [
    selectedCampaign,
    setSelectedCampaign,
  ] = useState<
    Campaign | null
  >(null);

  const [
    editingCampaignId,
    setEditingCampaignId,
  ] = useState<
    string | null
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
  ] = useState<
    string | null
  >(null);

  // ==================================================
  // LIST UI
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
    showListDetails,
    setShowListDetails,
  ] =
    useState(false);

  const [
    selectedList,
    setSelectedList,
  ] = useState<
    SubscriberList | null
  >(null);

  const [
    listSubscribers,
    setListSubscribers,
  ] = useState<
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
  ] = useState<
    string[]
  >([]);

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
  // COMPANY / USER
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
          data:
            profile,
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
          profile
            ?.organisation_id ||
          null;

        setOrganisationId(
          orgId
        );

        let team:
          | any
          | null = null;

        if (orgId) {
          const {
            data:
              teamData,
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

          team =
            teamData ||
            null;
        }

        const companyData =
          {
            name:
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
              "Your Company",

            email:
              profile
                ?.email ||
              "",

            logoUrl:
              profile
                ?.logo_url ||
              profile
                ?.company_logo_url ||
              team
                ?.logo_url ||
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
  }, [
    supabase,
  ]);

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
        data,
        error,
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

      if (error) {
        console.error(
          "Campaign load error:",
          error
        );

        return;
      }

      setCampaigns(
        data || []
      );
    };

  // ==================================================
  // LOAD LISTS
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
          .order(
            "name",
            {
              ascending:
                true,
            }
          );

      if (error) {
        console.error(
          "List load error:",
          error
        );

        return;
      }

      setLists(
        data || []
      );
    };

  // ==================================================
  // LOAD PROFILES
  // ==================================================

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
          "Profiles load error:",
          error
        );

        return;
      }

      setProfiles(
        data || []
      );
    };

  // ==================================================
  // SUBSCRIBER COUNTS
  // ==================================================

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
          "Profile subscriber count error:",
          profileResult.error
        );
      }

      if (
        manualResult.error
      ) {
        console.error(
          "Manual subscriber count error:",
          manualResult.error
        );
      }

      const countMap: Record<
        string,
        Set<string>
      > = {};

      (
        profileResult.data ||
        []
      ).forEach(
        (
          row: any
        ) => {
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

          countMap[
            row.list_id
          ].add(
            `profile-${Math.random()}`
          );
        }
      );

      (
        manualResult.data ||
        []
      ).forEach(
        (
          row: any
        ) => {
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

          countMap[
            row.list_id
          ].add(
            `manual-${Math.random()}`
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
          listId,
          values,
        ]) => {
          finalCounts[
            listId
          ] =
            values.size;
        }
      );

      setSubscriberCounts(
        finalCounts
      );
    };

  // ==================================================
  // INITIAL ORG LOAD
  // ==================================================

  useEffect(() => {
    if (
      !organisationId
    ) {
      return;
    }

    const loadAll =
      async () => {
        setLoading(
          true
        );

        await Promise.all([
          loadCampaigns(),
          loadLists(),
          loadProfiles(),
          loadSubscriberCounts(),
        ]);

        setLoading(
          false
        );
      };

    void loadAll();
  }, [
    organisationId,
  ]);

  // ==================================================
  // CREATE LIST
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
        console.error(
          "Create list error:",
          error
        );

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

      await loadLists();
    };

  // ==================================================
  // LOAD LIST SUBSCRIBERS
  // ==================================================

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
              "organisation_id",
              organisationId
            )
            .eq(
              "list_id",
              listId
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            ),
        ]);

      const combined: ListSubscriber[] =
        [];

      (
        profileResult.data ||
        []
      ).forEach(
        (
          row: any
        ) => {
          const email =
            row.profiles
              ?.email
              ?.trim()
              ?.toLowerCase();

          if (!email) {
            return;
          }

          combined.push({
            id:
              row.profile_id,

            source:
              "profile",

            profileId:
              row.profile_id,

            manualId:
              null,

            name:
              row.profiles
                ?.full_name ||
              row.profiles
                ?.name ||
              null,

            email,
          });
        }
      );

      (
        manualResult.data ||
        []
      ).forEach(
        (
          row: any
        ) => {
          const email =
            row.email
              ?.trim()
              ?.toLowerCase();

          if (!email) {
            return;
          }

          combined.push({
            id:
              row.id,

            source:
              "manual",

            profileId:
              null,

            manualId:
              row.id,

            name:
              null,

            email,
          });
        }
      );

      const seen =
        new Set<string>();

      const unique =
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
        );

      setListSubscribers(
        unique
      );

      setLoadingList(
        false
      );
    };

  // ==================================================
  // OPEN LIST
  // ==================================================

  const openList =
    async (
      list: SubscriberList
    ) => {
      setSelectedList(
        list
      );

      setShowListDetails(
        true
      );

      setListSubscribers(
        []
      );

      await loadListSubscribers(
        list.id
      );
    };

  // ==================================================
  // ADD EXISTING PROFILES
  // ==================================================

  const addSelectedProfiles =
    async (
      listId: string
    ) => {
      if (
        !organisationId ||
        !selectedProfiles.length
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
        console.error(
          "Add profile subscribers error:",
          error
        );

        throw error;
      }
    };

  // ==================================================
  // ADD MANUAL EMAILS
  // ==================================================

  const addManualEmails =
    async (
      listId: string,
      emails: string[]
    ) => {
      if (
        !organisationId ||
        !emails.length
      ) {
        return;
      }

      const clean =
        Array.from(
          new Set(
            emails.map(
              (
                email
              ) =>
                email
                  .trim()
                  .toLowerCase()
            )
          )
        );

      const {
        data:
          existing,
        error:
          existingError,
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

      if (
        existingError
      ) {
        console.error(
          "Check manual email error:",
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

      const existingSet =
        new Set(
          (
            existing ||
            []
          )
            .map(
              (
                row: any
              ) =>
                row.email
                  ?.trim()
                  ?.toLowerCase()
            )
            .filter(Boolean)
        );

      const newEmails =
        clean.filter(
          (email) =>
            !existingSet.has(
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
          (
            email
          ) => ({
            organisation_id:
              organisationId,

            list_id:
              listId,

            email,
          })
        );

      const {
        error:
          insertError,
      } =
        await supabase
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
          "Manual subscriber insert error:",
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

        throw insertError;
      }
    };

  // ==================================================
  // SAVE SUBSCRIBERS
  // ==================================================

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
        !selectedProfiles.length &&
        !parsed.length
      ) {
        alert(
          "Select a contact or enter at least one valid email."
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

        await Promise.all([
          loadListSubscribers(
            selectedList.id
          ),

          loadSubscriberCounts(),
        ]);
      } catch (
        error
      ) {
        console.error(
          "Save subscribers error:",
          error
        );

        alert(
          "Could not save subscribers. Check the browser console for the Supabase error."
        );
      } finally {
        setSavingSubscribers(
          false
        );
      }
    };

  // ==================================================
  // REMOVE SUBSCRIBER
  // ==================================================

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
        const {
          error,
        } =
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

        if (error) {
          console.error(
            error
          );

          return;
        }
      }

      if (
        subscriber.source ===
          "manual" &&
        subscriber.manualId
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              "campaign_list_emails"
            )
            .delete()
            .eq(
              "id",
              subscriber.manualId
            );

        if (error) {
          console.error(
            error
          );

          return;
        }
      }

      await Promise.all([
        loadListSubscribers(
          selectedList.id
        ),

        loadSubscriberCounts(),
      ]);
    };

  // ==================================================
  // DELETE LIST
  // ==================================================

  const deleteList =
    async () => {
      if (
        !selectedList
      ) {
        return;
      }

      if (
        !window.confirm(
          `Delete "${selectedList.name}"?`
        )
      ) {
        return;
      }

      await supabase
        .from(
          "campaigns"
        )
        .update({
          list_id:
            null,
        })
        .eq(
          "list_id",
          selectedList.id
        );

      await supabase
        .from(
          "profile_subscriber_lists"
        )
        .delete()
        .eq(
          "list_id",
          selectedList.id
        );

      await supabase
        .from(
          "campaign_list_emails"
        )
        .delete()
        .eq(
          "list_id",
          selectedList.id
        );

      const {
        error,
      } =
        await supabase
          .from(
            "subscriber_lists"
          )
          .delete()
          .eq(
            "id",
            selectedList.id
          );

      if (error) {
        console.error(
          error
        );

        alert(
          "Could not delete list."
        );

        return;
      }

      setShowListDetails(
        false
      );

      setSelectedList(
        null
      );

      await Promise.all([
        loadLists(),
        loadSubscriberCounts(),
        loadCampaigns(),
      ]);
    };

  // ==================================================
  // NEW CAMPAIGN
  // ==================================================

  const openNewCampaign =
    () => {
      setEditingCampaignId(
        null
      );

      setCampaignForm(
        emptyForm(
          company
        )
      );

      setShowEditor(
        true
      );
    };

  // ==================================================
  // EDIT CAMPAIGN
  // ==================================================

  const editCampaign =
    (
      campaign: Campaign
    ) => {
      setEditingCampaignId(
        campaign.id
      );

      setCampaignForm({
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
          stripHtml(
            campaign.content ||
              ""
          ),

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
      });

      setShowCampaignView(
        false
      );

      setShowEditor(
        true
      );
    };

  // ==================================================
  // CAMPAIGN PAYLOAD
  // ==================================================

  const buildPayload =
    (
      scheduledFor:
        | string
        | null
    ) => {
      return {
        title:
          campaignForm.title.trim(),

        subject:
          campaignForm.subject.trim(),

        preview_text:
          campaignForm.previewText.trim() ||
          null,

        content:
          buildCampaignHtml({
            message:
              campaignForm.message,

            company,

            headerImageUrl:
              campaignForm.headerImageUrl.trim(),

            ctaText:
              campaignForm.ctaText.trim(),

            ctaUrl:
              campaignForm.ctaUrl.trim(),

            brandColor:
              campaignForm.brandColor ||
              DEFAULT_BRAND_COLOR,
          }),

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
          campaignForm.ctaText.trim() ||
          null,

        cta_url:
          campaignForm.ctaUrl.trim() ||
          null,

        organisation_id:
          organisationId,
      };
    };

  // ==================================================
  // VALIDATE CAMPAIGN
  // ==================================================

  const validateCampaign =
    () => {
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
        !campaignForm.message.trim()
      ) {
        alert(
          "Write your email message."
        );

        return false;
      }

      if (
        !campaignForm.listId
      ) {
        alert(
          "Choose a campaign list."
        );

        return false;
      }

      if (
        (subscriberCounts[
          campaignForm.listId
        ] || 0) ===
        0
      ) {
        alert(
          "This campaign list has no recipients."
        );

        return false;
      }

      return true;
    };

  // ==================================================
  // SAVE SCHEDULED CAMPAIGN
  // ==================================================

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
          "Choose a date and time, or use Send Now."
        );

        return;
      }

      const isoDate =
        localInputToIso(
          campaignForm.scheduledFor
        );

      if (!isoDate) {
        alert(
          "Invalid scheduled date."
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
        const payload = {
          ...buildPayload(
            isoDate
          ),

          status:
            "queued",
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

        setShowEditor(
          false
        );

        setEditingCampaignId(
          null
        );

        await loadCampaigns();
      } catch (
        error
      ) {
        console.error(
          "Schedule campaign error:",
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

  // ==================================================
  // SEND API
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

            body:
              JSON.stringify({
                campaignId,
              }),
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

  // ==================================================
  // SEND EXISTING CAMPAIGN
  // ==================================================

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

        setShowCampaignView(
          false
        );

        setSelectedCampaign(
          null
        );

        await loadCampaigns();
      } catch (
        error
      ) {
        const message =
          error instanceof
          Error
            ? error.message
            : "Campaign could not be sent.";

        alert(message);

        console.error(
          error
        );
      } finally {
        setSendingCampaignId(
          null
        );
      }
    };

  // ==================================================
  // SAVE + SEND NOW
  // ==================================================

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
        const payload = {
          ...buildPayload(
            null
          ),

          scheduled_for:
            null,

          status:
            "queued",
        };

        let campaignId:
          | string
          | null = null;

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

        if (!campaignId) {
          throw new Error(
            "Campaign ID was not returned."
          );
        }

        await callSendApi(
          campaignId
        );

        setShowEditor(
          false
        );

        setEditingCampaignId(
          null
        );

        await loadCampaigns();
      } catch (
        error
      ) {
        const message =
          error instanceof
          Error
            ? error.message
            : "Campaign could not be sent.";

        console.error(
          "Send campaign error:",
          error
        );

        alert(message);
      } finally {
        setSavingCampaign(
          false
        );
      }
    };

  // ==================================================
  // DELETE CAMPAIGN
  // ==================================================

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
        console.error(
          error
        );

        alert(
          "Could not delete campaign."
        );

        return;
      }

      setShowCampaignView(
        false
      );

      setSelectedCampaign(
        null
      );

      await loadCampaigns();
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
          `campaigns-page-${organisationId}`
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
            void loadCampaigns();
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
            void loadSubscriberCounts();

            if (
              selectedList
            ) {
              void loadListSubscribers(
                selectedList.id
              );
            }
          }
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
            void loadSubscriberCounts();

            if (
              selectedList
            ) {
              void loadListSubscribers(
                selectedList.id
              );
            }
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
    selectedList?.id,
  ]);

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <Loader2 className="h-7 w-7 animate-spin text-stone-400" />
      </div>
    );
  }

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 text-stone-900 md:p-12">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="mx-auto mb-12 flex max-w-7xl flex-col gap-6 border-b border-stone-200 pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.5em] text-[#8fa07d]">
            Campaign Dashboard
          </p>

          <h1 className="font-serif text-5xl italic tracking-tight md:text-7xl">
            Campaigns
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
            Create an email,
            choose who it goes
            to, then send it now
            or schedule it for
            later.
          </p>
        </div>

        <button
          onClick={
            openNewCampaign
          }
          className="flex items-center justify-center gap-3 rounded-2xl bg-stone-900 px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#a9b897] shadow-lg"
        >
          <Plus
            size={16}
          />

          New Campaign
        </button>
      </header>

      {/* ==================================================
          GRID
      ================================================== */}

      <main className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_360px]">

        {/* ==================================================
            CAMPAIGNS
        ================================================== */}

        <section>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-stone-400">
              Your Campaigns
            </p>

            <span className="rounded-full bg-white px-3 py-2 text-[9px] font-black text-stone-400 shadow-sm">
              {
                campaigns.length
              }
            </span>
          </div>

          <div className="space-y-4">
            {campaigns.length ===
              0 && (
              <div className="rounded-[2.5rem] border border-stone-100 bg-white p-16 text-center shadow-sm">
                <Mail
                  size={28}
                  className="mx-auto mb-5 text-stone-200"
                />

                <p className="font-serif text-xl italic text-stone-300">
                  No campaigns yet.
                </p>
              </div>
            )}

            {campaigns.map(
              (
                campaign
              ) => {
                const status =
                  campaign.status ||
                  "draft";

                return (
                  <button
                    type="button"
                    key={
                      campaign.id
                    }
                    onClick={() => {
                      setSelectedCampaign(
                        campaign
                      );

                      setShowCampaignView(
                        true
                      );
                    }}
                    className="w-full rounded-[2rem] border border-stone-100 bg-white p-6 text-left shadow-sm transition hover:border-stone-200 hover:shadow-md"
                  >
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-black text-stone-800">
                            {
                              campaign.title
                            }
                          </h2>

                          <span className="rounded-full bg-stone-100 px-3 py-1 text-[8px] font-black uppercase tracking-wider text-stone-500">
                            {campaign
                              .subscriber_lists
                              ?.name ||
                              "No list"}
                          </span>
                        </div>

                        <p className="truncate font-serif text-sm italic text-stone-500">
                          {campaign.subject ||
                            "No subject"}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-[9px] font-bold uppercase tracking-wider text-stone-400">
                          {campaign.sent_at ? (
                            <span className="flex items-center gap-1.5">
                              <Check
                                size={11}
                              />

                              Sent{" "}
                              {formatDate(
                                campaign.sent_at
                              )}
                            </span>
                          ) : campaign.scheduled_for ? (
                            <span className="flex items-center gap-1.5">
                              <Calendar
                                size={11}
                              />

                              {formatDate(
                                campaign.scheduled_for
                              )}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Clock
                                size={11}
                              />

                              Not scheduled
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-2 text-[8px] font-black uppercase tracking-wider ${
                            status ===
                            "sent"
                              ? "bg-emerald-100 text-emerald-700"
                              : status ===
                                    "sending" ||
                                  status ===
                                    "processing"
                                ? "bg-amber-100 text-amber-700"
                                : status ===
                                    "failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          {
                            status
                          }
                        </span>

                        <Eye
                          size={16}
                          className="text-stone-300"
                        />
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* ==================================================
            LISTS
        ================================================== */}

        <aside>
          <div className="sticky top-6 rounded-[2.5rem] border border-stone-200 bg-stone-50 p-7 shadow-sm">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#8fa07d]">
                  Campaign Lists
                </p>

                <p className="mt-2 text-xs text-stone-400">
                  Manage your
                  audiences.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowCreateList(
                    true
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
              >
                <Plus
                  size={15}
                />
              </button>
            </div>

            <div className="space-y-2">
              {lists.length ===
                0 && (
                <p className="py-6 text-center font-serif text-sm italic text-stone-300">
                  No lists yet.
                </p>
              )}

              {lists.map(
                (
                  list
                ) => (
                  <button
                    type="button"
                    key={
                      list.id
                    }
                    onClick={() =>
                      void openList(
                        list
                      )
                    }
                    className="flex w-full items-center justify-between rounded-xl px-3 py-4 text-left transition hover:bg-white"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Hash
                        size={12}
                        className="shrink-0 text-stone-300"
                      />

                      <span className="truncate text-xs font-bold text-stone-700">
                        {
                          list.name
                        }
                      </span>
                    </div>

                    <span className="ml-3 shrink-0 rounded-full bg-white px-2.5 py-1 text-[8px] font-black text-stone-400">
                      {subscriberCounts[
                        list.id
                      ] || 0}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* ==================================================
          CREATE LIST
      ================================================== */}

      <AnimatePresence>
        {showCreateList && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
              }}
              className="relative w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl"
            >
              <button
                onClick={() =>
                  setShowCreateList(
                    false
                  )
                }
                className="absolute right-7 top-7 rounded-full p-2 text-stone-400 hover:bg-stone-50"
              >
                <X
                  size={17}
                />
              </button>

              <p className="mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-[#8fa07d]">
                New Audience
              </p>

              <h2 className="mb-6 font-serif text-3xl italic">
                Create a list
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
                placeholder="e.g. Newsletter"
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm outline-none focus:border-stone-900"
              />

              <button
                onClick={() =>
                  void createList()
                }
                className="mt-5 w-full rounded-2xl bg-stone-900 py-4 text-[10px] font-black uppercase tracking-wider text-[#a9b897]"
              >
                Create List
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================
          LIST DETAILS
      ================================================== */}

      <AnimatePresence>
        {showListDetails &&
          selectedList && (
            <div className="fixed inset-0 z-[350] flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                }}
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-stone-100 p-7">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#8fa07d]">
                      Campaign List
                    </p>

                    <h2 className="mt-2 font-serif text-3xl italic">
                      {
                        selectedList.name
                      }
                    </h2>
                  </div>

                  <button
                    onClick={() => {
                      setShowListDetails(
                        false
                      );

                      setSelectedList(
                        null
                      );
                    }}
                    className="rounded-full p-3 hover:bg-stone-50"
                  >
                    <X
                      size={18}
                    />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-7">
                  <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-black text-stone-800">
                        {
                          listSubscribers.length
                        }{" "}
                        subscriber
                        {listSubscribers.length ===
                        1
                          ? ""
                          : "s"}
                      </p>

                      <p className="mt-1 text-[10px] text-stone-400">
                        TOTS-OS contacts
                        and manually added
                        emails.
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
                      className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-wider text-[#a9b897]"
                    >
                      <Plus
                        size={13}
                      />

                      Add Subscribers
                    </button>
                  </div>

                  {loadingList ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="animate-spin text-stone-300" />
                    </div>
                  ) : listSubscribers.length ===
                    0 ? (
                    <div className="rounded-2xl border border-dashed border-stone-200 p-10 text-center">
                      <Mail
                        size={23}
                        className="mx-auto mb-4 text-stone-200"
                      />

                      <p className="font-serif italic text-stone-400">
                        This list is
                        empty.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {listSubscribers.map(
                        (
                          subscriber
                        ) => (
                          <div
                            key={`${subscriber.source}-${subscriber.id}`}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-stone-100 bg-stone-50 p-4"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-bold text-stone-800">
                                  {subscriber.name ||
                                    subscriber.email}
                                </p>

                                {subscriber.source ===
                                  "manual" && (
                                  <span className="rounded-full bg-[#a9b897]/20 px-2 py-1 text-[7px] font-black uppercase tracking-wider text-[#71805f]">
                                    Email
                                  </span>
                                )}
                              </div>

                              {subscriber.name && (
                                <p className="mt-1 truncate text-xs text-stone-500">
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
                              className="shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50"
                            >
                              <Trash2
                                size={14}
                              />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between border-t border-stone-100 bg-stone-50 p-6">
                  <button
                    onClick={() =>
                      void deleteList()
                    }
                    className="text-[9px] font-black uppercase tracking-wider text-red-500"
                  >
                    Delete List
                  </button>

                  <button
                    onClick={() =>
                      setShowListDetails(
                        false
                      )
                    }
                    className="rounded-xl bg-stone-900 px-6 py-3 text-[9px] font-black uppercase tracking-wider text-[#a9b897]"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
      </AnimatePresence>

      {/* ==================================================
          ADD SUBSCRIBERS
      ================================================== */}

      <AnimatePresence>
        {showSubscriberManager &&
          selectedList && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                }}
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-stone-100 p-7">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#8fa07d]">
                      {
                        selectedList.name
                      }
                    </p>

                    <h2 className="mt-2 text-xl font-black">
                      Add Subscribers
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      setShowSubscriberManager(
                        false
                      )
                    }
                    className="rounded-full p-3 hover:bg-stone-50"
                  >
                    <X
                      size={18}
                    />
                  </button>
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto p-7">

                  {/* MANUAL */}

                  <section>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a9b897]/15 text-[#71805f]">
                        <Mail
                          size={16}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-black">
                          Add email
                          addresses
                        </p>

                        <p className="text-[10px] text-stone-400">
                          Paste one or
                          multiple emails.
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
client@business.co.uk
another@email.com`}
                      className="min-h-[140px] w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed outline-none focus:border-stone-900"
                    />

                    <div className="mt-2 flex justify-between text-[9px] text-stone-400">
                      <span>
                        Separate with
                        commas, lines or
                        semicolons.
                      </span>

                      {manualEmails.trim() && (
                        <span className="font-black text-[#71805f]">
                          {
                            parseEmails(
                              manualEmails
                            ).length
                          }{" "}
                          valid
                        </span>
                      )}
                    </div>
                  </section>

                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-stone-100" />

                    <span className="text-[8px] font-black uppercase tracking-wider text-stone-300">
                      Existing contacts
                    </span>

                    <div className="h-px flex-1 bg-stone-100" />
                  </div>

                  {/* EXISTING */}

                  <section className="space-y-2">
                    {profiles.length ===
                      0 && (
                      <p className="py-6 text-center text-xs italic text-stone-400">
                        No subscribed
                        contacts found.
                      </p>
                    )}

                    {profiles.map(
                      (
                        profile
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
                            className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
                              checked
                                ? "border-[#a9b897] bg-[#a9b897]/10"
                                : "border-stone-100 bg-stone-50"
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

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold">
                                {profile.full_name ||
                                  profile.name ||
                                  profile.email ||
                                  "Contact"}
                              </p>

                              <p className="truncate text-xs text-stone-500">
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

                <div className="border-t border-stone-100 bg-stone-50 p-6">
                  <button
                    disabled={
                      savingSubscribers
                    }
                    onClick={() =>
                      void saveSubscribers()
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-[10px] font-black uppercase tracking-wider text-[#a9b897] disabled:opacity-50"
                  >
                    {savingSubscribers ? (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <Check
                        size={15}
                      />
                    )}

                    {savingSubscribers
                      ? "Saving..."
                      : "Save Subscribers"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
      </AnimatePresence>

      {/* ==================================================
          CAMPAIGN EDITOR
      ================================================== */}

      <AnimatePresence>
        {showEditor && (
          <div className="fixed inset-0 z-[600] overflow-y-auto bg-stone-900/60 p-3 backdrop-blur-xl md:p-6">
            <motion.div
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 25,
              }}
              className="relative mx-auto min-h-full w-full max-w-5xl rounded-[2.5rem] bg-[#faf9f6] shadow-2xl md:min-h-0"
            >
              <div className="flex items-center justify-between border-b border-stone-200 p-6 md:p-8">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.35em] text-[#8fa07d]">
                    {editingCampaignId
                      ? "Edit Campaign"
                      : "New Campaign"}
                  </p>

                  <h2 className="mt-2 font-serif text-3xl italic">
                    Write your email
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setShowEditor(
                      false
                    )
                  }
                  className="rounded-full border border-stone-200 bg-white p-3"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1fr_300px]">

                {/* MAIN FORM */}

                <div className="space-y-6">

                  {/* CAMPAIGN NAME */}

                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-stone-400">
                      Campaign Name
                    </label>

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
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="e.g. August Newsletter"
                      className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-sm font-bold outline-none focus:border-stone-900"
                    />
                  </div>

                  {/* SUBJECT */}

                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-stone-400">
                      Email Subject
                    </label>

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
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="What will people see in their inbox?"
                      className="w-full rounded-2xl border border-stone-200 bg-white p-4 font-serif text-xl italic outline-none focus:border-stone-900"
                    />
                  </div>

                  {/* PREVIEW */}

                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-stone-400">
                      Preview Text
                    </label>

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
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="Optional short line shown after the subject"
                      className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-sm outline-none focus:border-stone-900"
                    />
                  </div>

                  {/* IMAGE */}

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-stone-400">
                      <ImageIcon
                        size={12}
                      />

                      Header Image
                      <span className="font-medium normal-case tracking-normal">
                        (optional)
                      </span>
                    </label>

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
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-sm outline-none focus:border-stone-900"
                    />

                    {campaignForm.headerImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          campaignForm.headerImageUrl
                        }
                        alt=""
                        className="mt-4 max-h-64 w-full rounded-2xl object-cover"
                      />
                    )}
                  </div>

                  {/* MESSAGE */}

                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-stone-400">
                      Message
                    </label>

                    <textarea
                      value={
                        campaignForm.message
                      }
                      onChange={(
                        event
                      ) =>
                        setCampaignForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            message:
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder={`Hi,

We wanted to share a quick update...

Write your email exactly how you want it to read.`}
                      className="min-h-[360px] w-full resize-y rounded-[2rem] border border-stone-200 bg-white p-6 text-base leading-8 outline-none focus:border-stone-900"
                    />
                  </div>

                  {/* CTA */}

                  <div className="rounded-[2rem] border border-stone-200 bg-white p-5">
                    <p className="mb-4 text-[9px] font-black uppercase tracking-wider text-stone-400">
                      Optional Button
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={
                          campaignForm.ctaText
                        }
                        onChange={(
                          event
                        ) =>
                          setCampaignForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              ctaText:
                                event.target
                                  .value,
                            })
                          )
                        }
                        placeholder="Button text"
                        className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-sm outline-none"
                      />

                      <input
                        value={
                          campaignForm.ctaUrl
                        }
                        onChange={(
                          event
                        ) =>
                          setCampaignForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              ctaUrl:
                                event.target
                                  .value,
                            })
                          )
                        }
                        placeholder="https://..."
                        className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SIDEBAR */}

                <aside className="space-y-5">

                  {/* AUDIENCE */}

                  <div className="rounded-[2rem] border border-stone-200 bg-white p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100">
                        <Users
                          size={15}
                        />
                      </div>

                      <div>
                        <p className="text-xs font-black">
                          Audience
                        </p>

                        <p className="text-[9px] text-stone-400">
                          Who receives
                          this email?
                        </p>
                      </div>
                    </div>

                    <select
                      value={
                        campaignForm.listId
                      }
                      onChange={(
                        event
                      ) =>
                        setCampaignForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            listId:
                              event.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none"
                    >
                      <option value="">
                        Choose list...
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

                    {campaignForm.listId && (
                      <p className="mt-3 text-[9px] text-stone-400">
                        This campaign
                        currently has{" "}
                        <strong className="text-stone-700">
                          {subscriberCounts[
                            campaignForm.listId
                          ] || 0}
                        </strong>{" "}
                        recipient(s).
                      </p>
                    )}
                  </div>

                  {/* SCHEDULE */}

                  <div className="rounded-[2rem] border border-stone-200 bg-white p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100">
                        <Calendar
                          size={15}
                        />
                      </div>

                      <div>
                        <p className="text-xs font-black">
                          Schedule
                        </p>

                        <p className="text-[9px] text-stone-400">
                          Leave blank
                          for Send Now.
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
                              event.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none"
                    />
                  </div>

                  {/* SENDER */}

                  <div className="rounded-[2rem] border border-stone-200 bg-white p-5">
                    <p className="mb-4 text-[9px] font-black uppercase tracking-wider text-stone-400">
                      Sender
                    </p>

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
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="Sender name"
                      className="mb-3 w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none"
                    />

                    <input
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
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="Reply-to email"
                      className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none"
                    />
                  </div>

                  {/* BRAND */}

                  <div className="rounded-[2rem] border border-stone-200 bg-white p-5">
                    <p className="mb-3 text-[9px] font-black uppercase tracking-wider text-stone-400">
                      Button Colour
                    </p>

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
                                event.target
                                  .value,
                            })
                          )
                        }
                        className="h-10 w-10 cursor-pointer rounded-lg"
                      />

                      <span className="text-xs font-mono text-stone-500">
                        {
                          campaignForm.brandColor
                        }
                      </span>
                    </div>
                  </div>
                </aside>
              </div>

              {/* ACTIONS */}

              <div className="flex flex-col gap-3 border-t border-stone-200 bg-white p-6 md:flex-row md:justify-end md:rounded-b-[2.5rem]">
                <button
                  onClick={() =>
                    setShowEditor(
                      false
                    )
                  }
                  className="rounded-2xl bg-stone-100 px-7 py-4 text-[10px] font-black uppercase tracking-wider text-stone-500"
                >
                  Cancel
                </button>

                {campaignForm.scheduledFor && (
                  <button
                    disabled={
                      savingCampaign
                    }
                    onClick={() =>
                      void scheduleCampaign()
                    }
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#a9b897] px-7 py-4 text-[10px] font-black uppercase tracking-wider text-stone-900 disabled:opacity-50"
                  >
                    {savingCampaign ? (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <Calendar
                        size={15}
                      />
                    )}

                    Schedule
                  </button>
                )}

                <button
                  disabled={
                    savingCampaign
                  }
                  onClick={() =>
                    void saveAndSendNow()
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-8 py-4 text-[10px] font-black uppercase tracking-wider text-[#a9b897] disabled:opacity-50"
                >
                  {savingCampaign ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Send
                      size={15}
                    />
                  )}

                  Send Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================
          CAMPAIGN VIEW
      ================================================== */}

      <AnimatePresence>
        {showCampaignView &&
          selectedCampaign && (
            <div className="fixed inset-0 z-[550] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-lg">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                }}
                className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
              >
                <div className="flex items-start justify-between border-b border-stone-100 p-7">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#8fa07d]">
                      Campaign
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      {
                        selectedCampaign.title
                      }
                    </h2>

                    <p className="mt-2 font-serif italic text-stone-500">
                      {
                        selectedCampaign.subject
                      }
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setShowCampaignView(
                        false
                      )
                    }
                    className="rounded-full p-3 hover:bg-stone-50"
                  >
                    <X
                      size={18}
                    />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#faf9f6] p-5 md:p-8">
                  <div
                    className="mx-auto max-w-2xl rounded-[2rem] bg-white p-7 shadow-sm md:p-10"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedCampaign.content ||
                        "",
                    }}
                  />
                </div>

                <div className="flex flex-wrap gap-3 border-t border-stone-100 bg-white p-6">
                  <button
                    onClick={() =>
                      editCampaign(
                        selectedCampaign
                      )
                    }
                    className="flex items-center gap-2 rounded-xl bg-stone-100 px-5 py-3 text-[9px] font-black uppercase tracking-wider"
                  >
                    <Edit3
                      size={13}
                    />

                    Edit
                  </button>

                  <button
                    disabled={
                      sendingCampaignId ===
                        selectedCampaign.id ||
                      selectedCampaign.status ===
                        "sent"
                    }
                    onClick={() =>
                      void sendExistingCampaign(
                        selectedCampaign.id
                      )
                    }
                    className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-[9px] font-black uppercase tracking-wider text-white disabled:opacity-50"
                  >
                    {sendingCampaignId ===
                    selectedCampaign.id ? (
                      <Loader2
                        size={13}
                        className="animate-spin"
                      />
                    ) : (
                      <Send
                        size={13}
                      />
                    )}

                    {selectedCampaign.status ===
                    "sent"
                      ? "Sent"
                      : "Send Now"}
                  </button>

                  <button
                    onClick={() =>
                      void deleteCampaign(
                        selectedCampaign
                      )
                    }
                    className="ml-auto flex items-center gap-2 rounded-xl bg-red-50 px-5 py-3 text-[9px] font-black uppercase tracking-wider text-red-600"
                  >
                    <Trash2
                      size={13}
                    />

                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
      </AnimatePresence>
    </div>
  );
}