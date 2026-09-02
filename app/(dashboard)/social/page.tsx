"use client";

import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createBrowserClient,
} from "@supabase/ssr";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
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
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
  XCircle,
} from "lucide-react";

import {
  toast,
} from "sonner";

// ============================================================
// TYPES
// ============================================================

interface SocialPost {
  id:
    string;

  caption:
    string;

  platform:
    string;

  hashtags?:
    string | null;

  media_url?:
    string | null;

  media_urls?:
    string[] | null;

  scheduled_for:
    string;

  status:
    string;

  format:
    string;

  platform_post_id?:
    string | null;

  error?:
    string | null;

  last_error?:
    string | null;

  attempts?:
    number;

  analytics?:
    unknown;

  platform_response?:
    unknown;

  tiktok_settings?:
    TikTokPostSettings | null;
}

type TikTokPrivacyLevel =
  | "PUBLIC_TO_EVERYONE"
  | "MUTUAL_FOLLOW_FRIENDS"
  | "FOLLOWER_OF_CREATOR"
  | "SELF_ONLY"
  | string;

interface TikTokCreatorInfo {
  open_id?:
    string | null;

  display_name?:
    string | null;

  avatar_url?:
    string | null;

  privacy_level_options:
    TikTokPrivacyLevel[];

  comment_disabled:
    boolean;

  duet_disabled:
    boolean;

  stitch_disabled:
    boolean;

  max_video_post_duration_sec?:
    number | null;
}

interface TikTokPostSettings {
  privacy_level:
    TikTokPrivacyLevel | "";

  allow_comment:
    boolean;

  allow_duet:
    boolean;

  allow_stitch:
    boolean;

  commercial_content:
    boolean;

  brand_organic_toggle:
    boolean;

  brand_content_toggle:
    boolean;

  is_aigc:
    boolean;

  consent_given:
    boolean;
}

interface SocialAccount {
  id:
    string;

  platform:
    string;

  platform_user_id?:
    string | null;

  page_id?:
    string | null;

  page_name?:
    string | null;

  page_access_token?:
    string | null;

  instagram_business_account_id?:
    string | null;

  display_name?:
    string | null;
}

interface BusinessProfile {
  name:
    string;

  description:
    string;

  audience:
    string;

  services:
    string;

  tone:
    string;

  goals:
    string;

  rawContext:
    string;
}

interface ContentConcept {
  id:
    string;

  title:
    string;

  hook:
    string;

  whyItWorks:
    string;

  format:
    | "Reel"
    | "TikTok"
    | "Post"
    | "Carousel";

  platforms:
    string[];

  script:
    string;

  caption:
    string;

  hashtags:
    string;

  recommendedAudio:
    string;
}

interface ComposerMediaItem {
  id:
    string;

  file?:
    File | null;

  previewUrl:
    string;

  type:
    | "image"
    | "video";

  existingUrl?:
    string | null;
}

type PlatformId =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "linkedin";

type PublishResultStatus =
  | "published"
  | "processing"
  | "scheduled"
  | "failed";

type PublishResult = {
  id:
    string;

  platform:
    PlatformId | string;

  status:
    PublishResultStatus;

  message:
    string;

  error?:
    string | null;

  platformPostId?:
    string | null;
};

type PublishSummary = {
  mode:
    | "instant"
    | "scheduled";

  createdAt:
    string;

  results:
    PublishResult[];
};

// ============================================================
// POST STATUS
// ============================================================

const POST_STATUS = {
  DRAFT:
    "draft",

  SCHEDULED:
    "scheduled",

  PROCESSING:
    "processing",

  PUBLISHED:
    "published",

  FAILED:
    "failed",
} as const;

// ============================================================
// MEDIA LIMITS
// ============================================================

const MAX_MEDIA_ITEMS =
  10;

const MAX_FILE_SIZE =
  250 *
  1024 *
  1024;

// ============================================================
// PLATFORM OPTIONS
// ============================================================

const PLATFORM_OPTIONS: Array<{
  id:
    PlatformId;

  name:
    string;

  description:
    string;
}> = [
  {
    id:
      "facebook",

    name:
      "Facebook",

    description:
      "Page posts",
  },

  {
    id:
      "instagram",

    name:
      "Instagram",

    description:
      "Posts & Reels",
  },

  {
    id:
      "tiktok",

    name:
      "TikTok",

    description:
      "Photos & video",
  },

  {
    id:
      "linkedin",

    name:
      "LinkedIn",

    description:
      "Posts",
  },
];

// ============================================================
// HELPERS
// ============================================================

const sleep =
  (
    milliseconds:
      number
  ) =>
    new Promise<void>(
      (
        resolve
      ) => {
        window.setTimeout(
          resolve,
          milliseconds
        );
      }
    );

// ============================================================

const isSameDay =
  (
    dateStr:
      string,

    day:
      number,

    month:
      number,

    year:
      number
  ) => {
    if (
      !dateStr
    ) {
      return false;
    }

    const date =
      new Date(
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
      date.getDate() ===
        day &&
      date.getMonth() ===
        month &&
      date.getFullYear() ===
        year
    );
  };

// ============================================================

const getStatusColor =
  (
    status?:
      string
  ) => {
    switch (
      status ||
      ""
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

const getStatusTextColor =
  (
    status?:
      string
  ) => {
    switch (
      status ||
      ""
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

const getStatusBackground =
  (
    status?:
      string
  ) => {
    switch (
      status ||
      ""
    ) {
      case "published":
        return "border-emerald-200 bg-emerald-50";

      case "scheduled":
        return "border-blue-100 bg-blue-50";

      case "processing":
        return "border-amber-200 bg-amber-50";

      case "failed":
        return "border-red-200 bg-red-50";

      default:
        return "border-stone-200 bg-stone-50";
    }
  };

// ============================================================

const getPlatformLabel =
  (
    platform:
      string
  ) => {
    return (
      PLATFORM_OPTIONS.find(
        (
          item
        ) =>
          item.id ===
          platform
      )?.name ||
      platform
    );
  };

// ============================================================

const getPostError =
  (
    post:
      SocialPost
  ) => {
    return (
      post.last_error ||
      post.error ||
      null
    );
  };

// ============================================================

const isVideoUrl =
  (
    url?:
      string | null
  ) => {
    if (
      !url
    ) {
      return false;
    }

    const cleanUrl =
      url
        .toLowerCase()
        .split(
          "?"
        )[0]
        .split(
          "#"
        )[0];

    return [
      ".mp4",
      ".mov",
      ".m4v",
      ".webm",
      ".avi",
    ].some(
      (
        extension
      ) =>
        cleanUrl.endsWith(
          extension
        )
    );
  };

// ============================================================

const cleanPlatform =
  (
    value?:
      string | null
  ) => {
    return String(
      value ||
        ""
    )
      .trim()
      .toLowerCase();
  };

const compactText =
  (
    values:
      unknown[]
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
        (
          value
        ) =>
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
          ) ===
          index
      )
      .join(
        "\n"
      );
  };

// ============================================================
// GET POST MEDIA
// ============================================================

const getPostMediaUrls =
  (
    post:
      SocialPost
  ): string[] => {
    if (
      Array.isArray(
        post.media_urls
      ) &&
      post.media_urls.length
    ) {
      return post.media_urls.filter(
        (
          url
        ): url is string =>
          typeof url ===
            "string" &&
          Boolean(
            url.trim()
          )
      );
    }

    if (
      post.media_url
    ) {
      return [
        post.media_url,
      ];
    }

    return [];
  };

// ============================================================
// DATETIME LOCAL VALUE
// ============================================================

const toDateTimeLocalValue =
  (
    value:
      string
  ) => {
    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() +
        1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );

    const hours =
      String(
        date.getHours()
      ).padStart(
        2,
        "0"
      );

    const minutes =
      String(
        date.getMinutes()
      ).padStart(
        2,
        "0"
      );

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

// ============================================================
// SAME MEDIA
// ============================================================

const sameMedia =
  (
    first:
      SocialPost,

    second:
      SocialPost
  ) => {
    return (
      JSON.stringify(
        getPostMediaUrls(
          first
        )
      ) ===
      JSON.stringify(
        getPostMediaUrls(
          second
        )
      )
    );
  };

// ============================================================
// VIDEO FRAME FOR AI ANALYSIS
// ============================================================

const extractVideoFrameFile =
  (
    file:
      File
  ): Promise<File | null> => {
    return new Promise(
      (
        resolve
      ) => {
        const videoUrl =
          URL.createObjectURL(
            file
          );

        const video =
          document.createElement(
            "video"
          );

        let settled =
          false;

        const finish =
          (
            frame:
              File | null
          ) => {
            if (
              settled
            ) {
              return;
            }

            settled =
              true;

            URL.revokeObjectURL(
              videoUrl
            );

            video.removeAttribute(
              "src"
            );

            video.load();

            resolve(
              frame
            );
          };

        const capture =
          () => {
            try {
              if (
                !video.videoWidth ||
                !video.videoHeight
              ) {
                finish(
                  null
                );

                return;
              }

              const maximumWidth =
                1600;

              const scale =
                Math.min(
                  1,
                  maximumWidth /
                    video.videoWidth
                );

              const canvas =
                document.createElement(
                  "canvas"
                );

              canvas.width =
                Math.max(
                  1,
                  Math.round(
                    video.videoWidth *
                      scale
                  )
                );

              canvas.height =
                Math.max(
                  1,
                  Math.round(
                    video.videoHeight *
                      scale
                  )
                );

              const context =
                canvas.getContext(
                  "2d"
                );

              if (
                !context
              ) {
                finish(
                  null
                );

                return;
              }

              context.drawImage(
                video,
                0,
                0,
                canvas.width,
                canvas.height
              );

              canvas.toBlob(
                (
                  blob
                ) => {
                  if (
                    !blob
                  ) {
                    finish(
                      null
                    );

                    return;
                  }

                  const safeName =
                    file.name
                      .replace(
                        /\.[^.]+$/,
                        ""
                      )
                      .replace(
                        /[^a-z0-9-_]+/gi,
                        "-"
                      );

                  finish(
                    new File(
                      [
                        blob,
                      ],
                      `${safeName || "video"}-frame.jpg`,
                      {
                        type:
                          "image/jpeg",
                      }
                    )
                  );
                },
                "image/jpeg",
                0.86
              );
            } catch {
              finish(
                null
              );
            }
          };

        video.muted =
          true;

        video.playsInline =
          true;

        video.preload =
          "metadata";

        video.onloadedmetadata =
          () => {
            const preferredTime =
              Number.isFinite(
                video.duration
              ) &&
              video.duration >
                0
                ? Math.min(
                    Math.max(
                      video.duration *
                        0.15,
                      0.1
                    ),
                    Math.max(
                      video.duration -
                        0.1,
                      0
                    )
                  )
                : 0;

            if (
              preferredTime >
              0
            ) {
              try {
                video.currentTime =
                  preferredTime;
              } catch {
                capture();
              }
            } else {
              capture();
            }
          };

        video.onseeked =
          capture;

        video.onerror =
          () =>
            finish(
              null
            );

        window.setTimeout(
          () =>
            finish(
              null
            ),
          8000
        );

        video.src =
          videoUrl;
      }
    );
  };

// ============================================================

function resultFromPost(
  post:
    SocialPost
): PublishResult {
  const status =
    cleanPlatform(
      post.status
    );

  if (
    status ===
    POST_STATUS.PUBLISHED
  ) {
    return {
      id:
        post.id,

      platform:
        post.platform,

      status:
        "published",

      message:
        `${getPlatformLabel(
          post.platform
        )} published successfully.`,

      platformPostId:
        post.platform_post_id,
    };
  }

  if (
    status ===
    POST_STATUS.FAILED
  ) {
    return {
      id:
        post.id,

      platform:
        post.platform,

      status:
        "failed",

      message:
        `${getPlatformLabel(
          post.platform
        )} failed to publish.`,

      error:
        getPostError(
          post
        ),
    };
  }

  if (
    status ===
    POST_STATUS.PROCESSING
  ) {
    return {
      id:
        post.id,

      platform:
        post.platform,

      status:
        "processing",

      message:
        `${getPlatformLabel(
          post.platform
        )} is still processing.`,
    };
  }

  return {
    id:
      post.id,

    platform:
      post.platform,

    status:
      "scheduled",

    message:
      `${getPlatformLabel(
        post.platform
      )} is queued for publishing.`,
  };
}

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
  ] =
    useState<
      | "create"
      | "ideas"
      | "planner"
    >(
      "create"
    );

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
    >(
      []
    );

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
    >(
      []
    );

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

  const [
    organisationId,
    setOrganisationId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    tiktokCreatorInfo,
    setTikTokCreatorInfo,
  ] =
    useState<
      TikTokCreatorInfo | null
    >(
      null
    );

  const [
    tiktokCreatorLoading,
    setTikTokCreatorLoading,
  ] =
    useState(
      false
    );

  const [
    tiktokCreatorError,
    setTikTokCreatorError,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    tiktokSettings,
    setTikTokSettings,
  ] =
    useState<
      TikTokPostSettings
    >({
      privacy_level:
        "",

      allow_comment:
        false,

      allow_duet:
        false,

      allow_stitch:
        false,

      commercial_content:
        false,

      brand_organic_toggle:
        false,

      brand_content_toggle:
        false,

      is_aigc:
        false,

      consent_given:
        false,
    });

  // ==========================================================
  // MEDIA
  // ==========================================================

  const [
    mediaItems,
    setMediaItems,
  ] =
    useState<
      ComposerMediaItem[]
    >(
      []
    );

  const [
    isUploadingMedia,
    setIsUploadingMedia,
  ] =
    useState(
      false
    );

  const [
    generatingCaption,
    setGeneratingCaption,
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

  const [
    retryingPostId,
    setRetryingPostId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    publishSummary,
    setPublishSummary,
  ] =
    useState<
      PublishSummary | null
    >(
      null
    );

  // ==========================================================
  // EDITING SCHEDULED POST
  // ==========================================================

  const [
    editingPostIds,
    setEditingPostIds,
  ] =
    useState<
      Partial<
        Record<
          PlatformId,
          string
        >
      >
    >(
      {}
    );

  const isEditingScheduledPost =
    Object.keys(
      editingPostIds
    ).length >
    0;

  // ==========================================================
  // POSTS
  // ==========================================================

  const [
    posts,
    setPosts,
  ] =
    useState<
      SocialPost[]
    >(
      []
    );

  const [
    accounts,
    setAccounts,
  ] =
    useState<
      SocialAccount[]
    >(
      []
    );

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
    >(
      []
    );

  // ==========================================================
  // REFS
  // ==========================================================

  const mountedRef =
    useRef(
      true
    );

  const mediaItemsRef =
    useRef<
      ComposerMediaItem[]
    >(
      []
    );

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
          url ||
            "",

          key ||
            ""
        );
      },
      []
    );

  // ==========================================================
  // MOUNT
  // ==========================================================

  useEffect(
    () => {
      mountedRef.current =
        true;

      return () => {
        mountedRef.current =
          false;

        mediaItemsRef
          .current
          .forEach(
            (
              item
            ) => {
              if (
                !item.existingUrl
              ) {
                URL.revokeObjectURL(
                  item.previewUrl
                );
              }
            }
          );
      };
    },
    []
  );

  // ==========================================================
  // KEEP MEDIA REF CURRENT
  // ==========================================================

  useEffect(
    () => {
      mediaItemsRef.current =
        mediaItems;
    },
    [
      mediaItems,
    ]
  );

  // ==========================================================
  // AUTO CAROUSEL FORMAT
  // ==========================================================

  useEffect(
    () => {
      if (
        mediaItems.length >
          1 &&
        format ===
          "Post"
      ) {
        setFormat(
          "Carousel"
        );
      }

      if (
        mediaItems.length <=
          1 &&
        format ===
          "Carousel"
      ) {
        setFormat(
          "Post"
        );
      }
    },
    [
      mediaItems.length,
      format,
    ]
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
            await supabase
              .auth
              .getUser();

          if (
            !mountedRef.current
          ) {
            return;
          }

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

            toast.error(
              "You must be signed in to use Social Studio."
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

          if (
            mountedRef.current
          ) {
            setOrganisationId(
              organisationId
            );
          }

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
              window
                .localStorage
                .getItem(
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

          if (
            !mountedRef.current
          ) {
            return;
          }

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

          if (
            mountedRef.current
          ) {
            setBusinessLoaded(
              true
            );
          }
        } finally {
          if (
            mountedRef.current
          ) {
            setBusinessLoading(
              false
            );
          }
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
      async (
        quiet =
          false
      ) => {
        if (
          !user?.id
        ) {
          return [];
        }

        if (
          !quiet
        ) {
          setStatus(
            "Syncing"
          );
        }

        try {
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
                media_urls,
                scheduled_for,
                status,
                format,
                platform_post_id,
                error,
                last_error,
                attempts,
                analytics,
                platform_response,
                tiktok_settings
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
            throw error;
          }

          const loadedPosts =
            (
              data ||
              []
            ) as SocialPost[];

          if (
            mountedRef.current
          ) {
            setPosts(
              loadedPosts
            );
          }

          return loadedPosts;
        } catch (
          error:
            unknown
        ) {
          console.error(
            "Social posts fetch error:",
            error
          );

          if (
            !quiet
          ) {
            toast.error(
              error instanceof
                Error
                ? `Could not load posts: ${error.message}`
                : "Could not load posts."
            );
          }

          return [];
        } finally {
          if (
            !quiet &&
            mountedRef.current
          ) {
            setStatus(
              "Ready"
            );
          }
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

      void syncPosts();
    },
    [
      user?.id,
      syncPosts,
    ]
  );

  // ==========================================================
  // LOAD ACCOUNTS
  // ==========================================================

  const loadAccounts =
    useCallback(
      async (
        quiet =
          false
      ) => {
        if (
          !user?.id
        ) {
          setAccounts(
            []
          );

          return;
        }

        try {
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
            throw error;
          }

          if (
            mountedRef.current
          ) {
            setAccounts(
              (
                data ||
                []
              ) as SocialAccount[]
            );
          }
        } catch (
          error:
            unknown
        ) {
          console.error(
            "Social accounts error:",
            error
          );

          if (
            !quiet
          ) {
            toast.error(
              error instanceof
                Error
                ? `Could not load social connections: ${error.message}`
                : "Could not load social connections."
            );
          }
        }
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
  // FOCUS REFRESH
  // ==========================================================

  useEffect(
    () => {
      const handleFocus =
        () => {
          void loadAccounts(
            true
          );

          void syncPosts(
            true
          );
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
      syncPosts,
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
              void syncPosts(
                true
              );
            }
          )
          .subscribe();

      return () => {
        void supabase
          .removeChannel(
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
      const files =
        Array.from(
          event.target.files ||
            []
        );

      if (
        !files.length
      ) {
        return;
      }

      const availableSlots =
        MAX_MEDIA_ITEMS -
        mediaItems.length;

      if (
        availableSlots <=
        0
      ) {
        toast.error(
          `You can add up to ${MAX_MEDIA_ITEMS} media items.`
        );

        event.target.value =
          "";

        return;
      }

      const acceptedFiles =
        files.slice(
          0,
          availableSlots
        );

      const validItems:
        ComposerMediaItem[] =
        [];

      const rejectedNames:
        string[] =
        [];

      for (
        const file of
        acceptedFiles
      ) {
        const isImage =
          file.type.startsWith(
            "image/"
          );

        const isVideo =
          file.type.startsWith(
            "video/"
          );

        if (
          !isImage &&
          !isVideo
        ) {
          rejectedNames.push(
            file.name
          );

          continue;
        }

        if (
          file.size >
          MAX_FILE_SIZE
        ) {
          rejectedNames.push(
            file.name
          );

          continue;
        }

        validItems.push({
          id:
            crypto.randomUUID(),

          file,

          existingUrl:
            null,

          previewUrl:
            URL.createObjectURL(
              file
            ),

          type:
            isVideo
              ? "video"
              : "image",
        });
      }

      if (
        files.length >
        availableSlots
      ) {
        toast.warning(
          `Only ${availableSlots} more media item${
            availableSlots ===
            1
              ? ""
              : "s"
          } could be added.`
        );
      }

      if (
        rejectedNames.length
      ) {
        toast.error(
          `${rejectedNames.length} file${
            rejectedNames.length ===
            1
              ? " was"
              : "s were"
          } skipped. Use images/videos under 250 MB.`
        );
      }

      if (
        validItems.length
      ) {
        setMediaItems(
          (
            previous
          ) => [
            ...previous,
            ...validItems,
          ]
        );

        toast.success(
          validItems.length ===
            1
            ? `${validItems[0].file?.name || "Media"} is ready to upload`
            : `${validItems.length} media items added`
        );
      }

      event.target.value =
        "";
    };

  // ==========================================================
  // REMOVE ONE MEDIA ITEM
  // ==========================================================

  const removeMediaItem =
    (
      mediaId:
        string
    ) => {
      setMediaItems(
        (
          previous
        ) => {
          const item =
            previous.find(
              (
                media
              ) =>
                media.id ===
                mediaId
            );

          if (
            item &&
            !item.existingUrl
          ) {
            URL.revokeObjectURL(
              item.previewUrl
            );
          }

          return previous.filter(
            (
              media
            ) =>
              media.id !==
              mediaId
          );
        }
      );
    };

  // ==========================================================
  // MOVE MEDIA
  // ==========================================================

  const moveMediaItem =
    (
      index:
        number,

      direction:
        | "left"
        | "right"
    ) => {
      setMediaItems(
        (
          previous
        ) => {
          const targetIndex =
            direction ===
            "left"
              ? index -
                1
              : index +
                1;

          if (
            targetIndex <
              0 ||
            targetIndex >=
              previous.length
          ) {
            return previous;
          }

          const updated =
            [
              ...previous,
            ];

          const current =
            updated[index];

          updated[index] =
            updated[
              targetIndex
            ];

          updated[
            targetIndex
          ] =
            current;

          return updated;
        }
      );
    };

  // ==========================================================
  // CLEAR MEDIA
  // ==========================================================

  const clearMedia =
    () => {
      mediaItems.forEach(
        (
          item
        ) => {
          if (
            !item.existingUrl
          ) {
            URL.revokeObjectURL(
              item.previewUrl
            );
          }
        }
      );

      setMediaItems(
        []
      );
    };

  // ==========================================================
  // GENERATE CAPTION + HASHTAGS FROM MEDIA
  // ==========================================================

  const generateCaptionFromMedia =
    async () => {
      if (
        generatingCaption ||
        isPosting ||
        isUploadingMedia
      ) {
        return;
      }

      if (
        mediaItems.length ===
        0
      ) {
        toast.error(
          "Add an image or video first."
        );

        return;
      }

      setGeneratingCaption(
        true
      );

      setStatus(
        "Analysing media..."
      );

      try {
        const formData =
          new FormData();

        formData.set(
          "businessName",
          businessProfile.name ||
            ""
        );

        formData.set(
          "businessDescription",
          compactText([
            businessProfile.description,
            businessProfile.services,
          ])
        );

        formData.set(
          "audience",
          businessProfile.audience ||
            ""
        );

        formData.set(
          "tone",
          businessProfile.tone ||
            ""
        );

        formData.set(
          "goals",
          businessProfile.goals ||
            ""
        );

        formData.set(
          "platforms",
          JSON.stringify(
            platforms
          )
        );

        formData.set(
          "format",
          format
        );

        formData.set(
          "currentCaption",
          caption
        );

        formData.set(
          "currentHashtags",
          hashtags
        );

        const existingUrls =
          mediaItems
            .map(
              (
                item
              ) =>
                item.existingUrl ||
                ""
            )
            .filter(
              Boolean
            );

        formData.set(
          "mediaUrls",
          JSON.stringify(
            existingUrls
          )
        );

        let visualItemsAdded =
          existingUrls.filter(
            (
              url
            ) =>
              !isVideoUrl(
                url
              )
          ).length;

        // ====================================================
        // NEW LOCAL MEDIA
        //
        // Images are sent directly. For videos we extract one
        // representative frame so the AI can understand the
        // actual visual instead of uploading the whole video.
        // ====================================================

        for (
          const item of
          mediaItems
        ) {
          if (
            item.existingUrl ||
            !item.file
          ) {
            continue;
          }

          if (
            item.type ===
            "image"
          ) {
            formData.append(
              "files",
              item.file
            );

            visualItemsAdded +=
              1;

            continue;
          }

          const frame =
            await extractVideoFrameFile(
              item.file
            );

          if (
            frame
          ) {
            formData.append(
              "files",
              frame
            );

            visualItemsAdded +=
              1;
          }
        }

        if (
          visualItemsAdded ===
            0 &&
          existingUrls.length ===
            0
        ) {
          throw new Error(
            "TOTS-OS could not read the selected media. Try adding an image or a different video."
          );
        }

        setStatus(
          "Writing caption..."
        );

        const response =
          await fetch(
            "/api/social/generate-caption",
            {
              method:
                "POST",

              body:
                formData,

              cache:
                "no-store",
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
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.error ||
            "AI caption generation failed."
          );
        }

        const generatedCaption =
          typeof result.caption ===
            "string"
            ? result.caption.trim()
            : "";

        const generatedHashtags =
          typeof result.hashtags ===
            "string"
            ? result.hashtags.trim()
            : "";

        if (
          !generatedCaption
        ) {
          throw new Error(
            "The AI did not return a caption."
          );
        }

        setCaption(
          generatedCaption
        );

        setHashtags(
          generatedHashtags
        );

        toast.success(
          "Caption and hashtags generated"
        );
      } catch (
        error:
          unknown
      ) {
        console.error(
          "AI caption generation error:",
          error
        );

        toast.error(
          error instanceof
            Error
            ? error.message
            : "Could not generate a caption from this media."
        );
      } finally {
        if (
          mountedRef.current
        ) {
          setGeneratingCaption(
            false
          );

          setStatus(
            "Ready"
          );
        }
      }
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

  const linkedinAccount =
    accounts.find(
      (
        account
      ) =>
        cleanPlatform(
          account.platform
        ) ===
        "linkedin"
    );

  const linkedinConnected =
    Boolean(
      linkedinAccount
    );

  const tiktokAccount =
    accounts.find(
      (
        account
      ) =>
        cleanPlatform(
          account.platform
        ) ===
        "tiktok"
    );

  const tiktokConnected =
    Boolean(
      tiktokAccount
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

        case "linkedin":
          return linkedinConnected;

        case "tiktok":
          return tiktokConnected;

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
          "linkedin" &&
        linkedinConnected
      ) {
        return (
          linkedinAccount
            ?.display_name ||
          "LinkedIn connected"
        );
      }

      if (
        platform ===
          "tiktok" &&
        tiktokConnected
      ) {
        return (
          tiktokAccount
            ?.display_name ||
          "TikTok connected"
        );
      }

      return "Not connected";
    };

  // ==========================================================
  // TIKTOK CREATOR INFO / AUDIT-COMPLIANT SETTINGS
  // ==========================================================

  const tiktokSelected =
    platforms.includes(
      "tiktok"
    );

  const tiktokHasVideo =
    mediaItems.some(
      (
        item
      ) =>
        item.type ===
        "video"
    );

  const tiktokHasImage =
    mediaItems.some(
      (
        item
      ) =>
        item.type ===
        "image"
    );

  const loadTikTokCreatorInfo =
    useCallback(
      async () => {
        if (
          !user?.id ||
          !tiktokConnected
        ) {
          return;
        }

        setTikTokCreatorLoading(
          true
        );

        setTikTokCreatorError(
          null
        );

        try {
          const response =
            await fetch(
              "/api/social/tiktok/creator-info",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    organisationId,
                  }),
              }
            );

          const body =
            await response
              .json()
              .catch(
                () =>
                  ({})
              );

          if (
            !response.ok
          ) {
            throw new Error(
              body?.error ||
                body?.message ||
                "Could not load TikTok creator settings."
            );
          }

          const raw =
            body?.creator ||
            body?.data ||
            body;

          const creator:
            TikTokCreatorInfo = {
            open_id:
              raw?.open_id ||
              null,

            display_name:
              raw?.display_name ||
              tiktokAccount
                ?.display_name ||
              null,

            avatar_url:
              raw?.avatar_url ||
              null,

            privacy_level_options:
              Array.isArray(
                raw?.privacy_level_options
              )
                ? raw.privacy_level_options
                : [],

            comment_disabled:
              Boolean(
                raw?.comment_disabled
              ),

            duet_disabled:
              Boolean(
                raw?.duet_disabled
              ),

            stitch_disabled:
              Boolean(
                raw?.stitch_disabled
              ),

            max_video_post_duration_sec:
              typeof raw
                ?.max_video_post_duration_sec ===
              "number"
                ? raw.max_video_post_duration_sec
                : null,
          };

          setTikTokCreatorInfo(
            creator
          );

          setTikTokSettings(
            (
              previous
            ) => ({
              ...previous,

              privacy_level:
                creator
                  .privacy_level_options
                  .includes(
                    previous
                      .privacy_level
                  )
                  ? previous
                      .privacy_level
                  : "",

              allow_comment:
                creator
                  .comment_disabled
                  ? false
                  : previous
                      .allow_comment,

              allow_duet:
                creator
                  .duet_disabled
                  ? false
                  : previous
                      .allow_duet,

              allow_stitch:
                creator
                  .stitch_disabled
                  ? false
                  : previous
                      .allow_stitch,
            })
          );
        } catch (
          error:
            unknown
        ) {
          const message =
            error instanceof
              Error
              ? error.message
              : "Could not load TikTok creator settings.";

          console.error(
            "TikTok creator info error:",
            error
          );

          setTikTokCreatorInfo(
            null
          );

          setTikTokCreatorError(
            message
          );
        } finally {
          if (
            mountedRef.current
          ) {
            setTikTokCreatorLoading(
              false
            );
          }
        }
      },
      [
        organisationId,
        tiktokAccount
          ?.display_name,
        tiktokConnected,
        user?.id,
      ]
    );

  useEffect(
    () => {
      if (
        !tiktokSelected ||
        !tiktokConnected
      ) {
        return;
      }

      void loadTikTokCreatorInfo();
    },
    [
      tiktokSelected,
      tiktokConnected,
      loadTikTokCreatorInfo,
    ]
  );

  const formatTikTokPrivacyLabel =
    (
      value:
        string
    ) => {
      switch (
        value
      ) {
        case "PUBLIC_TO_EVERYONE":
          return "Everyone";

        case "MUTUAL_FOLLOW_FRIENDS":
          return "Friends";

        case "FOLLOWER_OF_CREATOR":
          return "Followers";

        case "SELF_ONLY":
          return "Only me";

        default:
          return value
            .toLowerCase()
            .replaceAll(
              "_",
              " "
            )
            .replace(
              /\b\w/g,
              (
                char
              ) =>
                char.toUpperCase()
            );
      }
    };

  const validateTikTokSettings =
    () => {
      if (
        !tiktokSelected
      ) {
        return true;
      }

      if (
        mediaItems.length ===
        0
      ) {
        toast.error(
          "TikTok requires an image or video."
        );

        return false;
      }

      if (
        tiktokHasVideo &&
        tiktokHasImage
      ) {
        toast.error(
          "TikTok posts cannot mix photos and videos in the same post."
        );

        return false;
      }

      if (
        tiktokCreatorLoading
      ) {
        toast.error(
          "Wait for TikTok settings to finish loading."
        );

        return false;
      }

      if (
        !tiktokCreatorInfo
      ) {
        toast.error(
          tiktokCreatorError ||
            "Refresh the TikTok settings before publishing."
        );

        return false;
      }

      if (
        !tiktokSettings
          .privacy_level
      ) {
        toast.error(
          "Choose who can view your TikTok post."
        );

        return false;
      }

      if (
        tiktokSettings
          .commercial_content &&
        !tiktokSettings
          .brand_organic_toggle &&
        !tiktokSettings
          .brand_content_toggle
      ) {
        toast.error(
          "Choose what the TikTok commercial content promotes."
        );

        return false;
      }

      if (
        tiktokSettings
          .brand_content_toggle &&
        tiktokSettings
          .privacy_level ===
          "SELF_ONLY"
      ) {
        toast.error(
          "Branded TikTok content cannot use Only me visibility."
        );

        return false;
      }

      if (
        !tiktokSettings
          .consent_given
      ) {
        toast.error(
          "Confirm TikTok's publishing declaration before continuing."
        );

        return false;
      }

      return true;
    };

  // ==========================================================
  // PLATFORM TOGGLE
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
        toast.error(
          `${getPlatformLabel(
            platform
          )} is not connected. Connect it in Settings first.`
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
  // VALIDATION
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
          toast.error(
            `${getPlatformLabel(
              platform
            )} is not connected.`
          );

          return false;
        }
      }

      return true;
    };

  // ==========================================================
  // IDEAS
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
                "Educational list content is easy to save, share and repurpose.",

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
                "If you are trying to get better results, these are the things we wish more people knew before getting started.\n\nSave this for later — it might save you a lot of time.",

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
                "Founder and behind-the-scenes content builds familiarity and trust.",

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
                "A strong contrarian hook creates curiosity while demonstrating expertise.",

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
                "#businessadvice #tips #smallbusinessowner #businessgrowth",

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
                "Outcome-led content shows value without requiring a hard sales pitch.",

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
                "This is the bit we love most — seeing the difference between where someone started and where they ended up.\n\nThat transformation is the whole point.",

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
                "Opinion content encourages comments and establishes a recognisable point of view.",

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

      setEditingPostIds(
        {}
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
        concept
          .platforms
          .filter(
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
  // RUN WORKER
  // ==========================================================

  const runPublishingWorker =
    useCallback(
      async () => {
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

              cache:
                "no-store",
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
            result
              ?.error ||
            result
              ?.details
              ?.error ||
            "The publishing worker could not run."
          );
        }

        return result;
      },
      []
    );

  // ==========================================================
  // FETCH SPECIFIC POSTS
  // ==========================================================

  const fetchPostsByIds =
    useCallback(
      async (
        ids:
          string[]
      ) => {
        if (
          !ids.length
        ) {
          return [];
        }

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
              media_urls,
              scheduled_for,
              status,
              format,
              platform_post_id,
              error,
              last_error,
              attempts,
              analytics,
              platform_response,
              tiktok_settings
            `)
            .in(
              "id",
              ids
            );

        if (
          error
        ) {
          throw error;
        }

        return (
          data ||
          []
        ) as SocialPost[];
      },
      [
        supabase,
      ]
    );

  // ==========================================================
  // WAIT FOR PUBLISH RESULT
  // ==========================================================

  const waitForPublishResults =
    useCallback(
      async (
        ids:
          string[]
      ) => {
        const maxChecks =
          6;

        let latest:
          SocialPost[] =
          [];

        for (
          let check =
            0;
          check <
          maxChecks;
          check +=
            1
        ) {
          latest =
            await fetchPostsByIds(
              ids
            );

          const settled =
            latest.every(
              (
                post
              ) =>
                post.status ===
                  POST_STATUS.PUBLISHED ||
                post.status ===
                  POST_STATUS.FAILED ||
                post.status ===
                  POST_STATUS.PROCESSING
            );

          if (
            settled
          ) {
            break;
          }

          if (
            check <
            maxChecks -
              1
          ) {
            await sleep(
              1000
            );
          }
        }

        return latest;
      },
      [
        fetchPostsByIds,
      ]
    );

  // ==========================================================
  // RESET COMPOSER
  // ==========================================================

  const resetComposer =
    () => {
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

      setFormat(
        "Post"
      );

      setTikTokCreatorInfo(
        null
      );

      setTikTokCreatorError(
        null
      );

      setTikTokSettings({
        privacy_level:
          "",

        allow_comment:
          false,

        allow_duet:
          false,

        allow_stitch:
          false,

        commercial_content:
          false,

        brand_organic_toggle:
          false,

        brand_content_toggle:
          false,

        is_aigc:
          false,

        consent_given:
          false,
      });

      setEditingPostIds(
        {}
      );
    };

  // ==========================================================
  // EDIT SCHEDULED POST
  // ==========================================================

  const editScheduledPost =
    (
      selectedPost:
        SocialPost
    ) => {
      if (
        selectedPost.status !==
        POST_STATUS.SCHEDULED
      ) {
        toast.error(
          "Only scheduled posts can be edited."
        );

        return;
      }

      const matchingPosts =
        posts.filter(
          (
            post
          ) =>
            post.status ===
              POST_STATUS.SCHEDULED &&
            post.scheduled_for ===
              selectedPost.scheduled_for &&
            post.caption ===
              selectedPost.caption &&
            (
              post.hashtags ||
              ""
            ) ===
              (
                selectedPost.hashtags ||
                ""
              ) &&
            post.format ===
              selectedPost.format &&
            sameMedia(
              post,
              selectedPost
            )
        );

      const group =
        matchingPosts.length
          ? matchingPosts
          : [
              selectedPost,
            ];

      const ids:
        Partial<
          Record<
            PlatformId,
            string
          >
        > =
        {};

      const editablePlatforms:
        PlatformId[] =
        [];

      for (
        const post of
        group
      ) {
        const platform =
          cleanPlatform(
            post.platform
          ) as PlatformId;

        if (
          [
            "facebook",
            "instagram",
            "linkedin",
            "tiktok",
          ].includes(
            platform
          )
        ) {
          ids[
            platform
          ] =
            post.id;

          editablePlatforms.push(
            platform
          );
        }
      }

      clearMedia();

      const existingMedia =
        getPostMediaUrls(
          selectedPost
        ).map(
          (
            url
          ): ComposerMediaItem => ({
            id:
              crypto.randomUUID(),

            file:
              null,

            existingUrl:
              url,

            previewUrl:
              url,

            type:
              isVideoUrl(
                url
              )
                ? "video"
                : "image",
          })
        );

      setEditingPostIds(
        ids
      );

      setCaption(
        selectedPost.caption ||
          ""
      );

      setHashtags(
        selectedPost.hashtags ||
          ""
      );

      setFormat(
        selectedPost.format ||
          "Post"
      );

      setScheduledTime(
        toDateTimeLocalValue(
          selectedPost.scheduled_for
        )
      );

      setPlatforms(
        Array.from(
          new Set(
            editablePlatforms
          )
        )
      );

      setMediaItems(
        existingMedia
      );

      setMetaScript(
        ""
      );

      setMetaAudio(
        ""
      );

      setSelectedConcept(
        null
      );

      const selectedTikTokPost =
        group.find(
          (
            post
          ) =>
            cleanPlatform(
              post.platform
            ) ===
            "tiktok"
        );

      if (
        selectedTikTokPost
          ?.tiktok_settings
      ) {
        setTikTokSettings({
          privacy_level:
            selectedTikTokPost
              .tiktok_settings
              .privacy_level ||
            "",

          allow_comment:
            Boolean(
              selectedTikTokPost
                .tiktok_settings
                .allow_comment
            ),

          allow_duet:
            Boolean(
              selectedTikTokPost
                .tiktok_settings
                .allow_duet
            ),

          allow_stitch:
            Boolean(
              selectedTikTokPost
                .tiktok_settings
                .allow_stitch
            ),

          commercial_content:
            Boolean(
              selectedTikTokPost
                .tiktok_settings
                .commercial_content
            ),

          brand_organic_toggle:
            Boolean(
              selectedTikTokPost
                .tiktok_settings
                .brand_organic_toggle
            ),

          brand_content_toggle:
            Boolean(
              selectedTikTokPost
                .tiktok_settings
                .brand_content_toggle
            ),

          is_aigc:
            Boolean(
              selectedTikTokPost
                .tiktok_settings
                .is_aigc
            ),

          consent_given:
            false,
        });
      }

      setPreviewPost(
        null
      );

      setIsDayViewOpen(
        false
      );

      setPublishSummary(
        null
      );

      setViewMode(
        "create"
      );

      window.setTimeout(
        () => {
          window.scrollTo({
            top:
              0,

            behavior:
              "smooth",
          });
        },
        50
      );

      toast.success(
        group.length >
          1
          ? `${group.length} scheduled platform posts opened for editing`
          : "Scheduled post opened for editing"
      );
    };

  // ==========================================================
  // RESOLVE COMPOSER MEDIA
  // ==========================================================

  const resolveComposerMedia =
    async () => {
      if (
        !user?.id
      ) {
        throw new Error(
          "You must be signed in."
        );
      }

      const finalMediaUrls:
        string[] =
        [];

      if (
        mediaItems.length
      ) {
        setIsUploadingMedia(
          true
        );

        for (
          let index =
            0;
          index <
          mediaItems.length;
          index +=
            1
        ) {
          const mediaItem =
            mediaItems[
              index
            ];

          // ====================================================
          // EXISTING MEDIA
          // ====================================================

          if (
            mediaItem.existingUrl
          ) {
            finalMediaUrls.push(
              mediaItem.existingUrl
            );

            continue;
          }

          // ====================================================
          // NEW MEDIA
          // ====================================================

          if (
            !mediaItem.file
          ) {
            continue;
          }

          setStatus(
            `Uploading media ${index + 1} of ${mediaItems.length}...`
          );

          const extension =
            mediaItem
              .file
              .name
              .split(
                "."
              )
              .pop()
              ?.toLowerCase() ||
            (
              mediaItem.type ===
              "video"
                ? "mp4"
                : "jpg"
            );

          const filePath =
            `${user.id}/${crypto.randomUUID()}.${extension}`;

          const {
            error:
              uploadError,
          } =
            await supabase
              .storage
              .from(
                "social-assets"
              )
              .upload(
                filePath,
                mediaItem.file,
                {
                  cacheControl:
                    "3600",

                  upsert:
                    false,

                  contentType:
                    mediaItem
                      .file
                      .type ||
                    undefined,
                }
              );

          if (
            uploadError
          ) {
            throw new Error(
              `Media upload failed for ${mediaItem.file.name}: ${uploadError.message}`
            );
          }

          const {
            data:
              publicData,
          } =
            supabase
              .storage
              .from(
                "social-assets"
              )
              .getPublicUrl(
                filePath
              );

          const publicUrl =
            publicData
              ?.publicUrl;

          if (
            !publicUrl
          ) {
            throw new Error(
              `The uploaded media URL could not be created for ${mediaItem.file.name}.`
            );
          }

          finalMediaUrls.push(
            publicUrl
          );
        }
      }

      setIsUploadingMedia(
        false
      );

      return finalMediaUrls;
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
        isPosting ||
        isUploadingMedia
      ) {
        return false;
      }

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

      if (
        !validateTikTokSettings()
      ) {
        return false;
      }

      const hasInstagram =
        platforms.includes(
          "instagram"
        );

      if (
        hasInstagram &&
        mediaItems.length ===
          0
      ) {
        toast.error(
          "Instagram requires an image or video."
        );

        return false;
      }

      if (
        format ===
          "Carousel" &&
        mediaItems.length <
          2
      ) {
        toast.error(
          "A carousel needs at least two images or videos."
        );

        return false;
      }

      if (
        format ===
        "Reel"
      ) {
        const hasVideo =
          mediaItems.some(
            (
              item
            ) =>
              item.type ===
              "video"
          );

        if (
          !hasVideo
        ) {
          toast.error(
            "A Reel needs a video."
          );

          return false;
        }
      }

      if (
        !instant &&
        !scheduledTime
      ) {
        toast.error(
          "Choose when you want the post published."
        );

        return false;
      }

      if (
        !instant
      ) {
        const scheduledDate =
          new Date(
            scheduledTime
          );

        if (
          Number.isNaN(
            scheduledDate.getTime()
          )
        ) {
          toast.error(
            "The scheduled date is invalid."
          );

          return false;
        }

        if (
          scheduledDate.getTime() <=
          Date.now()
        ) {
          toast.error(
            "Choose a future time for a scheduled post."
          );

          return false;
        }
      }

      setIsPosting(
        true
      );

      setPublishSummary(
        null
      );

      setStatus(
        instant
          ? "Preparing post..."
          : "Scheduling..."
      );

      let insertedIds:
        string[] =
        [];

      try {
        const finalMediaUrls =
          await resolveComposerMedia();

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

        setStatus(
          instant
            ? "Saving post..."
            : "Saving schedule..."
        );

        const rows =
          platforms.map(
            (
              platform
            ) => ({
              user_id:
                user.id,

              organisation_id:
                organisationId,

              caption:
                caption.trim(),

              platform,

              tiktok_settings:
                platform ===
                  "tiktok"
                  ? tiktokSettings
                  : null,

              hashtags:
                hashtags
                  .trim() ||
                null,

              media_url:
                finalMediaUrls[
                  0
                ] ||
                null,

              media_urls:
                finalMediaUrls,

              scheduled_for:
                publishDate
                  .toISOString(),

              status:
                POST_STATUS.SCHEDULED,

              format,

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
            .select(`
              id,
              caption,
              platform,
              hashtags,
              media_url,
              media_urls,
              scheduled_for,
              status,
              format,
              platform_post_id,
              error,
              last_error,
              attempts,
              analytics,
              platform_response,
              tiktok_settings
            `);

        if (
          insertError
        ) {
          throw new Error(
            `The post could not be saved: ${insertError.message}`
          );
        }

        if (
          !insertedPosts
            ?.length
        ) {
          throw new Error(
            "The post was not saved."
          );
        }

        const createdPosts =
          insertedPosts as SocialPost[];

        insertedIds =
          createdPosts.map(
            (
              post
            ) =>
              post.id
          );

        // ======================================================
        // SCHEDULE ONLY
        // ======================================================

        if (
          !instant
        ) {
          const results =
            createdPosts.map(
              (
                post
              ): PublishResult => ({
                id:
                  post.id,

                platform:
                  post.platform,

                status:
                  "scheduled",

                message:
                  `${getPlatformLabel(
                    post.platform
                  )} scheduled for ${publishDate.toLocaleString()}.`,
              })
            );

          setPublishSummary({
            mode:
              "scheduled",

            createdAt:
              new Date()
                .toISOString(),

            results,
          });

          toast.success(
            platforms.length >
              1
              ? `${platforms.length} posts scheduled successfully`
              : `${getPlatformLabel(
                  platforms[0]
                )} post scheduled successfully`
          );

          resetComposer();

          await syncPosts(
            true
          );

          return true;
        }

        // ======================================================
        // PUBLISH NOW
        // ======================================================

        setStatus(
          "Publishing..."
        );

        try {
          await runPublishingWorker();
        } catch (
          workerError:
            unknown
        ) {
          console.error(
            "Publishing worker error:",
            workerError
          );

          const fallbackPosts =
            await fetchPostsByIds(
              insertedIds
            );

          const fallbackResults =
            fallbackPosts.length
              ? fallbackPosts.map(
                  resultFromPost
                )
              : createdPosts.map(
                  (
                    post
                  ): PublishResult => ({
                    id:
                      post.id,

                    platform:
                      post.platform,

                    status:
                      "scheduled",

                    message:
                      `${getPlatformLabel(
                        post.platform
                      )} was saved but the publishing worker could not be confirmed.`,

                    error:
                      workerError instanceof
                        Error
                        ? workerError.message
                        : "Publishing worker failed.",
                  })
                );

          setPublishSummary({
            mode:
              "instant",

            createdAt:
              new Date()
                .toISOString(),

            results:
              fallbackResults,
          });

          toast.error(
            "Your post was saved, but TOTS-OS could not confirm publishing. Check the result panel below."
          );

          await syncPosts(
            true
          );

          return false;
        }

        // ======================================================
        // VERIFY RESULT
        // ======================================================

        setStatus(
          "Checking result..."
        );

        const finalPosts =
          await waitForPublishResults(
            insertedIds
          );

        const results =
          finalPosts.length
            ? finalPosts.map(
                resultFromPost
              )
            : createdPosts.map(
                resultFromPost
              );

        setPublishSummary({
          mode:
            "instant",

          createdAt:
            new Date()
              .toISOString(),

          results,
        });

        const publishedCount =
          results.filter(
            (
              result
            ) =>
              result.status ===
              "published"
          ).length;

        const failedCount =
          results.filter(
            (
              result
            ) =>
              result.status ===
              "failed"
          ).length;

        const pendingCount =
          results.filter(
            (
              result
            ) =>
              result.status ===
                "processing" ||
              result.status ===
                "scheduled"
          ).length;

        if (
          publishedCount ===
          results.length
        ) {
          toast.success(
            results.length >
              1
              ? "All selected platforms published successfully"
              : `${getPlatformLabel(
                  results[0]
                    .platform
                )} published successfully`
          );

          resetComposer();
        } else if (
          publishedCount >
          0
        ) {
          toast.warning(
            `${publishedCount} published, ${failedCount} failed, ${pendingCount} still pending.`
          );
        } else if (
          failedCount >
          0 &&
          pendingCount ===
          0
        ) {
          toast.error(
            "The post could not be published. See the error below."
          );
        } else {
          toast.info(
            "Your post has been submitted and is still being processed."
          );

          resetComposer();
        }

        await syncPosts(
          true
        );

        return (
          publishedCount >
            0 ||
          pendingCount >
            0
        );
      } catch (
        error:
          unknown
      ) {
        console.error(
          "Social post error:",
          error
        );

        toast.error(
          error instanceof
            Error
            ? error.message
            : "Something went wrong while creating the post."
        );

        if (
          insertedIds.length
        ) {
          await syncPosts(
            true
          );
        }

        return false;
      } finally {
        if (
          mountedRef.current
        ) {
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
      }
    };

  // ==========================================================
  // SAVE SCHEDULED CHANGES
  // ==========================================================

  const saveScheduledChanges =
    async () => {
      if (
        !isEditingScheduledPost ||
        isPosting ||
        isUploadingMedia
      ) {
        return;
      }

      if (
        !user?.id
      ) {
        toast.error(
          "You must be signed in."
        );

        return;
      }

      if (
        !caption.trim()
      ) {
        toast.error(
          "Write a caption first."
        );

        return;
      }

      if (
        platforms.length ===
        0
      ) {
        toast.error(
          "Choose at least one platform."
        );

        return;
      }

      if (
        !validateConnections()
      ) {
        return;
      }

      if (
        !validateTikTokSettings()
      ) {
        return;
      }

      if (
        platforms.includes(
          "instagram"
        ) &&
        mediaItems.length ===
          0
      ) {
        toast.error(
          "Instagram requires an image or video."
        );

        return;
      }

      if (
        format ===
          "Carousel" &&
        mediaItems.length <
          2
      ) {
        toast.error(
          "A carousel needs at least two images or videos."
        );

        return;
      }

      if (
        format ===
        "Reel"
      ) {
        const hasVideo =
          mediaItems.some(
            (
              item
            ) =>
              item.type ===
              "video"
          );

        if (
          !hasVideo
        ) {
          toast.error(
            "A Reel needs a video."
          );

          return;
        }
      }

      if (
        !scheduledTime
      ) {
        toast.error(
          "Choose when you want the post published."
        );

        return;
      }

      const publishDate =
        new Date(
          scheduledTime
        );

      if (
        Number.isNaN(
          publishDate.getTime()
        )
      ) {
        toast.error(
          "The scheduled date is invalid."
        );

        return;
      }

      if (
        publishDate.getTime() <=
        Date.now()
      ) {
        toast.error(
          "Choose a future time for the scheduled post."
        );

        return;
      }

      setIsPosting(
        true
      );

      setStatus(
        "Saving changes..."
      );

      setPublishSummary(
        null
      );

      try {
        const finalMediaUrls =
          await resolveComposerMedia();

        const firstMediaUrl =
          finalMediaUrls[
            0
          ] ||
          null;

        const existingPlatforms =
          Object.keys(
            editingPostIds
          ) as PlatformId[];

        // ======================================================
        // UPDATE / CREATE SELECTED PLATFORMS
        // ======================================================

        for (
          const platform of
          platforms
        ) {
          const existingId =
            editingPostIds[
              platform
            ];

          const payload = {
            organisation_id:
              organisationId,

            caption:
              caption.trim(),

            hashtags:
              hashtags.trim() ||
              null,

            media_url:
              firstMediaUrl,

            media_urls:
              finalMediaUrls,

            scheduled_for:
              publishDate
                .toISOString(),

            format,

            status:
              POST_STATUS.SCHEDULED,

            attempts:
              0,

            retry_count:
              0,

            posted_at:
              null,

            platform_post_id:
              null,

            platform_response:
              null,

            last_attempt_at:
              null,

            last_error:
              null,

            error:
              null,

            tiktok_settings:
              platform ===
                "tiktok"
                ? tiktokSettings
                : null,
          };

          if (
            existingId
          ) {
            const {
              error,
            } =
              await supabase
                .from(
                  "socials"
                )
                .update(
                  payload
                )
                .eq(
                  "id",
                  existingId
                )
                .eq(
                  "user_id",
                  user.id
                )
                .eq(
                  "status",
                  POST_STATUS.SCHEDULED
                );

            if (
              error
            ) {
              throw new Error(
                `${getPlatformLabel(
                  platform
                )} could not be updated: ${error.message}`
              );
            }
          } else {
            const {
              error,
            } =
              await supabase
                .from(
                  "socials"
                )
                .insert({
                  user_id:
                    user.id,

                  organisation_id:
                    organisationId,

                  platform,

                  ...payload,
                });

            if (
              error
            ) {
              throw new Error(
                `${getPlatformLabel(
                  platform
                )} could not be added: ${error.message}`
              );
            }
          }
        }

        // ======================================================
        // DELETE REMOVED PLATFORMS
        // ======================================================

        const removedPlatforms =
          existingPlatforms.filter(
            (
              platform
            ) =>
              !platforms.includes(
                platform
              )
          );

        for (
          const platform of
          removedPlatforms
        ) {
          const id =
            editingPostIds[
              platform
            ];

          if (
            !id
          ) {
            continue;
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
                id
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "status",
                POST_STATUS.SCHEDULED
              );

          if (
            error
          ) {
            throw new Error(
              `${getPlatformLabel(
                platform
              )} could not be removed: ${error.message}`
            );
          }
        }

        toast.success(
          platforms.length >
            1
            ? "Scheduled posts updated successfully"
            : "Scheduled post updated successfully"
        );

        resetComposer();

        await syncPosts(
          true
        );

        setViewMode(
          "planner"
        );
      } catch (
        error:
          unknown
      ) {
        console.error(
          "Scheduled post edit error:",
          error
        );

        toast.error(
          error instanceof
            Error
            ? error.message
            : "The scheduled post could not be updated."
        );
      } finally {
        if (
          mountedRef.current
        ) {
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
      }
    };

  // ==========================================================
  // RETRY / PUBLISH EXISTING POST
  // ==========================================================

  const retryPost =
    async (
      postId:
        string
    ) => {
      if (
        retryingPostId ||
        isPosting
      ) {
        return;
      }

      setRetryingPostId(
        postId
      );

      setStatus(
        "Retrying..."
      );

      try {
        const {
          data:
            currentPost,

          error:
            currentPostError,
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
              media_urls,
              scheduled_for,
              status,
              format,
              platform_post_id,
              error,
              last_error,
              attempts,
              analytics,
              platform_response,
              tiktok_settings
            `)
            .eq(
              "id",
              postId
            )
            .maybeSingle();

        if (
          currentPostError
        ) {
          throw currentPostError;
        }

        if (
          !currentPost
        ) {
          throw new Error(
            "The post could not be found."
          );
        }

        const platform =
          cleanPlatform(
            currentPost.platform
          ) as PlatformId;

        if (
          !isConnected(
            platform
          )
        ) {
          throw new Error(
            `${getPlatformLabel(
              platform
            )} is no longer connected. Reconnect it before retrying.`
          );
        }

        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              "socials"
            )
            .update({
              status:
                POST_STATUS.SCHEDULED,

              scheduled_for:
                new Date()
                  .toISOString(),

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
          updateError
        ) {
          throw updateError;
        }

        await runPublishingWorker();

        const finalPosts =
          await waitForPublishResults([
            postId,
          ]);

        const finalPost =
          finalPosts[0];

        if (
          !finalPost
        ) {
          throw new Error(
            "TOTS-OS could not confirm the publishing result."
          );
        }

        const result =
          resultFromPost(
            finalPost
          );

        setPublishSummary({
          mode:
            "instant",

          createdAt:
            new Date()
              .toISOString(),

          results: [
            result,
          ],
        });

        if (
          result.status ===
          "published"
        ) {
          toast.success(
            `${getPlatformLabel(
              finalPost.platform
            )} published successfully`
          );

          setPreviewPost(
            null
          );
        } else if (
          result.status ===
          "failed"
        ) {
          toast.error(
            result.error ||
            `${getPlatformLabel(
              finalPost.platform
            )} publishing failed`
          );
        } else {
          toast.info(
            `${getPlatformLabel(
              finalPost.platform
            )} is still processing`
          );
        }

        await syncPosts(
          true
        );
      } catch (
        error:
          unknown
      ) {
        console.error(
          "Retry error:",
          error
        );

        toast.error(
          error instanceof
            Error
            ? error.message
            : "The post could not be retried."
        );

        await syncPosts(
          true
        );
      } finally {
        setRetryingPostId(
          null
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
      await retryPost(
        postId
      );
    };

  // ==========================================================
  // DELETE
  // ==========================================================

  const deletePost =
    async (
      postId:
        string
    ) => {
      if (
        !window.confirm(
          "Delete this post? This removes it from the TOTS-OS planner."
        )
      ) {
        return;
      }

      try {
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
          throw error;
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

        if (
          previewPost
            ?.id ===
          postId
        ) {
          setPreviewPost(
            null
          );
        }

        toast.success(
          "Post deleted"
        );

        await syncPosts(
          true
        );
      } catch (
        error:
          unknown
      ) {
        toast.error(
          error instanceof
            Error
            ? error.message
            : "Post could not be deleted."
        );
      }
    };

  // ==========================================================
  // MANUAL REFRESH
  // ==========================================================

  const refreshEverything =
    async () => {
      setStatus(
        "Refreshing..."
      );

      try {
        await Promise.all([
          syncPosts(
            true
          ),

          loadAccounts(
            true
          ),
        ]);

        toast.success(
          "Social Studio refreshed"
        );
      } catch {
        toast.error(
          "Could not fully refresh Social Studio."
        );
      } finally {
        setStatus(
          "Ready"
        );
      }
    };

  // ==========================================================
  // CALENDAR
  // ==========================================================

  const calendarDays =
    useMemo(
      () => {
        const year =
          currentDate
            .getFullYear();

        const month =
          currentDate
            .getMonth();

        const firstDay =
          new Date(
            year,
            month,
            1
          ).getDay();

        const daysInMonth =
          new Date(
            year,
            month +
              1,
            0
          ).getDate();

        const days:
          number[] =
          [];

        for (
          let i =
            0;
          i <
          firstDay;
          i +=
            1
        ) {
          days.push(
            0
          );
        }

        for (
          let day =
            1;
          day <=
          daysInMonth;
          day +=
            1
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
          currentDate
            .getFullYear(),

          currentDate
            .getMonth(),

          day
        );

      const dayPosts =
        posts.filter(
          (
            post
          ) =>
            post
              .scheduled_for &&
            isSameDay(
              post
                .scheduled_for,

              day,

              currentDate
                .getMonth(),

              currentDate
                .getFullYear()
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
        clickedDate
          .getFullYear();

      const month =
        String(
          clickedDate
            .getMonth() +
            1
        ).padStart(
          2,
          "0"
        );

      const date =
        String(
          clickedDate
            .getDate()
        ).padStart(
          2,
          "0"
        );

      setEditingPostIds(
        {}
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
  // PREVIEW MEDIA
  // ==========================================================

  const previewMediaUrls =
    previewPost
      ? getPostMediaUrls(
          previewPost
        )
      : [];

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
                      : status ===
                          "Not authenticated"
                        ? "bg-red-400"
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
              disabled={
                isPosting
              }
              onClick={() =>
                void refreshEverything()
              }
              className="rounded-xl border border-stone-200 bg-white p-3 text-stone-400 transition hover:text-stone-900 disabled:opacity-50"
            >
              <RefreshCcw
                size={
                  15
                }
                className={
                  status.includes(
                    "Refresh"
                  ) ||
                  status ===
                    "Syncing"
                    ? "animate-spin"
                    : ""
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

        {/* ====================================================
            LATEST RESULT
        ==================================================== */}

        <AnimatePresence>
          {publishSummary && (
            <motion.section
              initial={{
                opacity:
                  0,

                y:
                  -10,
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

                y:
                  -10,
              }}
              className="mb-8 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm md:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#829473]">
                    Latest publishing result
                  </p>

                  <h2 className="mt-2 font-serif text-2xl italic text-stone-800">
                    {publishSummary.mode ===
                    "scheduled"
                      ? "Schedule saved"
                      : "Publishing report"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPublishSummary(
                      null
                    )
                  }
                  className="rounded-full bg-stone-50 p-2 text-stone-400 hover:text-stone-700"
                >
                  <X
                    size={
                      14
                    }
                  />
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {publishSummary
                  .results
                  .map(
                    (
                      result
                    ) => (
                      <div
                        key={
                          result.id
                        }
                        className={`rounded-2xl border p-4 ${getStatusBackground(
                          result.status
                        )}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {result.status ===
                            "published" ? (
                              <CheckCircle2
                                size={
                                  17
                                }
                                className="text-emerald-600"
                              />
                            ) : result.status ===
                              "failed" ? (
                              <XCircle
                                size={
                                  17
                                }
                                className="text-red-500"
                              />
                            ) : result.status ===
                              "processing" ? (
                              <CircleDashed
                                size={
                                  17
                                }
                                className="animate-spin text-amber-500"
                              />
                            ) : (
                              <CalendarDays
                                size={
                                  17
                                }
                                className="text-blue-500"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-black text-stone-700">
                              {getPlatformLabel(
                                result.platform
                              )}
                            </p>

                            <p
                              className={`mt-1 text-[9px] font-black uppercase tracking-[0.14em] ${getStatusTextColor(
                                result.status
                              )}`}
                            >
                              {
                                result.status
                              }
                            </p>

                            <p className="mt-2 text-[10px] leading-5 text-stone-500">
                              {
                                result.message
                              }
                            </p>

                            {result.error && (
                              <p className="mt-2 break-words text-[10px] leading-5 text-red-600">
                                {
                                  result.error
                                }
                              </p>
                            )}

                            {result.status ===
                              "failed" && (
                              <button
                                type="button"
                                disabled={
                                  retryingPostId ===
                                  result.id
                                }
                                onClick={() =>
                                  void retryPost(
                                    result.id
                                  )
                                }
                                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[8px] font-black uppercase tracking-wider text-stone-600 shadow-sm disabled:opacity-50"
                              >
                                <RotateCcw
                                  size={
                                    11
                                  }
                                  className={
                                    retryingPostId ===
                                    result.id
                                      ? "animate-spin"
                                      : ""
                                  }
                                />

                                Retry
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

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
                    {isEditingScheduledPost
                      ? "Edit Scheduled Content"
                      : "Create Content"}
                  </p>

                  <h2 className="font-serif text-5xl italic tracking-tight md:text-7xl">
                    {isEditingScheduledPost
                      ? "Make your changes."
                      : "What are we posting?"}
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
                    {isEditingScheduledPost
                      ? "Update your content, media, platforms or scheduled time. Your existing scheduled post will be updated rather than duplicated."
                      : "Choose exactly where your post should go. TOTS-OS will track each platform separately so you can see exactly what succeeded and what failed."}
                  </p>
                </div>

                {!isEditingScheduledPost && (
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
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

                {/* ==============================================
                    COMPOSER
                ============================================== */}

                <section className="space-y-5 rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">

                  {/* ==================================================
                      EDITING BANNER
                  ================================================== */}

                  {isEditingScheduledPost && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm">
                            <Pencil
                              size={
                                15
                              }
                            />
                          </div>

                          <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-blue-500">
                              Editing scheduled post
                            </p>

                            <p className="mt-1 text-xs leading-5 text-stone-500">
                              Update the content, media, platforms or scheduled time below.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={
                            isPosting
                          }
                          onClick={() => {
                            resetComposer();

                            setViewMode(
                              "planner"
                            );
                          }}
                          className="rounded-xl bg-white px-3 py-2 text-[8px] font-black uppercase tracking-wider text-stone-400 shadow-sm transition hover:text-red-500 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedConcept && (
                    <div className="rounded-2xl border border-[#a9b897]/30 bg-[#a9b897]/10 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#71805f]">
                            Created from idea
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

                  {/* ==================================================
                      MEDIA
                  ================================================== */}

                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-stone-400">
                        <ImageIcon
                          size={
                            12
                          }
                        />

                        Photos & Videos
                      </label>

                      {mediaItems.length >
                        0 && (
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black uppercase tracking-wider text-stone-300">
                            {
                              mediaItems.length
                            }
                            /
                            {
                              MAX_MEDIA_ITEMS
                            }
                          </span>

                          <button
                            type="button"
                            disabled={
                              isPosting
                            }
                            onClick={
                              clearMedia
                            }
                            className="text-[8px] font-black uppercase tracking-wider text-red-400 transition hover:text-red-500 disabled:opacity-50"
                          >
                            Remove all
                          </button>
                        </div>
                      )}
                    </div>

                    {mediaItems.length ===
                    0 ? (
                      <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-[2rem] border border-dashed border-stone-200 bg-stone-50">
                        <label className="flex h-full min-h-[260px] w-full cursor-pointer flex-col items-center justify-center p-12 text-center">
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
                            Upload images or videos
                          </p>

                          <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-stone-300">
                            Up to{" "}
                            {
                              MAX_MEDIA_ITEMS
                            }{" "}
                            items
                          </p>

                          <input
                            type="file"
                            multiple
                            disabled={
                              isPosting
                            }
                            accept="image/*,video/*"
                            onChange={
                              handleMediaUpload
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-4">

                        <div
                          className={`grid gap-3 ${
                            mediaItems.length ===
                            1
                              ? "grid-cols-1"
                              : "grid-cols-2 md:grid-cols-3"
                          }`}
                        >
                          {mediaItems.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={
                                  item.id
                                }
                                className={`group relative overflow-hidden rounded-[1.5rem] border bg-stone-100 ${
                                  index ===
                                  0
                                    ? "border-[#a9b897]"
                                    : "border-stone-200"
                                } ${
                                  mediaItems.length ===
                                  1
                                    ? "min-h-[300px]"
                                    : "aspect-square"
                                }`}
                              >
                                {item.type ===
                                "video" ? (
                                  <video
                                    src={
                                      item.previewUrl
                                    }
                                    controls={
                                      mediaItems.length ===
                                      1
                                    }
                                    muted={
                                      mediaItems.length >
                                      1
                                    }
                                    playsInline
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={
                                      item.previewUrl
                                    }
                                    alt={`Media ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                )}

                                {index ===
                                  0 && (
                                  <div className="absolute left-3 top-3 rounded-full bg-stone-900/90 px-3 py-1.5 text-[7px] font-black uppercase tracking-wider text-white backdrop-blur">
                                    Cover
                                  </div>
                                )}

                                {item.existingUrl && (
                                  <div className="absolute left-3 top-11 rounded-full bg-white/90 px-2.5 py-1 text-[7px] font-black uppercase tracking-wider text-[#71805f] backdrop-blur">
                                    Existing
                                  </div>
                                )}

                                <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[7px] font-black uppercase tracking-wider text-stone-600 backdrop-blur">
                                  {item.type ===
                                  "video"
                                    ? "Video"
                                    : `Image ${index + 1}`}
                                </div>

                                <button
                                  type="button"
                                  disabled={
                                    isPosting
                                  }
                                  onClick={() =>
                                    removeMediaItem(
                                      item.id
                                    )
                                  }
                                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-stone-900/90 text-white shadow-lg backdrop-blur transition hover:bg-red-500 disabled:opacity-50"
                                >
                                  <X
                                    size={
                                      13
                                    }
                                  />
                                </button>

                                {mediaItems.length >
                                  1 && (
                                  <div className="absolute bottom-3 right-3 flex gap-1 rounded-xl bg-stone-900/85 p-1 backdrop-blur">
                                    <button
                                      type="button"
                                      disabled={
                                        isPosting ||
                                        index ===
                                          0
                                      }
                                      onClick={() =>
                                        moveMediaItem(
                                          index,
                                          "left"
                                        )
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition hover:bg-white/10 disabled:opacity-20"
                                      aria-label="Move media left"
                                    >
                                      <ChevronLeft
                                        size={
                                          14
                                        }
                                      />
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        isPosting ||
                                        index ===
                                          mediaItems.length -
                                            1
                                      }
                                      onClick={() =>
                                        moveMediaItem(
                                          index,
                                          "right"
                                        )
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition hover:bg-white/10 disabled:opacity-20"
                                      aria-label="Move media right"
                                    >
                                      <ChevronRight
                                        size={
                                          14
                                        }
                                      />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>

                        {mediaItems.length <
                          MAX_MEDIA_ITEMS && (
                          <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-5 py-4 text-[9px] font-black uppercase tracking-wider text-stone-500 transition hover:border-[#a9b897] hover:bg-[#f7f9f2] hover:text-[#71805f]">
                            <Plus
                              size={
                                14
                              }
                            />

                            Add More Media

                            <input
                              type="file"
                              multiple
                              disabled={
                                isPosting
                              }
                              accept="image/*,video/*"
                              onChange={
                                handleMediaUpload
                              }
                              className="hidden"
                            />
                          </label>
                        )}

                        {mediaItems.length >
                          1 && (
                          <div className="flex items-start gap-3 rounded-2xl border border-[#a9b897]/20 bg-[#a9b897]/10 p-4">
                            <Layers
                              size={
                                14
                              }
                              className="mt-0.5 shrink-0 text-[#71805f]"
                            />

                            <div>
                              <p className="text-[8px] font-black uppercase tracking-wider text-[#71805f]">
                                Carousel
                              </p>

                              <p className="mt-1 text-[10px] leading-5 text-stone-500">
                                Your media will publish in the order shown above.
                                The first item will be used as the cover.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CAPTION */}

                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
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

                      <button
                        type="button"
                        disabled={
                          generatingCaption ||
                          isPosting ||
                          isUploadingMedia ||
                          mediaItems.length ===
                            0
                        }
                        onClick={() =>
                          void generateCaptionFromMedia()
                        }
                        className="flex items-center gap-2 rounded-xl bg-[#edf3e7] px-3.5 py-2.5 text-[8px] font-black uppercase tracking-wider text-[#71805f] transition hover:bg-[#dde8d3] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {generatingCaption ? (
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

                        {generatingCaption
                          ? "Writing..."
                          : caption.trim()
                            ? "Rewrite with AI"
                            : "Generate with AI"}
                      </button>
                    </div>

                    {mediaItems.length ===
                      0 && (
                      <div className="mb-3 flex items-start gap-2 rounded-xl bg-stone-50 px-3 py-2.5">
                        <Sparkles
                          size={
                            12
                          }
                          className="mt-0.5 shrink-0 text-[#8fa07d]"
                        />

                        <p className="text-[9px] leading-4 text-stone-400">
                          Add an image or video and TOTS-OS can write the caption and hashtags from the media.
                        </p>
                      </div>
                    )}

                    <textarea
                      disabled={
                        isPosting ||
                        generatingCaption
                      }
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
                      className="min-h-[220px] w-full resize-y rounded-[2rem] border border-stone-200 bg-[#faf9f6] p-6 text-base leading-8 outline-none transition focus:border-[#a9b897] disabled:opacity-60"
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
                      disabled={
                        isPosting ||
                        generatingCaption
                      }
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
                      className="w-full rounded-2xl border border-stone-200 bg-[#faf9f6] p-4 text-sm outline-none focus:border-[#a9b897] disabled:opacity-60"
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
                          Filming / Content Guide
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

                  {/* CONNECTIONS */}

                  <div className="rounded-[2rem] border border-stone-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">
                          Where should it go?
                        </p>

                        <p className="mt-1 text-[10px] leading-5 text-stone-400">
                          Each platform is published and tracked separately.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void loadAccounts()
                        }
                        className="rounded-lg bg-stone-50 p-2 text-stone-400"
                      >
                        <RefreshCcw
                          size={
                            12
                          }
                        />
                      </button>
                    </div>

                    <div className="mt-5 space-y-2">
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
                              disabled={
                                isPosting
                              }
                              onClick={() =>
                                togglePlatform(
                                  platform.id
                                )
                              }
                              className={`relative flex w-full items-center justify-between overflow-hidden rounded-2xl border p-4 text-left transition ${
                                selected
                                  ? "border-[#a9b897] bg-[#a9b897]/10"
                                  : connected
                                    ? "border-stone-100 bg-stone-50 hover:border-stone-200"
                                    : "border-stone-100 bg-stone-50 opacity-55"
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
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xs font-black">
                                      {
                                        platform.name
                                      }
                                    </p>

                                    {connected && (
                                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-emerald-600">
                                        Connected
                                      </span>
                                    )}
                                  </div>

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
                                      : "Not connected — connect in Settings"}
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

                    {platforms.length >
                      0 && (
                      <div className="mt-4 rounded-2xl border border-[#a9b897]/30 bg-[#a9b897]/10 p-4">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#71805f]">
                          {isEditingScheduledPost
                            ? "Scheduled for"
                            : "Publishing to"}
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
                                {getPlatformLabel(
                                  platform
                                )}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TIKTOK SETTINGS */}

                  {tiktokSelected && (
                    <div className="rounded-[2rem] border border-stone-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white">
                            <Music
                              size={
                                17
                              }
                            />
                          </div>

                          <div>
                            <p className="text-xs font-black">
                              TikTok settings
                            </p>

                            <p className="mt-1 text-[9px] leading-4 text-stone-400">
                              Required by TikTok before this post can be published.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={
                            tiktokCreatorLoading ||
                            isPosting
                          }
                          onClick={() =>
                            void loadTikTokCreatorInfo()
                          }
                          className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-[8px] font-black uppercase tracking-wider text-stone-600 disabled:opacity-50"
                        >
                          {tiktokCreatorLoading ? (
                            <Loader2
                              size={
                                12
                              }
                              className="animate-spin"
                            />
                          ) : (
                            <RefreshCcw
                              size={
                                12
                              }
                            />
                          )}

                          Refresh
                        </button>
                      </div>

                      {tiktokCreatorLoading &&
                        !tiktokCreatorInfo && (
                        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-stone-50 p-4">
                          <Loader2
                            size={
                              15
                            }
                            className="animate-spin text-[#71805f]"
                          />

                          <p className="text-[10px] text-stone-500">
                            Loading your current TikTok creator settings…
                          </p>
                        </div>
                      )}

                      {tiktokCreatorError && (
                        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle
                              size={
                                15
                              }
                              className="mt-0.5 shrink-0 text-red-500"
                            />

                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-red-700">
                                TikTok settings unavailable
                              </p>

                              <p className="mt-1 text-[10px] leading-5 text-red-600">
                                {
                                  tiktokCreatorError
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {tiktokCreatorInfo && (
                        <div className="mt-5 space-y-5">
                          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
                            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-stone-400">
                              Posting to
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                              {tiktokCreatorInfo
                                .avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={
                                    tiktokCreatorInfo
                                      .avatar_url
                                  }
                                  alt="TikTok profile"
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-500 shadow-sm">
                                  <Music
                                    size={
                                      16
                                    }
                                  />
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="truncate text-xs font-black text-stone-800">
                                  {tiktokCreatorInfo
                                    .display_name ||
                                    tiktokAccount
                                      ?.display_name ||
                                    "Connected TikTok account"}
                                </p>

                                <p className="mt-1 text-[9px] text-stone-400">
                                  TikTok creator account
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-stone-500">
                              Who can view this post? *
                            </label>

                            <select
                              value={
                                tiktokSettings
                                  .privacy_level
                              }
                              disabled={
                                isPosting ||
                                tiktokCreatorLoading
                              }
                              onChange={(
                                event
                              ) => {
                                const privacy =
                                  event
                                    .target
                                    .value;

                                setTikTokSettings(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    privacy_level:
                                      privacy,
                                  })
                                );
                              }}
                              className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs font-bold outline-none disabled:opacity-60"
                            >
                              <option value="">
                                Select privacy
                              </option>

                              {tiktokCreatorInfo
                                .privacy_level_options
                                .map(
                                  (
                                    option
                                  ) => {
                                    const disabled =
                                      tiktokSettings
                                        .brand_content_toggle &&
                                      option ===
                                        "SELF_ONLY";

                                    return (
                                      <option
                                        key={
                                          option
                                        }
                                        value={
                                          option
                                        }
                                        disabled={
                                          disabled
                                        }
                                      >
                                        {formatTikTokPrivacyLabel(
                                          option
                                        )}
                                      </option>
                                    );
                                  }
                                )}
                            </select>

                            <p className="mt-2 text-[9px] leading-4 text-stone-400">
                              TikTok requires you to choose this manually for each post.
                            </p>
                          </div>

                          <div>
                            <p className="mb-3 text-[9px] font-black uppercase tracking-wider text-stone-500">
                              Allow people to
                            </p>

                            <div className="grid gap-2 sm:grid-cols-3">
                              <label
                                className={`flex items-center gap-3 rounded-xl border p-3 ${
                                  tiktokCreatorInfo
                                    .comment_disabled
                                    ? "cursor-not-allowed border-stone-100 bg-stone-50 opacity-50"
                                    : "cursor-pointer border-stone-100 bg-stone-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    tiktokSettings
                                      .allow_comment
                                  }
                                  disabled={
                                    isPosting ||
                                    tiktokCreatorInfo
                                      .comment_disabled
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setTikTokSettings(
                                      (
                                        previous
                                      ) => ({
                                        ...previous,
                                        allow_comment:
                                          event
                                            .target
                                            .checked,
                                      })
                                    )
                                  }
                                  className="h-4 w-4 accent-[#a9b897]"
                                />

                                <span className="text-[10px] font-bold text-stone-600">
                                  Comments
                                </span>
                              </label>

                              {tiktokHasVideo && (
                                <>
                                  <label
                                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                                      tiktokCreatorInfo
                                        .duet_disabled
                                        ? "cursor-not-allowed border-stone-100 bg-stone-50 opacity-50"
                                        : "cursor-pointer border-stone-100 bg-stone-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        tiktokSettings
                                          .allow_duet
                                      }
                                      disabled={
                                        isPosting ||
                                        tiktokCreatorInfo
                                          .duet_disabled
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setTikTokSettings(
                                          (
                                            previous
                                          ) => ({
                                            ...previous,
                                            allow_duet:
                                              event
                                                .target
                                                .checked,
                                          })
                                        )
                                      }
                                      className="h-4 w-4 accent-[#a9b897]"
                                    />

                                    <span className="text-[10px] font-bold text-stone-600">
                                      Duet
                                    </span>
                                  </label>

                                  <label
                                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                                      tiktokCreatorInfo
                                        .stitch_disabled
                                        ? "cursor-not-allowed border-stone-100 bg-stone-50 opacity-50"
                                        : "cursor-pointer border-stone-100 bg-stone-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        tiktokSettings
                                          .allow_stitch
                                      }
                                      disabled={
                                        isPosting ||
                                        tiktokCreatorInfo
                                          .stitch_disabled
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setTikTokSettings(
                                          (
                                            previous
                                          ) => ({
                                            ...previous,
                                            allow_stitch:
                                              event
                                                .target
                                                .checked,
                                          })
                                        )
                                      }
                                      className="h-4 w-4 accent-[#a9b897]"
                                    />

                                    <span className="text-[10px] font-bold text-stone-600">
                                      Stitch
                                    </span>
                                  </label>
                                </>
                              )}
                            </div>

                            {(tiktokCreatorInfo
                              .comment_disabled ||
                              (tiktokHasVideo &&
                                (tiktokCreatorInfo
                                  .duet_disabled ||
                                  tiktokCreatorInfo
                                    .stitch_disabled))) && (
                              <p className="mt-2 text-[9px] leading-4 text-stone-400">
                                Disabled options follow the privacy settings on the connected TikTok account.
                              </p>
                            )}
                          </div>

                          <div className="space-y-3 rounded-2xl border border-stone-100 bg-stone-50 p-4">
                            <label className="flex cursor-pointer items-start justify-between gap-4">
                              <div>
                                <p className="text-[10px] font-black text-stone-700">
                                  Commercial content
                                </p>

                                <p className="mt-1 text-[9px] leading-4 text-stone-400">
                                  Turn this on if the post promotes a brand, product or service.
                                </p>
                              </div>

                              <input
                                type="checkbox"
                                checked={
                                  tiktokSettings
                                    .commercial_content
                                }
                                disabled={
                                  isPosting
                                }
                                onChange={(
                                  event
                                ) => {
                                  const checked =
                                    event
                                      .target
                                      .checked;

                                  setTikTokSettings(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,
                                      commercial_content:
                                        checked,
                                      brand_organic_toggle:
                                        checked
                                          ? previous
                                              .brand_organic_toggle
                                          : false,
                                      brand_content_toggle:
                                        checked
                                          ? previous
                                              .brand_content_toggle
                                          : false,
                                    })
                                  );
                                }}
                                className="mt-1 h-4 w-4 accent-[#a9b897]"
                              />
                            </label>

                            {tiktokSettings
                              .commercial_content && (
                              <div className="grid gap-2 border-t border-stone-200 pt-3 sm:grid-cols-2">
                                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3">
                                  <input
                                    type="checkbox"
                                    checked={
                                      tiktokSettings
                                        .brand_organic_toggle
                                    }
                                    disabled={
                                      isPosting
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setTikTokSettings(
                                        (
                                          previous
                                        ) => ({
                                          ...previous,
                                          brand_organic_toggle:
                                            event
                                              .target
                                              .checked,
                                        })
                                      )
                                    }
                                    className="mt-0.5 h-4 w-4 accent-[#a9b897]"
                                  />

                                  <span>
                                    <span className="block text-[10px] font-black text-stone-700">
                                      Your brand
                                    </span>

                                    <span className="mt-1 block text-[8px] leading-4 text-stone-400">
                                      Promoting your own business, product or service.
                                    </span>
                                  </span>
                                </label>

                                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3">
                                  <input
                                    type="checkbox"
                                    checked={
                                      tiktokSettings
                                        .brand_content_toggle
                                    }
                                    disabled={
                                      isPosting
                                    }
                                    onChange={(
                                      event
                                    ) => {
                                      const checked =
                                        event
                                          .target
                                          .checked;

                                      setTikTokSettings(
                                        (
                                          previous
                                        ) => ({
                                          ...previous,
                                          brand_content_toggle:
                                            checked,
                                          privacy_level:
                                            checked &&
                                            previous
                                              .privacy_level ===
                                              "SELF_ONLY"
                                              ? ""
                                              : previous
                                                  .privacy_level,
                                        })
                                      );
                                    }}
                                    className="mt-0.5 h-4 w-4 accent-[#a9b897]"
                                  />

                                  <span>
                                    <span className="block text-[10px] font-black text-stone-700">
                                      Branded content
                                    </span>

                                    <span className="mt-1 block text-[8px] leading-4 text-stone-400">
                                      Promoting another brand or third party.
                                    </span>
                                  </span>
                                </label>
                              </div>
                            )}
                          </div>

                          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-stone-100 bg-stone-50 p-4">
                            <div>
                              <p className="text-[10px] font-black text-stone-700">
                                AI-generated content
                              </p>

                              <p className="mt-1 text-[9px] leading-4 text-stone-400">
                                Turn this on when the media itself was generated or significantly altered using AI.
                              </p>
                            </div>

                            <input
                              type="checkbox"
                              checked={
                                tiktokSettings
                                  .is_aigc
                              }
                              disabled={
                                isPosting
                              }
                              onChange={(
                                event
                              ) =>
                                setTikTokSettings(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    is_aigc:
                                      event
                                        .target
                                        .checked,
                                  })
                                )
                              }
                              className="mt-1 h-4 w-4 accent-[#a9b897]"
                            />
                          </label>

                          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#a9b897]/30 bg-[#a9b897]/10 p-4">
                            <input
                              type="checkbox"
                              checked={
                                tiktokSettings
                                  .consent_given
                              }
                              disabled={
                                isPosting
                              }
                              onChange={(
                                event
                              ) =>
                                setTikTokSettings(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    consent_given:
                                      event
                                        .target
                                        .checked,
                                  })
                                )
                              }
                              className="mt-0.5 h-4 w-4 accent-[#a9b897]"
                            />

                            <span className="text-[9px] leading-5 text-stone-600">
                              I confirm that I have the rights necessary to publish this content and agree to TikTok&apos;s publishing and music usage requirements.
                              {tiktokSettings
                                .brand_content_toggle
                                ? " This post also needs to comply with TikTok's Branded Content Policy."
                                : ""}
                            </span>
                          </label>

                          {!tiktokHasVideo &&
                            tiktokHasImage && (
                            <p className="rounded-xl bg-stone-50 px-3 py-2 text-[9px] leading-4 text-stone-400">
                              Photo post selected. Duet and Stitch are only shown for TikTok video posts.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* FORMAT */}

                  <div className="rounded-[2rem] border border-stone-200 bg-white p-5">
                    <p className="mb-3 text-[9px] font-black uppercase tracking-wider text-stone-400">
                      Format
                    </p>

                    <select
                      disabled={
                        isPosting
                      }
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
                      className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs font-bold outline-none disabled:opacity-60"
                    >
                      <option value="Post">
                        Post
                      </option>

                      <option value="Reel">
                        Reel
                      </option>

                      <option value="Carousel">
                        Carousel
                      </option>
                    </select>

                    {format ===
                      "Carousel" && (
                      <p className="mt-3 text-[9px] leading-5 text-stone-400">
                        Carousel posts require at least two media items.
                      </p>
                    )}

                    {format ===
                      "Reel" && (
                      <p className="mt-3 text-[9px] leading-5 text-stone-400">
                        Reels require video media.
                      </p>
                    )}
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
                          {isEditingScheduledPost
                            ? "Change when this should publish"
                            : "Required only when scheduling"}
                        </p>
                      </div>
                    </div>

                    <input
                      type="datetime-local"
                      disabled={
                        isPosting
                      }
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
                      className="w-full rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs outline-none disabled:opacity-60"
                    />
                  </div>

                  {/* ACTIVE OPERATION */}

                  {(isPosting ||
                    isUploadingMedia) && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <div className="flex items-center gap-3">
                        <Loader2
                          size={
                            15
                          }
                          className="shrink-0 animate-spin text-amber-500"
                        />

                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                            Please wait
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-amber-700">
                            {
                              status
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* POST NOW */}

                  {!isEditingScheduledPost && (
                    <button
                      type="button"
                      disabled={
                        isPosting ||
                        isUploadingMedia ||
                        platforms.length ===
                          0 ||
                        (tiktokSelected &&
                          (!tiktokCreatorInfo ||
                            !tiktokSettings
                              .privacy_level ||
                            !tiktokSettings
                              .consent_given))
                      }
                      onClick={() =>
                        void createPost({
                          instant:
                            true,
                        })
                      }
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#a9b897] px-6 py-5 text-[10px] font-black uppercase tracking-widest text-stone-900 shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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

                      {isPosting
                        ? "Publishing..."
                        : "Post Now"}
                    </button>
                  )}

                  {/* SCHEDULE / SAVE CHANGES */}

                  <button
                    type="button"
                    disabled={
                      isPosting ||
                      isUploadingMedia ||
                      platforms.length ===
                        0 ||
                      (tiktokSelected &&
                        (!tiktokCreatorInfo ||
                          !tiktokSettings
                            .privacy_level ||
                          !tiktokSettings
                            .consent_given))
                    }
                    onClick={() => {
                      if (
                        isEditingScheduledPost
                      ) {
                        void saveScheduledChanges();

                        return;
                      }

                      void createPost({
                        instant:
                          false,
                      });
                    }}
                    className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-5 text-[10px] font-black uppercase tracking-widest shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${
                      isEditingScheduledPost
                        ? "bg-[#a9b897] text-stone-900"
                        : "bg-stone-900 text-[#a9b897]"
                    }`}
                  >
                    {isPosting ? (
                      <Loader2
                        size={
                          15
                        }
                        className="animate-spin"
                      />
                    ) : isEditingScheduledPost ? (
                      <Check
                        size={
                          15
                        }
                      />
                    ) : (
                      <CalendarDays
                        size={
                          15
                        }
                      />
                    )}

                    {isPosting
                      ? isEditingScheduledPost
                        ? "Saving..."
                        : "Scheduling..."
                      : isEditingScheduledPost
                        ? "Save Changes"
                        : "Schedule Post"}
                  </button>

                  {isEditingScheduledPost && (
                    <button
                      type="button"
                      disabled={
                        isPosting
                      }
                      onClick={() => {
                        resetComposer();

                        setViewMode(
                          "planner"
                        );
                      }}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white px-6 py-4 text-[9px] font-black uppercase tracking-widest text-stone-400 transition hover:border-red-200 hover:text-red-500 disabled:opacity-50"
                    >
                      <X
                        size={
                          14
                        }
                      />

                      Cancel Editing
                    </button>
                  )}
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
                    What should we post?
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-stone-500">
                    TOTS-OS uses what it already knows about your business
                    to give you practical content starting points.
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

                  Loading business context...
                </div>
              )}

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
                    Generate a few ideas that fit your business and audience.
                  </p>
                </button>
              )}

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
                          {concept
                            .platforms
                            .map(
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
                        currentDate
                          .getFullYear()
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
                          currentDate
                            .getFullYear(),

                          currentDate
                            .getMonth() -
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
                          currentDate
                            .getFullYear(),

                          currentDate
                            .getMonth() +
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
                                  post
                                    .scheduled_for,

                                  day,

                                  currentDate
                                    .getMonth(),

                                  currentDate
                                    .getFullYear()
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
                                    3
                                  )
                                  .map(
                                    (
                                      post
                                    ) => (
                                      <div
                                        key={
                                          post.id
                                        }
                                        className={`rounded-lg border p-2 ${
                                          post.status ===
                                          "failed"
                                            ? "border-red-100 bg-red-50"
                                            : "border-transparent bg-stone-100"
                                        }`}
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
                                  3 && (
                                  <p className="text-[7px] font-black text-stone-300">
                                    +
                                    {dayPosts.length -
                                      3}{" "}
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
                  ) => {
                    const error =
                      getPostError(
                        post
                      );

                    const postMedia =
                      getPostMediaUrls(
                        post
                      );

                    return (
                      <div
                        key={
                          post.id
                        }
                        className={`rounded-[2rem] border p-5 ${getStatusBackground(
                          post.status
                        )}`}
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

                        {postMedia.length >
                          0 && (
                          <div className="mb-4 flex items-center gap-2">
                            <ImageIcon
                              size={
                                12
                              }
                              className="text-stone-400"
                            />

                            <span className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                              {postMedia.length} media item
                              {postMedia.length ===
                              1
                                ? ""
                                : "s"}
                            </span>
                          </div>
                        )}

                        <p className="line-clamp-3 text-sm leading-6 text-stone-600">
                          {
                            post.caption
                          }
                        </p>

                        {error && (
                          <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/70 p-3">
                            <AlertCircle
                              size={
                                13
                              }
                              className="mt-0.5 shrink-0 text-red-500"
                            />

                            <p className="break-words text-[9px] leading-4 text-red-600">
                              {
                                error
                              }
                            </p>
                          </div>
                        )}

                        <div className="mt-5 flex items-center justify-between border-t border-stone-200/70 pt-4">
                          <span className="flex items-center gap-2 text-[9px] text-stone-400">
                            <Clock
                              size={
                                11
                              }
                            />

                            {new Date(
                              post
                                .scheduled_for
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

                            {/* EDIT */}

                            {post.status ===
                              POST_STATUS.SCHEDULED && (
                              <button
                                type="button"
                                onClick={() =>
                                  editScheduledPost(
                                    post
                                  )
                                }
                                className="rounded-lg p-2 text-stone-400 transition hover:bg-white hover:text-[#71805f]"
                                title="Edit scheduled post"
                              >
                                <Pencil
                                  size={
                                    14
                                  }
                                />
                              </button>
                            )}

                            {/* RETRY */}

                            {post.status ===
                              "failed" && (
                              <button
                                type="button"
                                disabled={
                                  retryingPostId ===
                                  post.id
                                }
                                onClick={() =>
                                  void retryPost(
                                    post.id
                                  )
                                }
                                className="rounded-lg p-2 text-amber-600 hover:bg-white disabled:opacity-50"
                              >
                                <RotateCcw
                                  size={
                                    14
                                  }
                                  className={
                                    retryingPostId ===
                                    post.id
                                      ? "animate-spin"
                                      : ""
                                  }
                                />
                              </button>
                            )}

                            {/* PREVIEW */}

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

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                void deletePost(
                                  post.id
                                )
                              }
                              className="rounded-lg p-2 text-red-400 hover:bg-white"
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
                    );
                  }
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  resetComposer();

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

              {/* ==================================================
                  PREVIEW MEDIA
              ================================================== */}

              {previewMediaUrls.length ===
                1 && (
                <>
                  {isVideoUrl(
                    previewMediaUrls[
                      0
                    ]
                  ) ? (
                    <video
                      src={
                        previewMediaUrls[
                          0
                        ]
                      }
                      controls
                      playsInline
                      className="mb-6 max-h-[450px] w-full rounded-[2rem] bg-black object-contain"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        previewMediaUrls[
                          0
                        ]
                      }
                      alt="Post preview"
                      className="mb-6 max-h-[450px] w-full rounded-[2rem] object-contain"
                    />
                  )}
                </>
              )}

              {previewMediaUrls.length >
                1 && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                      Carousel preview
                    </p>

                    <p className="text-[8px] font-black uppercase tracking-wider text-stone-300">
                      {
                        previewMediaUrls.length
                      }{" "}
                      items
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {previewMediaUrls.map(
                      (
                        mediaUrl,
                        index
                      ) => (
                        <div
                          key={`${mediaUrl}-${index}`}
                          className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-stone-100"
                        >
                          {isVideoUrl(
                            mediaUrl
                          ) ? (
                            <video
                              src={
                                mediaUrl
                              }
                              controls
                              playsInline
                              className="h-full w-full bg-black object-contain"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                mediaUrl
                              }
                              alt={`Post media ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          )}

                          <div className="absolute left-3 top-3 rounded-full bg-stone-900/80 px-2.5 py-1 text-[7px] font-black text-white backdrop-blur">
                            {index ===
                            0
                              ? "Cover"
                              : index +
                                1}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-stone-100 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-stone-500">
                  {
                    previewPost.platform
                  }
                </span>

                <span className="rounded-full bg-stone-100 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-stone-500">
                  {
                    previewPost.format
                  }
                </span>

                {previewMediaUrls.length >
                  1 && (
                  <span className="rounded-full bg-[#edf3e7] px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-[#71805f]">
                    {
                      previewMediaUrls.length
                    }{" "}
                    media
                  </span>
                )}

                <span
                  className={`rounded-full bg-stone-50 px-3 py-1.5 text-[8px] font-black uppercase ${getStatusTextColor(
                    previewPost.status
                  )}`}
                >
                  {
                    previewPost.status
                  }
                </span>

                {typeof previewPost
                  .attempts ===
                  "number" &&
                  previewPost
                    .attempts >
                    0 && (
                  <span className="rounded-full bg-stone-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-stone-400">
                    {
                      previewPost
                        .attempts
                    }{" "}
                    attempt
                    {previewPost
                      .attempts ===
                    1
                      ? ""
                      : "s"}
                  </span>
                )}
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

              <div className="mt-5 rounded-2xl border border-stone-100 bg-stone-50 p-4">
                <div className="flex items-center gap-3">
                  <Clock
                    size={
                      14
                    }
                    className="text-stone-400"
                  />

                  <div>
                    <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                      Scheduled
                    </p>

                    <p className="mt-1 text-xs font-bold text-stone-600">
                      {new Date(
                        previewPost
                          .scheduled_for
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {previewPost.status ===
                "published" && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <CheckCircle2
                    size={
                      16
                    }
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <div>
                    <p className="text-xs font-bold text-emerald-700">
                      Published successfully
                    </p>

                    {previewPost
                      .platform_post_id && (
                      <p className="mt-1 break-all text-[9px] text-emerald-600">
                        Platform post ID:{" "}
                        {
                          previewPost
                            .platform_post_id
                        }
                      </p>
                    )}
                  </div>
                </div>
              )}

              {previewPost.status ===
                "processing" && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <Loader2
                    size={
                      16
                    }
                    className="mt-0.5 shrink-0 animate-spin text-amber-500"
                  />

                  <p className="text-xs leading-5 text-amber-700">
                    The platform has accepted this post and it is still processing.
                  </p>
                </div>
              )}

              {getPostError(
                previewPost
              ) && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                  <AlertCircle
                    size={
                      16
                    }
                    className="mt-0.5 shrink-0 text-red-500"
                  />

                  <div>
                    <p className="text-xs font-bold text-red-700">
                      Publishing failed
                    </p>

                    <p className="mt-1 break-words text-[10px] leading-5 text-red-600">
                      {getPostError(
                        previewPost
                      )}
                    </p>
                  </div>
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

                {previewPost.status ===
                  "failed" && (
                  <button
                    type="button"
                    disabled={
                      retryingPostId ===
                      previewPost.id
                    }
                    onClick={() =>
                      void retryPost(
                        previewPost.id
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-amber-100 px-6 py-3 text-[9px] font-black uppercase tracking-wider text-amber-800 disabled:opacity-50"
                  >
                    {retryingPostId ===
                    previewPost.id ? (
                      <Loader2
                        size={
                          13
                        }
                        className="animate-spin"
                      />
                    ) : (
                      <RotateCcw
                        size={
                          13
                        }
                      />
                    )}

                    Retry Post
                  </button>
                )}

                {previewPost.status ===
                  POST_STATUS.SCHEDULED && (
                  <button
                    type="button"
                    onClick={() =>
                      editScheduledPost(
                        previewPost
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3 text-[9px] font-black uppercase tracking-wider text-stone-600 transition hover:border-[#a9b897] hover:text-[#71805f]"
                  >
                    <Pencil
                      size={
                        13
                      }
                    />

                    Edit Post
                  </button>
                )}

                {previewPost.status ===
                  "scheduled" && (
                  <button
                    type="button"
                    disabled={
                      retryingPostId ===
                      previewPost.id
                    }
                    onClick={() =>
                      void approvePost(
                        previewPost.id
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#a9b897] px-6 py-3 text-[9px] font-black uppercase tracking-wider text-stone-900 disabled:opacity-50"
                  >
                    {retryingPostId ===
                    previewPost.id ? (
                      <Loader2
                        size={
                          13
                        }
                        className="animate-spin"
                      />
                    ) : (
                      <ArrowRight
                        size={
                          13
                        }
                      />
                    )}

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