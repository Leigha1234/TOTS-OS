"use client";

import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createBrowserClient } from "@supabase/ssr";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Facebook,
  Film,
  Hash,
  Image as ImageIcon,
  Instagram,
  Layers,
  Lightbulb,
  Linkedin,
  Loader2,
  Music,
  Plus,
  RefreshCcw,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";

import { toast } from "sonner";

// ============================================================
// TYPES
// ============================================================

interface SocialPost {
  id: string;
  caption: string;
  platform: string;
  hashtags?: string | null;
  media_url?: string | null;
  scheduled_for: string;
  status: string;
  format: string;
  platform_post_id?: string | null;
  error?: string | null;
  last_error?: string | null;
  attempts?: number;
  analytics?: unknown;
  platform_response?: unknown;
}

interface SocialAccount {
  id: string;
  platform: string;
  platform_user_id?: string | null;
  page_id?: string | null;
  page_name?: string | null;
  page_access_token?: string | null;
  instagram_business_account_id?: string | null;
  display_name?: string | null;
}

interface BusinessProfile {
  name: string;
  description: string;
  audience: string;
  services: string;
  tone: string;
  goals: string;
  rawContext: string;
}

interface ContentConcept {
  id: string;
  title: string;
  hook: string;
  whyItWorks: string;

  format:
    | "Reel"
    | "TikTok"
    | "Post"
    | "Carousel";

  platforms: string[];
  script: string;
  caption: string;
  hashtags: string;
  recommendedAudio: string;
}

type PlatformId =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "linkedin";

// ============================================================
// POST STATUS
// ============================================================

const POST_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  PROCESSING: "processing",
  PUBLISHED: "published",
  FAILED: "failed",
} as const;

// ============================================================
// PLATFORM OPTIONS
// ============================================================

const PLATFORM_OPTIONS: Array<{
  id: PlatformId;
  name: string;
  description: string;
}> = [
  {
    id: "facebook",
    name: "Facebook",
    description: "Page posts",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Posts & Reels",
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Video",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Posts",
  },
];

// ============================================================
// HELPERS
// ============================================================

const isSameDay = (
  dateStr: string,
  day: number,
  month: number,
  year: number
) => {
  if (!dateStr) {
    return false;
  }

  const date = new Date(
    dateStr
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }

  return (
    date.getDate() === day &&
    date.getMonth() === month &&
    date.getFullYear() === year
  );
};

// ============================================================

const getStatusColor = (
  status?: string
) => {
  switch (
    status || ""
  ) {
    case "published":
      return "bg-emerald-500";

    case "scheduled":
      return "bg-blue-400";

    case "processing":
      return "bg-amber-400";

    case "failed":
      return "bg-red-500";

    case "draft":
      return "bg-stone-300";

    default:
      return "bg-stone-200";
  }
};

// ============================================================

const getStatusTextColor = (
  status?: string
) => {
  switch (
    status || ""
  ) {
    case "published":
      return "text-emerald-600";

    case "scheduled":
      return "text-blue-500";

    case "processing":
      return "text-amber-600";

    case "failed":
      return "text-red-500";

    default:
      return "text-stone-400";
  }
};

// ============================================================

const isVideoUrl = (
  url?: string | null
) => {
  if (!url) {
    return false;
  }

  const cleanUrl =
    url
      .toLowerCase()
      .split("?")[0];

  return [
    ".mp4",
    ".mov",
    ".m4v",
    ".webm",
    ".avi",
  ].some(
    (extension) =>
      cleanUrl.endsWith(
        extension
      )
  );
};

// ============================================================

const cleanPlatform = (
  value?: string | null
) => {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
};

// ============================================================

const compactText = (
  values: unknown[]
) => {
  return values
    .filter(
      (
        value
      ): value is string =>
        typeof value ===
          "string" &&
        Boolean(
          value.trim()
        )
    )
    .map(
      (value) =>
        value.trim()
    )
    .filter(
      (
        value,
        index,
        array
      ) =>
        array.indexOf(
          value
        ) === index
    )
    .join("\n");
};

// ============================================================
// PAGE
// ============================================================

export default function SocialStudioUnified() {
  // ==========================================================
  // VIEW
  // ==========================================================

  const [
    viewMode,
    setViewMode,
  ] = useState<
    "create" | "ideas" | "planner"
  >("create");

  const [
    status,
    setStatus,
  ] =
    useState(
      "Ready"
    );

  const [
    currentDate,
    setCurrentDate,
  ] =
    useState(
      new Date()
    );

  // ==========================================================
  // USER / BUSINESS
  // ==========================================================

  const [
    user,
    setUser,
  ] =
    useState<any>(
      null
    );

  const [
    businessProfile,
    setBusinessProfile,
  ] =
    useState<BusinessProfile>({
      name:
        "Your business",

      description:
        "",

      audience:
        "",

      services:
        "",

      tone:
        "",

      goals:
        "",

      rawContext:
        "",
    });

  const [
    businessLoading,
    setBusinessLoading,
  ] =
    useState(
      false
    );

  const [
    businessLoaded,
    setBusinessLoaded,
  ] =
    useState(
      false
    );

  // ==========================================================
  // IDEAS
  // ==========================================================

  const [
    generatedConcepts,
    setGeneratedConcepts,
  ] =
    useState<
      ContentConcept[]
    >([]);

  const [
    generatingIdeas,
    setGeneratingIdeas,
  ] =
    useState(
      false
    );

  const [
    selectedConcept,
    setSelectedConcept,
  ] =
    useState<
      ContentConcept | null
    >(
      null
    );

  // ==========================================================
  // COMPOSER
  // ==========================================================

  const [
    caption,
    setCaption,
  ] =
    useState(
      ""
    );

  const [
    hashtags,
    setHashtags,
  ] =
    useState(
      ""
    );

  const [
    platforms,
    setPlatforms,
  ] =
    useState<
      PlatformId[]
    >([]);

  const [
    format,
    setFormat,
  ] =
    useState(
      "Post"
    );

  const [
    scheduledTime,
    setScheduledTime,
  ] =
    useState(
      ""
    );

  const [
    metaScript,
    setMetaScript,
  ] =
    useState(
      ""
    );

  const [
    metaAudio,
    setMetaAudio,
  ] =
    useState(
      ""
    );

  // ==========================================================
  // MEDIA
  // ==========================================================

  const [
    mediaFile,
    setMediaFile,
  ] =
    useState<
      File | null
    >(
      null
    );

  const [
    mediaPreview,
    setMediaPreview,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    isUploadingMedia,
    setIsUploadingMedia,
  ] =
    useState(
      false
    );

  // ==========================================================
  // POSTING
  // ==========================================================

  const [
    isPosting,
    setIsPosting,
  ] =
    useState(
      false
    );

  // ==========================================================
  // POSTS
  // ==========================================================

  const [
    posts,
    setPosts,
  ] =
    useState<
      SocialPost[]
    >([]);

  const [
    accounts,
    setAccounts,
  ] =
    useState<
      SocialAccount[]
    >([]);

  const [
    previewPost,
    setPreviewPost,
  ] =
    useState<
      SocialPost | null
    >(
      null
    );

  // ==========================================================
  // DAY DRAWER
  // ==========================================================

  const [
    isDayViewOpen,
    setIsDayViewOpen,
  ] =
    useState(
      false
    );

  const [
    selectedDayPosts,
    setSelectedDayPosts,
  ] =
    useState<
      SocialPost[]
    >([]);

  // ==========================================================
  // SUPABASE
  // ==========================================================

  const supabase =
    useMemo(
      () => {
        const url =
          process.env
            .NEXT_PUBLIC_SUPABASE_URL;

        const key =
          process.env
            .NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
          !url ||
          !key
        ) {
          console.error(
            "Missing Supabase environment variables"
          );
        }

        return createBrowserClient(
          url || "",
          key || ""
        );
      },
      []
    );

  // ==========================================================
  // AUTH
  // ==========================================================

  useEffect(
    () => {
      const initialise =
        async () => {
          const {
            data,
            error,
          } =
            await supabase.auth.getUser();

          if (
            error ||
            !data.user
          ) {
            console.error(
              "Social Studio auth error:",
              error
            );

            setStatus(
              "Not authenticated"
            );

            return;
          }

          setUser(
            data.user
          );
        };

      void initialise();
    },
    [
      supabase,
    ]
  );

  // ==========================================================
  // LOAD BUSINESS KNOWLEDGE
  // ==========================================================

  const loadBusinessKnowledge =
    useCallback(
      async () => {
        if (
          !user?.id
        ) {
          return;
        }

        setBusinessLoading(
          true
        );

        try {
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
              .select(
                "*"
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (
            profileError
          ) {
            console.warn(
              "Profile business context error:",
              profileError
            );
          }

          const organisationId =
            profile
              ?.organisation_id ||
            null;

          let team:
            any =
            null;

          if (
            organisationId
          ) {
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
                .select(
                  "*"
                )
                .eq(
                  "organisation_id",
                  organisationId
                )
                .limit(
                  1
                )
                .maybeSingle();

            if (
              teamError
            ) {
              console.warn(
                "Team business context error:",
                teamError
              );
            }

            team =
              teamData ||
              null;
          }

          const businessName =
            team
              ?.company_name ||
            team
              ?.name ||
            profile
              ?.company_name ||
            profile
              ?.business_name ||
            profile
              ?.company ||
            profile
              ?.full_name ||
            profile
              ?.name ||
            "Your business";

          const description =
            compactText([
              profile
                ?.clarity_summary,

              profile
                ?.business_summary,

              profile
                ?.business_description,

              profile
                ?.business_context,

              profile
                ?.bio,

              team
                ?.description,

              team
                ?.business_description,
            ]);

          const audience =
            compactText([
              profile
                ?.target_audience,

              profile
                ?.ideal_customer,

              profile
                ?.ideal_client,

              profile
                ?.audience,

              team
                ?.target_audience,
            ]);

          const services =
            compactText([
              profile
                ?.services,

              profile
                ?.products_services,

              profile
                ?.offer,

              profile
                ?.offering,

              team
                ?.services,
            ]);

          const tone =
            compactText([
              profile
                ?.brand_tone,

              profile
                ?.tone_of_voice,

              profile
                ?.brand_voice,

              team
                ?.brand_tone,
            ]);

          const goals =
            compactText([
              profile
                ?.business_goals,

              profile
                ?.goals,

              profile
                ?.clarity_goals,

              team
                ?.goals,
            ]);

          let storedClarity =
            "";

          try {
            storedClarity =
              window.localStorage.getItem(
                "tots-clarity-business-context"
              ) ||
              "";
          } catch {
            storedClarity =
              "";
          }

          const rawContext =
            compactText([
              `Business: ${businessName}`,

              description
                ? `About: ${description}`
                : "",

              audience
                ? `Audience: ${audience}`
                : "",

              services
                ? `Products or services: ${services}`
                : "",

              tone
                ? `Brand voice: ${tone}`
                : "",

              goals
                ? `Goals: ${goals}`
                : "",

              storedClarity,
            ]);

          setBusinessProfile({
            name:
              businessName,

            description,

            audience,

            services,

            tone,

            goals,

            rawContext,
          });

          setBusinessLoaded(
            true
          );
        } catch (
          error
        ) {
          console.error(
            "Business context load error:",
            error
          );

          setBusinessLoaded(
            true
          );
        } finally {
          setBusinessLoading(
            false
          );
        }
      },
      [
        supabase,
        user?.id,
      ]
    );

  useEffect(
    () => {
      if (
        !user?.id
      ) {
        return;
      }

      void loadBusinessKnowledge();
    },
    [
      user?.id,
      loadBusinessKnowledge,
    ]
  );

  // ==========================================================
  // LOAD POSTS
  // ==========================================================

  const syncPosts =
    useCallback(
      async () => {
        if (
          !user?.id
        ) {
          return;
        }

        setStatus(
          "Syncing"
        );

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "socials"
            )
            .select(`
              id,
              caption,
              platform,
              hashtags,
              media_url,
              scheduled_for,
              status,
              format,
              platform_post_id,
              error,
              last_error,
              attempts,
              analytics,
              platform_response
            `)
            .eq(
              "user_id",
              user.id
            )
            .order(
              "scheduled_for",
              {
                ascending:
                  true,
              }
            );

        if (
          error
        ) {
          console.error(
            "Social posts fetch error:",
            error
          );

          toast.error(
            `Could not load posts: ${error.message}`
          );

          setStatus(
            "Ready"
          );

          return;
        }

        setPosts(
          (
            data ||
            []
          ) as SocialPost[]
        );

        setStatus(
          "Ready"
        );
      },
      [
        supabase,
        user?.id,
      ]
    );

  useEffect(
    () => {
      if (
        !user?.id
      ) {
        return;
      }

      void syncPosts();
    },
    [
      user?.id,
      syncPosts,
    ]
  );

  // ==========================================================
  // LOAD CONNECTED ACCOUNTS
  // ==========================================================

  const loadAccounts =
    useCallback(
      async () => {
        if (
          !user?.id
        ) {
          setAccounts(
            []
          );

          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "social_accounts"
            )
            .select(`
              id,
              platform,
              platform_user_id,
              page_id,
              page_name,
              page_access_token,
              instagram_business_account_id,
              display_name
            `)
            .eq(
              "user_id",
              user.id
            );

        if (
          error
        ) {
          console.error(
            "Social accounts error:",
            error
          );

          toast.error(
            `Could not load social connections: ${error.message}`
          );

          return;
        }

        setAccounts(
          (
            data ||
            []
          ) as SocialAccount[]
        );
      },
      [
        supabase,
        user?.id,
      ]
    );

  useEffect(
    () => {
      void loadAccounts();
    },
    [
      loadAccounts,
    ]
  );

  // ==========================================================
  // REFRESH CONNECTIONS ON FOCUS
  // ==========================================================

  useEffect(
    () => {
      const handleFocus =
        () => {
          void loadAccounts();
        };

      window.addEventListener(
        "focus",
        handleFocus
      );

      return () => {
        window.removeEventListener(
          "focus",
          handleFocus
        );
      };
    },
    [
      loadAccounts,
    ]
  );

  // ==========================================================
  // REALTIME
  // ==========================================================

  useEffect(
    () => {
      if (
        !user?.id
      ) {
        return;
      }

      const channel =
        supabase
          .channel(
            `socials-page-${user.id}`
          )
          .on(
            "postgres_changes",
            {
              event:
                "*",

              schema:
                "public",

              table:
                "socials",

              filter:
                `user_id=eq.${user.id}`,
            },
            () => {
              void syncPosts();
            }
          )
          .subscribe();

      return () => {
        void supabase.removeChannel(
          channel
        );
      };
    },
    [
      supabase,
      user?.id,
      syncPosts,
    ]
  );

  // ==========================================================
  // MEDIA
  // ==========================================================

  const handleMediaUpload =
    (
      event:
        ChangeEvent<HTMLInputElement>
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

      if (
        mediaPreview
      ) {
        URL.revokeObjectURL(
          mediaPreview
        );
      }

      setMediaFile(
        file
      );

      setMediaPreview(
        URL.createObjectURL(
          file
        )
      );

      toast.success(
        `${file.name} ready`
      );
    };

  const clearMedia =
    () => {
      if (
        mediaPreview
      ) {
        URL.revokeObjectURL(
          mediaPreview
        );
      }

      setMediaFile(
        null
      );

      setMediaPreview(
        null
      );
    };

  // ==========================================================
  // CONNECTION HELPERS
  // ==========================================================

  const metaAccount =
    useMemo(
      () => {
        return accounts.find(
          (
            account
          ) => {
            const platform =
              cleanPlatform(
                account.platform
              );

            return (
              platform ===
                "meta" ||
              platform ===
                "facebook" ||
              platform ===
                "instagram"
            );
          }
        );
      },
      [
        accounts,
      ]
    );

  const facebookConnected =
    Boolean(
      metaAccount
        ?.page_id &&
      metaAccount
        ?.page_access_token
    );

  const instagramConnected =
    Boolean(
      metaAccount
        ?.instagram_business_account_id &&
      metaAccount
        ?.page_access_token
    );

  const tiktokConnected =
    accounts.some(
      (
        account
      ) =>
        cleanPlatform(
          account.platform
        ) ===
        "tiktok"
    );

  const linkedinConnected =
    accounts.some(
      (
        account
      ) =>
        cleanPlatform(
          account.platform
        ) ===
        "linkedin"
    );

  const isConnected =
    (
      platform:
        string
    ) => {
      switch (
        platform
      ) {
        case "facebook":
          return facebookConnected;

        case "instagram":
          return instagramConnected;

        case "tiktok":
          return tiktokConnected;

        case "linkedin":
          return linkedinConnected;

        default:
          return false;
      }
    };

  const getPlatformConnectionText =
    (
      platform:
        PlatformId
    ) => {
      if (
        platform ===
        "facebook" &&
        facebookConnected
      ) {
        return (
          metaAccount
            ?.page_name ||
          "Facebook Page connected"
        );
      }

      if (
        platform ===
        "instagram" &&
        instagramConnected
      ) {
        return "Instagram Business connected";
      }

      if (
        platform ===
        "tiktok" &&
        tiktokConnected
      ) {
        return "TikTok connected";
      }

      if (
        platform ===
        "linkedin" &&
        linkedinConnected
      ) {
        return "LinkedIn connected";
      }

      return "Not connected";
    };

  // ==========================================================
  // TOGGLE PLATFORM
  // ==========================================================

  const togglePlatform =
    (
      platform:
        PlatformId
    ) => {
      if (
        !isConnected(
          platform
        )
      ) {
        const label =
          PLATFORM_OPTIONS.find(
            (
              item
            ) =>
              item.id ===
              platform
          )?.name ||
          platform;

        toast.error(
          `${label} is not connected yet`
        );

        return;
      }

      setPlatforms(
        (
          previous
        ) =>
          previous.includes(
            platform
          )
            ? previous.filter(
                (
                  item
                ) =>
                  item !==
                  platform
              )
            : [
                ...previous,
                platform,
              ]
      );
    };

  // ==========================================================
  // VALIDATE CONNECTIONS
  // ==========================================================

  const validateConnections =
    () => {
      for (
        const platform of
        platforms
      ) {
        if (
          !isConnected(
            platform
          )
        ) {
          const label =
            PLATFORM_OPTIONS.find(
              (
                item
              ) =>
                item.id ===
                platform
            )?.name ||
            platform;

          toast.error(
            `${label} is not connected`
          );

          return false;
        }
      }

      return true;
    };

  // ==========================================================
  // IDEA GENERATION
  // ==========================================================

  const generateBusinessIdeas =
    async () => {
      setGeneratingIdeas(
        true
      );

      setStatus(
        "Creating ideas..."
      );

      try {
        if (
          !businessLoaded
        ) {
          await loadBusinessKnowledge();
        }

        const name =
          businessProfile
            .name ||
          "your business";

        const audience =
          businessProfile
            .audience ||
          "your ideal customers";

        const services =
          businessProfile
            .services ||
          businessProfile
            .description ||
          "what your business offers";

        const now =
          Date.now();

        const concepts:
          ContentConcept[] =
          [
            {
              id:
                `idea-${now}-1`,

              title:
                "The problem nobody talks about",

              hook:
                `Nobody talks enough about this problem in ${name}...`,

              whyItWorks:
                "Problem-led content makes the audience feel understood before you introduce the solution.",

              format:
                "TikTok",

              platforms: [
                "tiktok",
                "instagram",
              ],

              script:
                `HOOK:\n“Can we talk about something nobody warns you about?”\n\nBODY:\nTalk about one frustrating problem ${audience} regularly experiences before finding ${name}.\n\nExplain why the usual solution does not always work.\n\nThen naturally introduce how ${services} helps make that problem easier.\n\nCTA:\n“Follow for more honest advice about this.”`,

              caption:
                `Can we normalise talking about the part nobody warns you about? 👀\n\nThere is usually a much simpler way to deal with the problem — and that is exactly what we are trying to make easier at ${name}.`,

              hashtags:
                "#smallbusiness #businesstips #businessowner #entrepreneur #behindthebusiness",

              recommendedAudio:
                "Original talking audio or a quiet trending background sound.",
            },

            {
              id:
                `idea-${now}-2`,

              title:
                "3 things your customer needs to know",

              hook:
                `3 things I wish every ${audience} knew...`,

              whyItWorks:
                "Educational list content is easy to save, share and repurpose into carousels.",

              format:
                "Carousel",

              platforms: [
                "instagram",
                "facebook",
                "linkedin",
              ],

              script:
                `SLIDE 1:\n3 things I wish every customer knew.\n\nSLIDE 2:\nA common misconception about ${services}.\n\nSLIDE 3:\nA mistake customers often make before working with ${name}.\n\nSLIDE 4:\nWhat they should focus on instead.\n\nSLIDE 5:\nA simple CTA to save the post or contact ${name}.`,

              caption:
                `If you are trying to get better results, these are the things we wish more people knew before getting started.\n\nSave this for later — it might save you a lot of time.`,

              hashtags:
                "#businesstips #smallbusinessuk #marketingtips #education #businessadvice",

              recommendedAudio:
                "No audio needed. Use as a clean static carousel.",
            },

            {
              id:
                `idea-${now}-3`,

              title:
                "Behind the business",

              hook:
                `What running ${name} actually looks like behind the scenes...`,

              whyItWorks:
                "Founder and behind-the-scenes content builds familiarity and trust without feeling overly promotional.",

              format:
                "Reel",

              platforms: [
                "instagram",
                "facebook",
                "tiktok",
              ],

              script:
                `CLIP 1:\nOpening laptop / starting work.\nText: “What running ${name} actually looks like...”\n\nCLIP 2:\nA real piece of work related to ${services}.\n\nCLIP 3:\nSomething slightly chaotic or relatable.\n\nCLIP 4:\nThe finished outcome.\n\nENDING TEXT:\n“The polished result vs everything that happened behind it.”`,

              caption:
                `The finished result always looks calm. The behind-the-scenes part? Slightly different 😂\n\nA little look at what actually goes into running ${name}.`,

              hashtags:
                "#behindthescenes #businessowner #smallbusiness #dayinthelife #buildinpublic",

              recommendedAudio:
                "Use a current light lifestyle / day-in-the-life trend.",
            },

            {
              id:
                `idea-${now}-4`,

              title:
                "Stop doing this",

              hook:
                `If you are ${audience}, stop doing this...`,

              whyItWorks:
                "A strong contrarian hook creates curiosity while letting the business demonstrate expertise.",

              format:
                "TikTok",

              platforms: [
                "tiktok",
                "instagram",
              ],

              script:
                `HOOK:\n“If you are trying to improve this, stop doing this first.”\n\nBODY:\nChoose one common mistake relating to ${services}.\n\nExplain what people normally do.\n\nExplain why it creates more work or worse results.\n\nGive one practical alternative.\n\nCTA:\n“Save this so you remember it later.”`,

              caption:
                "Sometimes doing more is not the answer. Sometimes you need to stop doing the thing creating the problem in the first place.",

              hashtags:
                "#businessadvice #tips #smallbusinessowner #learnontiktok #businessgrowth",

              recommendedAudio:
                "Original audio. Keep the spoken hook clear.",
            },

            {
              id:
                `idea-${now}-5`,

              title:
                "The customer transformation",

              hook:
                "Before → after, but make it about the result.",

              whyItWorks:
                "Outcome-led content shows value without needing a hard sales pitch.",

              format:
                "Reel",

              platforms: [
                "instagram",
                "facebook",
                "tiktok",
              ],

              script:
                `BEFORE:\nShow the customer's situation before using ${services}.\n\nMIDDLE:\nShow one or two parts of the process.\n\nAFTER:\nShow the end result or improvement.\n\nTEXT OVERLAY:\n“From [problem] → [result].”\n\nENDING:\n“This is exactly why we built ${name}.”`,

              caption:
                `This is the bit we love most — seeing the difference between where someone started and where they ended up.\n\nThat transformation is the whole point.`,

              hashtags:
                "#transformation #clientresults #smallbusiness #results #businessgrowth",

              recommendedAudio:
                "Use a before/after transition audio currently performing well.",
            },

            {
              id:
                `idea-${now}-6`,

              title:
                "Unpopular opinion",

              hook:
                `Unpopular opinion: ${audience} do not need more complexity.`,

              whyItWorks:
                "Opinion content encourages comments and lets the brand establish a recognisable point of view.",

              format:
                "Post",

              platforms: [
                "linkedin",
                "instagram",
                "facebook",
              ],

              script:
                `MAIN STATEMENT:\n“Unpopular opinion: the answer is not always more.”\n\nBODY:\nExplain why simpler systems, better decisions or clearer processes matter more than adding another tool, feature or task.\n\nConnect the lesson back to the philosophy behind ${name}.`,

              caption:
                "Unpopular opinion: more does not automatically mean better.\n\nMore tools. More tabs. More complexity. More things to keep track of.\n\nSometimes the smartest move is simplifying the system you already have.",

              hashtags:
                "#businessstrategy #businessowner #systems #productivity #smallbusiness",

              recommendedAudio:
                "Static graphic or carousel. No audio necessary.",
            },
          ];

        setGeneratedConcepts(
          concepts
        );

        setViewMode(
          "ideas"
        );

        toast.success(
          `Ideas created for ${name}`
        );
      } catch (
        error
      ) {
        console.error(
          "Idea generation error:",
          error
        );

        toast.error(
          "Could not generate ideas."
        );
      } finally {
        setGeneratingIdeas(
          false
        );

        setStatus(
          "Ready"
        );
      }
    };

  // ==========================================================
  // CREATE FROM IDEA
  // ==========================================================

  const createFromIdea =
    (
      concept:
        ContentConcept
    ) => {
      setSelectedConcept(
        concept
      );

      setCaption(
        concept.caption
      );

      setHashtags(
        concept.hashtags
      );

      setFormat(
        concept.format
      );

      setMetaScript(
        concept.script
      );

      setMetaAudio(
        concept.recommendedAudio
      );

      const connected =
        concept.platforms.filter(
          (
            platform
          ): platform is PlatformId =>
            [
              "facebook",
              "instagram",
              "tiktok",
              "linkedin",
            ].includes(
              platform
            ) &&
            isConnected(
              platform
            )
        );

      setPlatforms(
        connected
      );

      setViewMode(
        "create"
      );

      toast.success(
        "Idea added to your post"
      );
    };

  // ==========================================================
  // CREATE POST
  // ==========================================================

  const createPost =
    async ({
      instant,
    }: {
      instant:
        boolean;
    }) => {
      if (
        !user?.id
      ) {
        toast.error(
          "You must be signed in."
        );

        return false;
      }

      if (
        !caption.trim()
      ) {
        toast.error(
          "Write a caption first."
        );

        return false;
      }

      if (
        platforms.length ===
        0
      ) {
        toast.error(
          "Choose at least one platform."
        );

        return false;
      }

      if (
        !validateConnections()
      ) {
        return false;
      }

      const hasTikTok =
        platforms.includes(
          "tiktok"
        );

      const hasInstagram =
        platforms.includes(
          "instagram"
        );

      // ========================================================
      // TIKTOK VALIDATION
      // ========================================================

      if (
        hasTikTok &&
        !mediaFile
      ) {
        toast.error(
          "TikTok requires a video."
        );

        return false;
      }

      if (
        hasTikTok &&
        mediaFile &&
        !mediaFile.type.startsWith(
          "video/"
        )
      ) {
        toast.error(
          "TikTok requires a video file."
        );

        return false;
      }

      // ========================================================
      // INSTAGRAM VALIDATION
      // ========================================================

      if (
        hasInstagram &&
        !mediaFile
      ) {
        toast.error(
          "Instagram requires an image or video."
        );

        return false;
      }

      // ========================================================
      // SCHEDULE VALIDATION
      // ========================================================

      if (
        !instant &&
        !scheduledTime
      ) {
        toast.error(
          "Choose when you want the post published."
        );

        return false;
      }

      setIsPosting(
        true
      );

      setStatus(
        instant
          ? "Publishing..."
          : "Scheduling..."
      );

      try {
        let finalMediaUrl:
          string | null =
          null;

        // ======================================================
        // UPLOAD MEDIA
        // ======================================================

        if (
          mediaFile
        ) {
          setIsUploadingMedia(
            true
          );

          setStatus(
            "Uploading..."
          );

          const extension =
            mediaFile.name
              .split(".")
              .pop()
              ?.toLowerCase() ||
            "bin";

          const filePath =
            `${user.id}/${crypto.randomUUID()}.${extension}`;

          const {
            error:
              uploadError,
          } =
            await supabase.storage
              .from(
                "social-assets"
              )
              .upload(
                filePath,
                mediaFile,
                {
                  cacheControl:
                    "3600",

                  upsert:
                    false,

                  contentType:
                    mediaFile.type ||
                    undefined,
                }
              );

          if (
            uploadError
          ) {
            throw new Error(
              `Media upload failed: ${uploadError.message}`
            );
          }

          const {
            data:
              publicData,
          } =
            supabase.storage
              .from(
                "social-assets"
              )
              .getPublicUrl(
                filePath
              );

          finalMediaUrl =
            publicData
              ?.publicUrl ||
            null;

          if (
            !finalMediaUrl
          ) {
            throw new Error(
              "Could not create a public media URL."
            );
          }
        }

        // ======================================================
        // DATE
        // ======================================================

        const publishDate =
          instant
            ? new Date()
            : new Date(
                scheduledTime
              );

        if (
          Number.isNaN(
            publishDate.getTime()
          )
        ) {
          throw new Error(
            "Invalid publishing date."
          );
        }

        // ======================================================
        // CREATE ONE ROW PER DESTINATION
        //
        // IMPORTANT:
        //
        // Facebook and Instagram are deliberately stored
        // separately here.
        // ======================================================

        const rows =
          platforms.map(
            (
              platform
            ) => ({
              user_id:
                user.id,

              caption:
                caption.trim(),

              platform,

              hashtags:
                hashtags.trim() ||
                null,

              media_url:
                finalMediaUrl,

              scheduled_for:
                publishDate.toISOString(),

              status:
                POST_STATUS.SCHEDULED,

              format:
                platform ===
                "tiktok"
                  ? "Video"
                  : format,

              attempts:
                0,

              retry_count:
                0,

              posted_at:
                null,

              platform_post_id:
                null,

              error:
                null,

              last_error:
                null,

              last_attempt_at:
                null,

              platform_response:
                null,
            })
          );

        const {
          data:
            insertedPosts,

          error:
            insertError,
        } =
          await supabase
            .from(
              "socials"
            )
            .insert(
              rows
            )
            .select(
              "id,platform,status,media_url"
            );

        if (
          insertError
        ) {
          throw insertError;
        }

        if (
          !insertedPosts
            ?.length
        ) {
          throw new Error(
            "The post was not saved."
          );
        }

        // ======================================================
        // PUBLISH NOW
        // ======================================================

        if (
          instant
        ) {
          setStatus(
            "Sending..."
          );

          const response =
            await fetch(
              "/api/social/worker/run",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },
              }
            );

          const result =
            await response
              .json()
              .catch(
                () =>
                  null
              );

          if (
            !response.ok
          ) {
            throw new Error(
              result?.error ||
                "Post saved, but publishing failed."
            );
          }

          const labels =
            platforms
              .map(
                (
                  platform
                ) =>
                  PLATFORM_OPTIONS.find(
                    (
                      option
                    ) =>
                      option.id ===
                      platform
                  )?.name ||
                  platform
              )
              .join(
                " & "
              );

          toast.success(
            `Post sent to ${labels}`
          );
        } else {
          toast.success(
            "Post scheduled"
          );
        }

        // ======================================================
        // RESET
        // ======================================================

        setCaption(
          ""
        );

        setHashtags(
          ""
        );

        setMetaScript(
          ""
        );

        setMetaAudio(
          ""
        );

        setScheduledTime(
          ""
        );

        setSelectedConcept(
          null
        );

        setPlatforms(
          []
        );

        clearMedia();

        await syncPosts();

        return true;
      } catch (
        error
      ) {
        console.error(
          "Social post error:",
          error
        );

        toast.error(
          error instanceof
            Error
            ? error.message
            : "Something went wrong"
        );

        return false;
      } finally {
        setIsPosting(
          false
        );

        setIsUploadingMedia(
          false
        );

        setStatus(
          "Ready"
        );
      }
    };

  // ==========================================================
  // APPROVE POST
  // ==========================================================

  const approvePost =
    async (
      postId:
        string
    ) => {
      try {
        const {
          error,
        } =
          await supabase
            .from(
              "socials"
            )
            .update({
              status:
                "scheduled",

              scheduled_for:
                new Date().toISOString(),

              last_error:
                null,

              error:
                null,
            })
            .eq(
              "id",
              postId
            );

        if (
          error
        ) {
          throw error;
        }

        const response =
          await fetch(
            "/api/social/worker/run",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        const result =
          await response
            .json()
            .catch(
              () =>
                null
            );

        if (
          !response.ok
        ) {
          throw new Error(
            result?.error ||
              "Failed to publish post"
          );
        }

        toast.success(
          "Post sent for publishing"
        );

        setPreviewPost(
          null
        );

        await syncPosts();
      } catch (
        error
      ) {
        console.error(
          "Approval error:",
          error
        );

        toast.error(
          error instanceof
            Error
            ? error.message
            : "Approval failed"
        );
      }
    };

  // ==========================================================
  // DELETE POST
  // ==========================================================

  const deletePost =
    async (
      postId:
        string
    ) => {
      if (
        !window.confirm(
          "Delete this post?"
        )
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "socials"
          )
          .delete()
          .eq(
            "id",
            postId
          );

      if (
        error
      ) {
        toast.error(
          error.message
        );

        return;
      }

      setSelectedDayPosts(
        (
          previous
        ) =>
          previous.filter(
            (
              post
            ) =>
              post.id !==
              postId
          )
      );

      toast.success(
        "Post deleted"
      );

      await syncPosts();
    };

  // ==========================================================
  // CALENDAR
  // ==========================================================

  const calendarDays =
    useMemo(
      () => {
        const year =
          currentDate.getFullYear();

        const month =
          currentDate.getMonth();

        const firstDay =
          new Date(
            year,
            month,
            1
          ).getDay();

        const daysInMonth =
          new Date(
            year,
            month + 1,
            0
          ).getDate();

        const days:
          number[] =
          [];

        for (
          let i = 0;
          i < firstDay;
          i += 1
        ) {
          days.push(
            0
          );
        }

        for (
          let day = 1;
          day <=
          daysInMonth;
          day += 1
        ) {
          days.push(
            day
          );
        }

        return days;
      },
      [
        currentDate,
      ]
    );

  const handleDateClick =
    (
      day:
        number
    ) => {
      if (
        day ===
        0
      ) {
        return;
      }

      const clickedDate =
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          day
        );

      const dayPosts =
        posts.filter(
          (
            post
          ) =>
            post.scheduled_for &&
            isSameDay(
              post.scheduled_for,
              day,
              currentDate.getMonth(),
              currentDate.getFullYear()
            )
        );

      if (
        dayPosts.length
      ) {
        setSelectedDayPosts(
          dayPosts
        );

        setIsDayViewOpen(
          true
        );

        return;
      }

      clickedDate.setHours(
        12,
        0,
        0,
        0
      );

      const year =
        clickedDate.getFullYear();

      const month =
        String(
          clickedDate.getMonth() +
            1
        ).padStart(
          2,
          "0"
        );

      const date =
        String(
          clickedDate.getDate()
        ).padStart(
          2,
          "0"
        );

      setScheduledTime(
        `${year}-${month}-${date}T12:00`
      );

      setViewMode(
        "create"
      );

      toast.success(
        "Date added to your post"
      );
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#faf9f6]/95 px-4 py-4 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-[#a9b897]">
              <Layers
                size={
                  18
                }
              />
            </div>

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.35em] text-[#8fa07d]">
                TOTS-OS
              </p>

              <h1 className="font-serif text-2xl italic">
                Social Studio
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white p-1.5">
            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "create"
                )
              }
              className={`rounded-xl px-5 py-3 text-[9px] font-black uppercase tracking-wider transition ${
                viewMode ===
                "create"
                  ? "bg-stone-900 text-[#a9b897]"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              Create
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "ideas"
                )
              }
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-[9px] font-black uppercase tracking-wider transition ${
                viewMode ===
                "ideas"
                  ? "bg-stone-900 text-[#a9b897]"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              <Sparkles
                size={
                  12
                }
              />

              Ideas
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "planner"
                )
              }
              className={`rounded-xl px-5 py-3 text-[9px] font-black uppercase tracking-wider transition ${
                viewMode ===
                "planner"
                  ? "bg-stone-900 text-[#a9b897]"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              Planner
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-stone-200 bg-white px-4 py-2">
              <span className="flex items-center gap-2 text-[8px] font-black uppercase tracking-wider text-stone-400">
                <span
                  className={`h-2 w-2 rounded-full ${
                    status ===
                    "Ready"
                      ? "bg-[#a9b897]"
                      : "bg-amber-400"
                  }`}
                />

                {
                  status
                }
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                void syncPosts();
                void loadAccounts();
              }}
              className="rounded-xl border border-stone-200 bg-white p-3 text-stone-400 hover:text-stone-900"
            >
              <RefreshCcw
                size={
                  15
                }
              />
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-7xl p-4 md:p-8 lg:p-10">
        <AnimatePresence
          mode="wait"
        >
          {/* ==================================================
              CREATE
          ================================================== */}

          {viewMode ===
            "create" && (
            <motion.div
              key="create"
              initial={{
                opacity:
                  0,

                y:
                  10,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,
              }}
              exit={{
                opacity:
                  0,
              }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.35em] text-[#8fa07d]">
                    Create Content
                  </p>

                  <h2 className="font-serif text-5xl italic tracking-tight md:text-7xl">
                    What are we
                    posting?
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
                    Create once and
                    choose exactly where
                    it goes. Facebook
                    and Instagram are
                    completely separate
                    options.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode(
                      "ideas"
                    );

                    if (
                      !generatedConcepts.length
                    ) {
                      void generateBusinessIdeas();
                    }
                  }}
                  className="flex items-center justify-center gap-3 rounded-2xl bg-[#a9b897] px-6 py-4 text-[10px] font-black uppercase tracking-wider text-stone-900"
                >
                  <Wand2
                    size={
                      15
                    }
                  />

                  Give Me Ideas
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                {/* ==============================================
                    COMPOSER
                ============================================== */}

                <section className="space-y-5 rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
                  {selectedConcept && (
                    <div className="rounded-2xl border border-[#a9b897]/30 bg-[#a9b897]/10 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#71805f]">
                            Created from
                            idea
                          </p>

                          <p className="mt-2 text-sm font-black">
                            {
                              selectedConcept.title
                            }
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedConcept(
                              null
                            )
                          }
                          className="text-stone-400"
                        >
                          <X
                            size={
                              15
                            }
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MEDIA */}

                  <div>
                    <label className="mb-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-stone-400">
                      <ImageIcon
                        size={
                          12
                        }
                      />

                      Photo or Video
                    </label>

                    <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-[2rem] border border-dashed border-stone-200 bg-stone-50">
                      {mediaPreview ? (
                        <>
                          {mediaFile
                            ?.type
                            .startsWith(
                              "video/"
                            ) ? (
                            <video
                              src={
                                mediaPreview
                              }
                              controls
                              playsInline
                              className="max-h-[440px] w-full object-contain"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                mediaPreview
                              }
                              alt="Post preview"
                              className="max-h-[440px] w-full object-contain"
                            />
                          )}

                          <button
                            type="button"
                            onClick={
                              clearMedia
                            }
                            className="absolute right-4 top-4 rounded-full bg-stone-900 p-3 text-white shadow-xl"
                          >
                            <X
                              size={
                                14
                              }
                            />
                          </button>
                        </>
                      ) : (
                        <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-12 text-center">
                          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                            <Upload
                              size={
                                20
                              }
                              className="text-[#8fa07d]"
                            />
                          </div>

                          <p className="text-sm font-black">
                            Add your content
                          </p>

                          <p className="mt-2 text-xs text-stone-400">
                            Upload an image
                            or video
                          </p>

                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={
                              handleMediaUpload
                            }
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* CAPTION */}

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                        Caption
                      </label>

                      <span className="text-[9px] text-stone-300">
                        {
                          caption.length
                        }{" "}
                        characters
                      </span>
                    </div>

                    <textarea
                      value={
                        caption
                      }
                      onChange={(
                        event
                      ) =>
                        setCaption(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="What do you want to say?"
                      className="min-h-[220px] w-full resize-y rounded-[2rem] border border-stone-200 bg-[#faf9f6] p-6 text-base leading-8 outline-none transition focus:border-[#a9b897]"
                    />
                  </div>

                  {/* HASHTAGS */}

                  <div>
                    <label className="mb-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-stone-400">
                      <Hash
                        size={
                          12
                        }
                      />

                      Hashtags
                    </label>

                    <input
                      value={
                        hashtags
                      }
                      onChange={(
                        event
                      ) =>
                        setHashtags(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="#smallbusiness #marketing"
                      className="w-full rounded-2xl border border-stone-200 bg-[#faf9f6] p-4 text-sm outline-none focus:border-[#a9b897]"
                    />
                  </div>

                  {/* SCRIPT */}

                  {metaScript && (
                    <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Film
                          size={
                            14
                          }
                          className="text-[#8fa07d]"
                        />

                        <p className="text-[9px] font-black uppercase tracking-wider text-stone-500">
                          Filming /
                          Content Guide
                        </p>
                      </div>

                      <p className="whitespace-pre-wrap text-xs leading-6 text-stone-500">
                        {
                          metaScript
                        }
                      </p>
                    </div>
                  )}

                  {metaAudio && (
                    <div className="flex items-start gap-3 rounded-2xl border border-stone-100 bg-amber-50 p-4">
                      <Music
                        size={
                          15
                        }
                        className="mt-0.5 shrink-0 text-amber-500"
                      />

                      <div>
                        <p className="text-[8px] font-black uppercase tracking-wider text-amber-700">
                          Audio suggestion
                        </p>

                        <p className="mt-1 text-xs text-amber-800">
                          {
                            metaAudio
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {/* ==============================================
                    SIDEBAR
                ============================================== */}

                <aside className="space-y-5">
                  {/* ============================================
                      PLATFORM SELECTOR
                  ============================================ */}

                  <div className="rounded-[2rem] border border-stone-200 bg-white p-5">
                    <p className="mb-1 text-sm font-black">
                      Where should it
                      go?
                    </p>

                    <p className="mb-5 text-[10px] leading-5 text-stone-400">
                      Pick one or more.
                      Facebook and
                      Instagram publish
                      independently.
                    </p>

                    <div className="space-y-2">
                      {PLATFORM_OPTIONS.map(
                        (
                          platform
                        ) => {
                          const connected =
                            isConnected(
                              platform.id
                            );

                          const selected =
                            platforms.includes(
                              platform.id
                            );

                          return (
                            <button
                              key={
                                platform.id
                              }
                              type="button"
                              onClick={() =>
                                togglePlatform(
                                  platform.id
                                )
                              }
                              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                                selected
                                  ? "border-[#a9b897] bg-[#a9b897]/10"
                                  : "border-stone-100 bg-stone-50 hover:border-stone-200"
                              } ${
                                !connected
                                  ? "opacity-55"
                                  : ""
                              }`}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    selected
                                      ? "bg-[#a9b897] text-white"
                                      : "bg-white text-stone-500"
                                  }`}
                                >
                                  {platform.id ===
                                    "facebook" && (
                                    <Facebook
                                      size={
                                        17
                                      }
                                    />
                                  )}

                                  {platform.id ===
                                    "instagram" && (
                                    <Instagram
                                      size={
                                        17
                                      }
                                    />
                                  )}

                                  {platform.id ===
                                    "linkedin" && (
                                    <Linkedin
                                      size={
                                        17
                                      }
                                    />
                                  )}

                                  {platform.id ===
                                    "tiktok" && (
                                    <Music
                                      size={
                                        17
                                      }
                                    />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="text-xs font-black">
                                    {
                                      platform.name
                                    }
                                  </p>

                                  <p
                                    className={`mt-1 truncate text-[9px] ${
                                      connected
                                        ? "text-[#71805f]"
                                        : "text-stone-400"
                                    }`}
                                  >
                                    {connected
                                      ? getPlatformConnectionText(
                                          platform.id
                                        )
                                      : "Not connected"}
                                  </p>
                                </div>
                              </div>

                              {selected ? (
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#a9b897] text-white">
                                  <Check
                                    size={
                                      12
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="h-6 w-6 shrink-0 rounded-full border border-stone-200 bg-white" />
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>

                    {/* SELECTED SUMMARY */}

                    {platforms.length >
                      0 && (
                      <div className="mt-4 rounded-2xl border border-[#a9b897]/30 bg-[#a9b897]/10 p-4">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#71805f]">
                          Publishing to
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {platforms.map(
                            (
                              platform
                            ) => (
                              <span
                                key={
                                  platform
                                }
                                className="rounded-full bg-white px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-stone-600 shadow-sm"
                              >
                                {
                                  PLATFORM_OPTIONS.find(
                                    (
                                      item
                                    ) =>
                                      item.id ===
                                      platform
                                  )?.name
                                }
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FORMAT */}

                  <div className="rounded-[2rem] border border-stone-200 bg-white p-5">
                    <p className="mb-3 text-[9px] font-black uppercase tracking-wider text-stone-400">
                      Format
                    </p>

                    <select
                      value={
                        format
                      }
                      onChange={(
                        event
                      ) =>
                        setFormat(
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs font-bold outline-none"
                    >
                      <option value="Post">
                        Post
                      </option>

                      <option value="Reel">
                        Reel
                      </option>

                      <option value="TikTok">
                        TikTok
                      </option>

                      <option value="Carousel">
                        Carousel
                      </option>
                    </select>
                  </div>

                  {/* SCHEDULE */}

                  <div className="rounded-[2rem] border border-stone-200 bg-white p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100">
                        <Clock
                          size={
                            14
                          }
                        />
                      </div>

                      <div>
                        <p className="text-xs font-black">
                          Schedule
                        </p>

                        <p className="text-[9px] text-stone-400">
                          Optional if
                          posting now
                        </p>
                      </div>
                    </div>

                    <input
                      type="datetime-local"
                      value={
                        scheduledTime
                      }
                      onChange={(
                        event
                      ) =>
                        setScheduledTime(
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none"
                    />
                  </div>

                  {/* POST NOW */}

                  <button
                    type="button"
                    disabled={
                      isPosting ||
                      isUploadingMedia
                    }
                    onClick={() =>
                      void createPost({
                        instant:
                          true,
                      })
                    }
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#a9b897] px-6 py-5 text-[10px] font-black uppercase tracking-widest text-stone-900 shadow-lg disabled:opacity-50"
                  >
                    {isPosting ? (
                      <Loader2
                        size={
                          15
                        }
                        className="animate-spin"
                      />
                    ) : (
                      <Send
                        size={
                          15
                        }
                      />
                    )}

                    Post Now
                  </button>

                  {/* SCHEDULE */}

                  <button
                    type="button"
                    disabled={
                      isPosting ||
                      isUploadingMedia
                    }
                    onClick={() =>
                      void createPost({
                        instant:
                          false,
                      })
                    }
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-stone-900 px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#a9b897] shadow-lg disabled:opacity-50"
                  >
                    {isPosting ? (
                      <Loader2
                        size={
                          15
                        }
                        className="animate-spin"
                      />
                    ) : (
                      <CalendarDays
                        size={
                          15
                        }
                      />
                    )}

                    Schedule Post
                  </button>
                </aside>
              </div>
            </motion.div>
          )}

          {/* ==================================================
              IDEAS
          ================================================== */}

          {viewMode ===
            "ideas" && (
            <motion.div
              key="ideas"
              initial={{
                opacity:
                  0,

                y:
                  10,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,
              }}
              exit={{
                opacity:
                  0,
              }}
              className="space-y-8"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.35em] text-[#8fa07d]">
                    Content Ideas
                  </p>

                  <h2 className="font-serif text-5xl italic md:text-7xl">
                    What should we
                    post?
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-stone-500">
                    TOTS-OS uses what it
                    already knows about
                    your business to give
                    you practical content
                    starting points.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    generatingIdeas
                  }
                  onClick={() =>
                    void generateBusinessIdeas()
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#a9b897] px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.18em] text-stone-900 transition hover:bg-[#b8caa4] disabled:opacity-50"
                >
                  {generatingIdeas ? (
                    <Loader2
                      size={
                        14
                      }
                      className="animate-spin"
                    />
                  ) : (
                    <Sparkles
                      size={
                        14
                      }
                    />
                  )}

                  {generatedConcepts.length
                    ? "More ideas"
                    : "Generate ideas"}
                </button>
              </div>

              {businessLoading && (
                <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-xs text-stone-400">
                  <Loader2
                    size={
                      14
                    }
                    className="animate-spin"
                  />

                  Loading business
                  context...
                </div>
              )}

              {/* EMPTY */}

              {generatedConcepts.length ===
                0 && (
                <button
                  type="button"
                  onClick={() =>
                    void generateBusinessIdeas()
                  }
                  className="flex w-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-stone-200 bg-white p-12 text-center transition hover:border-[#a9b897] hover:bg-[#f7f9f2]"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3e7] text-[#7f8d69]">
                    <Lightbulb
                      size={
                        26
                      }
                    />
                  </div>

                  <p className="font-serif text-3xl italic text-stone-900">
                    Need a post idea?
                  </p>

                  <p className="mt-3 max-w-md text-sm leading-6 text-stone-500">
                    Generate a few ideas
                    that fit your
                    business and your
                    audience.
                  </p>
                </button>
              )}

              {/* IDEAS GRID */}

              {generatedConcepts.length >
                0 && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {generatedConcepts.map(
                    (
                      concept,
                      index
                    ) => (
                      <div
                        key={
                          concept.id
                        }
                        className="flex min-h-[315px] flex-col rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <span className="rounded-full bg-[#edf3e7] px-2.5 py-1.5 text-[8px] font-black uppercase tracking-wider text-[#6a7a5b]">
                            Idea{" "}
                            {String(
                              index +
                                1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          <span className="rounded-full bg-stone-100 px-2.5 py-1.5 text-[7px] font-black uppercase tracking-wider text-stone-500">
                            {
                              concept.format
                            }
                          </span>
                        </div>

                        <h3 className="font-serif text-2xl italic leading-none text-stone-900">
                          {
                            concept.title
                          }
                        </h3>

                        <div className="mt-4 rounded-2xl bg-stone-50 p-3">
                          <p className="text-[8px] font-black uppercase tracking-wider text-stone-300">
                            Hook
                          </p>

                          <p className="mt-2 text-sm font-bold leading-5 text-stone-700">
                            “
                            {
                              concept.hook
                            }
                            ”
                          </p>
                        </div>

                        <p className="mt-4 flex-1 text-xs leading-5 text-stone-500">
                          {
                            concept.whyItWorks
                          }
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {concept.platforms.map(
                            (
                              platform
                            ) => (
                              <span
                                key={
                                  platform
                                }
                                className="rounded-full bg-stone-100 px-2.5 py-1 text-[7px] font-black uppercase tracking-wider text-stone-500"
                              >
                                {
                                  platform
                                }
                              </span>
                            )
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            createFromIdea(
                              concept
                            )
                          }
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-3 text-[8px] font-black uppercase tracking-wider text-[#a9b897] transition hover:bg-stone-800"
                        >
                          <Wand2
                            size={
                              12
                            }
                          />

                          Use this idea
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ==================================================
              PLANNER
          ================================================== */}

          {viewMode ===
            "planner" && (
            <motion.div
              key="planner"
              initial={{
                opacity:
                  0,

                y:
                  10,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,
              }}
              exit={{
                opacity:
                  0,
              }}
              className="space-y-8"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.35em] text-[#8fa07d]">
                    Content Planner
                  </p>

                  <div className="flex items-baseline gap-4">
                    <h2 className="font-serif text-5xl italic md:text-7xl">
                      {currentDate.toLocaleString(
                        "default",
                        {
                          month:
                            "long",
                        }
                      )}
                    </h2>

                    <span className="font-serif text-2xl italic text-stone-300">
                      {
                        currentDate.getFullYear()
                      }
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 rounded-2xl border border-stone-200 bg-white p-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() -
                            1,
                          1
                        )
                      )
                    }
                    className="rounded-xl p-3 hover:bg-stone-50"
                  >
                    <ChevronLeft
                      size={
                        18
                      }
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() +
                            1,
                          1
                        )
                      )
                    }
                    className="rounded-xl p-3 hover:bg-stone-50"
                  >
                    <ChevronRight
                      size={
                        18
                      }
                    />
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[3rem] border border-stone-200 bg-white p-4 shadow-sm md:p-8">
                <div className="grid grid-cols-7">
                  {[
                    "Sun",
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                  ].map(
                    (
                      day
                    ) => (
                      <div
                        key={
                          day
                        }
                        className="py-4 text-center text-[8px] font-black uppercase tracking-wider text-stone-300"
                      >
                        {
                          day
                        }
                      </div>
                    )
                  )}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map(
                    (
                      day,
                      index
                    ) => {
                      const dayPosts =
                        day
                          ? posts.filter(
                              (
                                post
                              ) =>
                                isSameDay(
                                  post.scheduled_for,
                                  day,
                                  currentDate.getMonth(),
                                  currentDate.getFullYear()
                                )
                            )
                          : [];

                      return (
                        <button
                          key={
                            index
                          }
                          type="button"
                          onClick={() =>
                            handleDateClick(
                              day
                            )
                          }
                          disabled={
                            day ===
                            0
                          }
                          className={`relative min-h-[90px] border-b border-r border-stone-50 p-2 text-left transition md:min-h-[130px] md:p-4 ${
                            day ===
                            0
                              ? "bg-stone-50/30"
                              : "hover:bg-stone-50"
                          }`}
                        >
                          {day >
                            0 && (
                            <>
                              <span className="text-sm font-black text-stone-500">
                                {
                                  day
                                }
                              </span>

                              <div className="mt-3 space-y-1">
                                {dayPosts
                                  .slice(
                                    0,
                                    2
                                  )
                                  .map(
                                    (
                                      post
                                    ) => (
                                      <div
                                        key={
                                          post.id
                                        }
                                        className="rounded-lg bg-stone-100 p-2"
                                      >
                                        <div className="flex items-center gap-1">
                                          <span
                                            className={`h-1.5 w-1.5 rounded-full ${getStatusColor(
                                              post.status
                                            )}`}
                                          />

                                          <span className="truncate text-[7px] font-black uppercase text-stone-500">
                                            {
                                              post.platform
                                            }
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  )}

                                {dayPosts.length >
                                  2 && (
                                  <p className="text-[7px] font-black text-stone-300">
                                    +
                                    {dayPosts.length -
                                      2}{" "}
                                    more
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ======================================================
          DAY DRAWER
      ====================================================== */}

      <AnimatePresence>
        {isDayViewOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              exit={{
                opacity:
                  0,
              }}
              onClick={() =>
                setIsDayViewOpen(
                  false
                )
              }
              className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm"
            />

            <motion.div
              initial={{
                x:
                  "100%",
              }}
              animate={{
                x:
                  0,
              }}
              exit={{
                x:
                  "100%",
              }}
              className="relative flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl md:p-8"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#8fa07d]">
                    Planner
                  </p>

                  <h3 className="mt-2 font-serif text-4xl italic">
                    Posts
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsDayViewOpen(
                      false
                    )
                  }
                  className="rounded-full bg-stone-50 p-3"
                >
                  <X
                    size={
                      18
                    }
                  />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto">
                {selectedDayPosts.map(
                  (
                    post
                  ) => (
                    <div
                      key={
                        post.id
                      }
                      className="rounded-[2rem] border border-stone-100 bg-stone-50 p-5"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${getStatusColor(
                              post.status
                            )}`}
                          />

                          <p className="text-[8px] font-black uppercase tracking-wider text-stone-500">
                            {
                              post.platform
                            }
                          </p>
                        </div>

                        <span
                          className={`text-[8px] font-black uppercase ${getStatusTextColor(
                            post.status
                          )}`}
                        >
                          {
                            post.status
                          }
                        </span>
                      </div>

                      <p className="line-clamp-3 text-sm leading-6 text-stone-600">
                        {
                          post.caption
                        }
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-4">
                        <span className="flex items-center gap-2 text-[9px] text-stone-400">
                          <Clock
                            size={
                              11
                            }
                          />

                          {new Date(
                            post.scheduled_for
                          ).toLocaleTimeString(
                            [],
                            {
                              hour:
                                "2-digit",

                              minute:
                                "2-digit",
                            }
                          )}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewPost(
                                post
                              )
                            }
                            className="rounded-lg p-2 text-stone-400 hover:bg-white"
                          >
                            <Eye
                              size={
                                14
                              }
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void deletePost(
                                post.id
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
                      </div>
                    </div>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDayViewOpen(
                    false
                  );

                  setViewMode(
                    "create"
                  );
                }}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-stone-900 py-5 text-[9px] font-black uppercase tracking-wider text-[#a9b897]"
              >
                <Plus
                  size={
                    14
                  }
                />

                Create Another Post
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================
          PREVIEW MODAL
      ====================================================== */}

      <AnimatePresence>
        {previewPost && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-md">
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
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2.5rem] bg-white p-6 shadow-2xl md:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#8fa07d]">
                    Preview
                  </p>

                  <h2 className="mt-2 font-serif text-3xl italic">
                    Your Post
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPreviewPost(
                      null
                    )
                  }
                  className="rounded-full bg-stone-50 p-3"
                >
                  <X
                    size={
                      17
                    }
                  />
                </button>
              </div>

              {previewPost.media_url &&
                (
                  isVideoUrl(
                    previewPost.media_url
                  ) ||
                  previewPost.platform ===
                    "tiktok"
                ) && (
                  <video
                    src={
                      previewPost.media_url
                    }
                    controls
                    playsInline
                    className="mb-6 max-h-[450px] w-full rounded-[2rem] bg-black object-contain"
                  />
                )}

              {previewPost.media_url &&
                !isVideoUrl(
                  previewPost.media_url
                ) &&
                previewPost.platform !==
                  "tiktok" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      previewPost.media_url
                    }
                    alt="Post preview"
                    className="mb-6 max-h-[450px] w-full rounded-[2rem] object-contain"
                  />
                )}

              <div className="mb-5 flex items-center gap-2">
                <span className="rounded-full bg-stone-100 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-stone-500">
                  {
                    previewPost.platform
                  }
                </span>

                <span
                  className={`rounded-full bg-stone-50 px-3 py-1.5 text-[8px] font-black uppercase ${getStatusTextColor(
                    previewPost.status
                  )}`}
                >
                  {
                    previewPost.status
                  }
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-7 text-stone-600">
                {
                  previewPost.caption
                }
              </p>

              {previewPost.hashtags && (
                <p className="mt-4 text-xs font-bold leading-6 text-[#71805f]">
                  {
                    previewPost.hashtags
                  }
                </p>
              )}

              {previewPost.last_error && (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs text-red-600">
                  {
                    previewPost.last_error
                  }
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 border-t border-stone-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewPost(
                      null
                    )
                  }
                  className="rounded-xl bg-stone-100 px-6 py-3 text-[9px] font-black uppercase tracking-wider text-stone-500"
                >
                  Close
                </button>

                {previewPost.status !==
                  "published" && (
                  <button
                    type="button"
                    onClick={() =>
                      void approvePost(
                        previewPost.id
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#a9b897] px-6 py-3 text-[9px] font-black uppercase tracking-wider text-stone-900"
                  >
                    <ArrowRight
                      size={
                        13
                      }
                    />

                    Publish Now
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================
          GLOBAL STYLES
      ====================================================== */}

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&display=swap");

        .font-serif {
          font-family: "Instrument Serif", serif;
        }

        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #e7e5e4;
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}