"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  ChangeEvent,
  useCallback,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  RefreshCcw,
  Layers,
  Sparkles,
  Hash,
  Clock,
  X,
  ArrowRight,
  BarChart3,
  Video,
  Linkedin as LinkedinIcon,
  Plus,
  Film,
  Music,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

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
  analytics?: any;
  platform_response?: any;
}

interface SocialAccount {
  id: string;
  platform: string;
  platform_user_id?: string | null;
  instagram_business_account_id?: string | null;
}

interface ContentConcept {
  id: string;
  title: string;
  trendAngle: string;
  format: "Reel" | "TikTok" | "Post" | "Carousel";
  script: string;
  caption: string;
  hashtags: string;
  recommendedAudio: string;
}

const POST_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  PROCESSING: "processing",
  PUBLISHED: "published",
  FAILED: "failed",
} as const;

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const isSameDay = (
  dateStr: string,
  day: number,
  month: number,
  year: number
) => {
  if (!dateStr) return false;

  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) {
    return false;
  }

  return (
    d.getDate() === day &&
    d.getMonth() === month &&
    d.getFullYear() === year
  );
};

const getStatusColor = (status?: string) => {
  switch (status || "") {
    case "published":
      return "bg-green-500";
    case "scheduled":
      return "bg-blue-400";
    case "processing":
      return "bg-yellow-400";
    case "failed":
      return "bg-red-500";
    case "draft":
      return "bg-stone-300";
    default:
      return "bg-stone-200";
  }
};

const isVideoUrl = (url?: string | null) => {
  if (!url) return false;

  const cleanUrl = url.toLowerCase().split("?")[0];

  return [".mp4", ".mov", ".m4v", ".webm", ".avi"].some((extension) =>
    cleanUrl.endsWith(extension)
  );
};

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

export default function SocialStudioUnified() {
  const [viewMode, setViewMode] = useState<"lab" | "planner">("lab");
  const [status, setStatus] = useState("Ready");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isDayViewOpen, setIsDayViewOpen] = useState(false);

  const [selectedDayPosts, setSelectedDayPosts] = useState<SocialPost[]>([]);

  const [businessContext, setBusinessContext] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [generatedConcepts, setGeneratedConcepts] = useState<ContentConcept[]>(
    []
  );

  const [selectedConcept, setSelectedConcept] =
    useState<ContentConcept | null>(null);

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [format, setFormat] = useState("Post");
  const [scheduledTime, setScheduledTime] = useState("");
  const [metaScript, setMetaScript] = useState("");
  const [metaAudio, setMetaAudio] = useState("");

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const [isPosting, setIsPosting] = useState(false);

  const [postState, setPostState] = useState<
    "idle" | "posting" | "posted"
  >("idle");

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [user, setUser] = useState<any>(null);

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);

  const [selectedAccountId, setSelectedAccountId] = useState("");

  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);

  // --------------------------------------------------
  // SUPABASE
  // --------------------------------------------------

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error("Missing Supabase environment variables");
    }

    return createBrowserClient(url || "", key || "");
  }, []);

  // --------------------------------------------------
  // LOAD POSTS
  // --------------------------------------------------

  const syncPosts = useCallback(async () => {
    if (!user?.id) return;

    setStatus("Syncing");

    const { data, error } = await supabase
      .from("socials")
      .select(
        `
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
        `
      )
      .eq("user_id", user.id)
      .order("scheduled_for", {
        ascending: true,
      });

    if (error) {
      console.error("Social posts fetch error:", error);

      toast.error(`Could not load scheduled posts: ${error.message}`);

      setStatus("Ready");

      return;
    }

    setPosts((data || []) as SocialPost[]);

    setStatus("Ready");
  }, [supabase, user?.id]);

  // --------------------------------------------------
  // AUTH
  // --------------------------------------------------

  useEffect(() => {
    const initAuth = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        console.error("Social Studio auth error:", error);

        setUser(null);

        setStatus("Not authenticated");

        return;
      }

      setUser(data.user);
    };

    void initAuth();
  }, [supabase]);

  useEffect(() => {
    if (!user?.id) return;

    void syncPosts();
  }, [user?.id, syncPosts]);

  // --------------------------------------------------
  // CONNECTED ACCOUNTS
  // --------------------------------------------------

  useEffect(() => {
    const loadAccounts = async () => {
      if (!user?.id) {
        setAccounts([]);

        return;
      }

      const { data, error } = await supabase
        .from("social_accounts")
        .select(
          "id, platform, platform_user_id, instagram_business_account_id"
        )
        .eq("user_id", user.id);

      if (error) {
        console.error("Account load error:", error);

        toast.error(`Could not load connected accounts: ${error.message}`);

        return;
      }

      const loadedAccounts = (data || []) as SocialAccount[];

      setAccounts(loadedAccounts);

      if (!selectedAccountId && loadedAccounts.length > 0) {
        setSelectedAccountId(loadedAccounts[0].id);
      }
    };

    void loadAccounts();
  }, [user?.id, supabase, selectedAccountId]);

  // --------------------------------------------------
  // REALTIME
  // --------------------------------------------------

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`socials_realtime_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "socials",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void syncPosts();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, user?.id, syncPosts]);

  // --------------------------------------------------
  // MEDIA
  // --------------------------------------------------

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }

    setMediaFile(file);

    const localUrl = URL.createObjectURL(file);

    setMediaPreview(localUrl);

    toast.success(`Loaded file: ${file.name}`);
  };

  const clearMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }

    setMediaFile(null);

    setMediaPreview(null);
  };

  // --------------------------------------------------
  // AI
  // --------------------------------------------------

  const analyzeBusinessDNA = async () => {
    if (!businessContext.trim()) {
      toast.error(
        "Please enter your business context to tailor the ideas."
      );

      return;
    }

    setIsAnalyzing(true);

    setStatus("Analyzing Trends...");

    await new Promise((resolve) => setTimeout(resolve, 2200));

    const mockBlueprints: ContentConcept[] = [
      {
        id: "concept-1",
        title: "The Frictionless Ecosystem",
        trendAngle: "POV / Clean Desk Aesthetic (Highly Trending)",
        format: "Reel",
        script:
          "Visual: Top-down hyper-lapse of cluttered physical notes transitioning cleanly into a crisp, minimalist workspace UI layout.\n\nAudio Hook (0-3s): Stop glorifying chaotic workflows.\nBody (3-15s): Walkthrough showing the precise layout switch from raw intent to clean cloud sync architecture.\nOutro (15-30s): Call to action to clear the digital noise with the system blueprint link in bio.",
        caption:
          "Chaos is expensive. Design your way out of it. The new architectural standard for business management tools is officially live. Built for high-intent builders who value digital clarity.",
        hashtags:
          "#minimalism #workflow #SaaS #productivity #uidesign #workspace #systems",
        recommendedAudio:
          "Lofi Horizon (Trending Ambient Instrumental) - Pitch-shifted, slows down at 0:12",
      },
      {
        id: "concept-2",
        title: "Behind the Architecture",
        trendAngle: "Raw Truth / Founder Commentary",
        format: "TikTok",
        script:
          "Visual: Face-to-camera or over-the-shoulder green-screen overlay showing database schemas or code structure.\n\nAudio Hook (0-5s): Why we deleted 600 lines of codebase code to fix one user interface problem.\nBody (5-45s): Transparent explanation of stripping away sidebars to favor full-canvas immersion. Show the human decision-making process behind software evolution.\nOutro (45-60s): Follow to trace the architecture build.",
        caption:
          "Good design isn't what we add, it's what we have the courage to remove. Moving towards completely full-canvas immersive spaces.",
        hashtags:
          "#buildinpublic #founder #minimalisttech #techstack #developer #designsystem",
        recommendedAudio:
          "Original Audio (Spoken Voiceover) layered with 'Metamorphosis' low volume synth",
      },
      {
        id: "concept-3",
        title: "The System Blueprint",
        trendAngle: "Asymmetric Value Delivery / Micro-Infographic",
        format: "Post",
        script:
          "Visual: High-contrast text layout or clean step-by-step visual documentation breaking down 3 structural pillars of an organized operations stack.",
        caption:
          "An unorganized brand framework limits execution speed. Here is the architecture we use to track production nodes across networks without breaking schemas.",
        hashtags:
          "#businessarchitecture #brandstrategy #systemsdesigner #agile #opsmanagement",
        recommendedAudio: "None (Static Post / Carousel Highlight Track)",
      },
    ];

    setGeneratedConcepts(mockBlueprints);

    setSelectedConcept(mockBlueprints[0]);

    applyConceptToForm(mockBlueprints[0]);

    setIsAnalyzing(false);

    setStatus("Ready");

    toast.success("Strategic Campaign Briefs Synthesized.");
  };

  const applyConceptToForm = (concept: ContentConcept) => {
    setCaption(concept.caption);

    setHashtags(concept.hashtags);

    setFormat(concept.format);

    setMetaScript(concept.script);

    setMetaAudio(concept.recommendedAudio);

    if (concept.format === "Reel") {
      setPlatforms(["meta", "instagram"]);
    } else if (concept.format === "TikTok") {
      setPlatforms(["tiktok"]);
    } else {
      setPlatforms(["linkedin"]);
    }
  };

  // --------------------------------------------------
  // CALENDAR
  // --------------------------------------------------

  const handleDateClick = (day: number) => {
    if (day === 0) return;

    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );

    const dayPosts = posts.filter(
      (post) =>
        post.scheduled_for &&
        isSameDay(
          post.scheduled_for,
          day,
          currentDate.getMonth(),
          currentDate.getFullYear()
        )
    );

    if (dayPosts.length > 0) {
      setSelectedDayPosts(dayPosts);

      setIsDayViewOpen(true);

      return;
    }

    const localDate = new Date(clickedDate);

    localDate.setHours(12, 0, 0, 0);

    const year = localDate.getFullYear();

    const month = String(localDate.getMonth() + 1).padStart(2, "0");

    const date = String(localDate.getDate()).padStart(2, "0");

    setScheduledTime(`${year}-${month}-${date}T12:00`);

    setViewMode("lab");

    toast(`Publish schedule ready for ${clickedDate.toLocaleDateString()}`);
  };

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  const validateConnections = () => {
    for (const platform of platforms) {
      const normalized = platform.toLowerCase();

      const connected = accounts.some(
        (account) => account.platform?.toLowerCase() === normalized
      );

      if (!connected) {
        toast.error(`${platform} is not connected`);

        return false;
      }
    }

    return true;
  };

  // --------------------------------------------------
  // CREATE / SCHEDULE POST
  // --------------------------------------------------

  const createPost = async ({
    instant,
  }: {
    instant: boolean;
  }) => {
    console.log("CREATE POST FUNCTION ENTERED", {
      instant,
      userId: user?.id,
      platforms,
      accounts,
      caption,
      mediaFile,
      isPosting,
      isUploadingMedia,
    });

    // Clear stale state from an earlier failed attempt.
    setIsPosting(false);
    setIsUploadingMedia(false);
    setPostState("idle");
    setStatus("Ready");

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!user?.id) {
      toast.error("You must be signed in.");

      return false;
    }

    if (!caption.trim()) {
      toast.error("Please add a caption before posting.");

      return false;
    }

    if (platforms.length === 0) {
      toast.error("Please select at least one platform.");

      return false;
    }

    if (!validateConnections()) {
      return false;
    }

    const hasTikTok = platforms.includes("tiktok");

    const hasInstagram = platforms.includes("instagram");

    if (hasTikTok && !mediaFile) {
      toast.error("TikTok requires a video file.");

      return false;
    }

    if (
      hasTikTok &&
      mediaFile &&
      !mediaFile.type.startsWith("video/")
    ) {
      toast.error("TikTok posts must use a video file.");

      return false;
    }

    if (hasInstagram && !mediaFile) {
      toast.error("Instagram requires media.");

      return false;
    }

    // ------------------------------------------
    // START
    // ------------------------------------------

    setIsPosting(true);

    setPostState("posting");

    setStatus(instant ? "Posting..." : "Scheduling...");

    let completedSuccessfully = false;

    try {
      console.log("1. createPost started", {
        instant,
        userId: user.id,
        platforms,
        hasMediaFile: Boolean(mediaFile),
        mediaType: mediaFile?.type,
        mediaName: mediaFile?.name,
      });

      let finalMediaUrl: string | null = null;

      // ------------------------------------------
      // UPLOAD MEDIA
      // ------------------------------------------

      if (mediaFile) {
        setIsUploadingMedia(true);

        setStatus("Uploading media...");

        const fileExt =
          mediaFile.name.split(".").pop()?.toLowerCase() || "bin";

        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const filePath = `${user.id}/${fileName}`;

        console.log("2. Starting media upload", {
          bucket: "social-assets",
          filePath,
          type: mediaFile.type,
          size: mediaFile.size,
        });

        const { data: uploadData, error: uploadError } =
          await supabase.storage
            .from("social-assets")
            .upload(filePath, mediaFile, {
              cacheControl: "3600",
              upsert: false,
              contentType: mediaFile.type || undefined,
            });

        console.log("3. Media upload finished", {
          uploadData,
          uploadError,
        });

        if (uploadError) {
          console.error("Social asset upload failed:", uploadError);

          toast.error(`Media upload failed: ${uploadError.message}`);

          return false;
        }

        const { data: publicUrlData } = supabase.storage
          .from("social-assets")
          .getPublicUrl(filePath);

        finalMediaUrl = publicUrlData?.publicUrl || null;

        console.log("4. Media public URL generated:", finalMediaUrl);

        if (!finalMediaUrl) {
          toast.error("Media uploaded but no public URL was generated.");

          return false;
        }

        setIsUploadingMedia(false);
      }

      // ------------------------------------------
      // DATE
      // ------------------------------------------

      const scheduledFor = instant
        ? new Date()
        : scheduledTime
        ? new Date(scheduledTime)
        : new Date();

      if (Number.isNaN(scheduledFor.getTime())) {
        toast.error("Invalid scheduled date.");

        return false;
      }

      // ------------------------------------------
      // ROW PER PLATFORM
      // ------------------------------------------

      const rows = platforms.map((platform) => ({
        user_id: user.id,

        caption: caption.trim(),

        platform: platform.toLowerCase(),

        hashtags: hashtags.trim() || null,

        media_url: finalMediaUrl,

        scheduled_for: scheduledFor.toISOString(),

        status: POST_STATUS.SCHEDULED,

        format: platform === "tiktok" ? "Video" : format,

        attempts: 0,

        retry_count: 0,

        posted_at: null,

        platform_post_id: null,

        error: null,

        last_error: null,

        last_attempt_at: null,

        platform_response: null,
      }));

      console.log("5. About to insert socials rows:", rows);

      setStatus("Saving post...");

      const {
        data: insertedPosts,
        error: insertError,
      } = await supabase
        .from("socials")
        .insert(rows)
        .select("id, platform, status, media_url");

      console.log("6. Socials insert finished", {
        insertedPosts,
        insertError,
      });

      if (insertError) {
        console.error("Social post insert error:", insertError);

        toast.error(`Could not save post: ${insertError.message}`);

        return false;
      }

      if (!insertedPosts?.length) {
        console.error(
          "Insert returned no rows even though no Supabase error was reported."
        );

        toast.error(
          "Post was not created. No database row was returned."
        );

        return false;
      }

      console.log(
        "7. Social post created successfully:",
        insertedPosts
      );

      // ------------------------------------------
      // POST NOW
      // ------------------------------------------

      if (instant) {
        setStatus("Sending to platform...");

        console.log("8. Triggering social publishing worker");

        const workerResponse = await fetch(
          "/api/social/worker/run",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const workerResult = await workerResponse
          .json()
          .catch(() => null);

        console.log("9. Social worker response:", {
          ok: workerResponse.ok,
          status: workerResponse.status,
          result: workerResult,
        });

        if (!workerResponse.ok) {
          console.error("Social worker failed:", workerResult);

          toast.error(
            workerResult?.error ||
              "Post was saved, but publishing failed."
          );

          await syncPosts();

          return false;
        }

        toast.success("Post sent for publishing!");

        setStatus("Processing");

        setPostState("posted");
      } else {
        toast.success("Post scheduled successfully!");

        setStatus("Scheduled");

        setPostState("posted");
      }

      completedSuccessfully = true;

      // ------------------------------------------
      // RESET FORM
      // ------------------------------------------

      setCaption("");

      setHashtags("");

      setMetaScript("");

      setMetaAudio("");

      setScheduledTime("");

      clearMedia();

      await syncPosts();

      setTimeout(() => {
        setStatus("Ready");

        setPostState("idle");

        setIsPosting(false);
      }, 1500);

      return true;
    } catch (error) {
      console.error("createPost fatal error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong posting content"
      );

      return false;
    } finally {
      setIsPosting(false);

      setIsUploadingMedia(false);

      if (!completedSuccessfully) {
        setPostState("idle");

        setStatus("Ready");
      }
    }
  };

  // --------------------------------------------------
  // POST NOW
  // --------------------------------------------------

  const handleInstantPost = async () => {
    console.log("POST NOW HANDLER STARTED");

    await createPost({
      instant: true,
    });
  };

  // --------------------------------------------------
  // SCHEDULE
  // --------------------------------------------------

  const deployToProductionGrid = async () => {
    console.log("SCHEDULE HANDLER STARTED");

    await createPost({
      instant: false,
    });
  };

  // --------------------------------------------------
  // APPROVE & PUBLISH
  // --------------------------------------------------

  const approvePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("socials")
        .update({
          status: "scheduled",
          scheduled_for: new Date().toISOString(),
          last_error: null,
          error: null,
        })
        .eq("id", postId);

      if (error) {
        throw error;
      }

      const response = await fetch("/api/social/worker/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Approve worker error:", result);

        toast.error(result?.error || "Failed to publish post");

        return;
      }

      toast.success("Post sent for publishing");

      setPreviewPost(null);

      await syncPosts();
    } catch (error) {
      console.error("Approval error:", error);

      toast.error("Approval failed");
    }
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const deletePost = async (postId: string) => {
    const { error } = await supabase
      .from("socials")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("Delete post error:", error);

      toast.error(`Failed to delete post: ${error.message}`);

      return;
    }

    toast.success("Post deleted");

    setSelectedDayPosts((previous) =>
      previous.filter((item) => item.id !== postId)
    );

    await syncPosts();
  };

  // --------------------------------------------------
  // CALENDAR
  // --------------------------------------------------

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();

    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const days: number[] = [];

    for (let i = 0; i < firstDay; i += 1) {
      days.push(0);
    }

    for (let i = 1; i <= daysInMonth; i += 1) {
      days.push(i);
    }

    return days;
  }, [currentDate]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1c1c1c] font-sans antialiased flex flex-col overflow-x-hidden">
      {/* HEADER */}

      <nav className="h-auto min-h-20 px-4 sm:px-6 lg:px-10 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white/80 backdrop-blur-xl border-b border-stone-100 sticky top-0 z-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 lg:gap-12">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1c1c1c] rounded-xl flex items-center justify-center text-[#a9b897] shadow-lg">
              <Layers size={18} />
            </div>

            <span className="font-serif italic text-2xl tracking-tighter">
              Social.OS
            </span>
          </div>

          <div className="flex flex-wrap bg-stone-50 p-1 rounded-2xl border border-stone-100 gap-1">
            <button
              type="button"
              onClick={() => setViewMode("lab")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === "lab"
                  ? "bg-white shadow-sm text-[#1c1c1c]"
                  : "text-stone-300"
              }`}
            >
              Strategy Lab
            </button>

            <button
              type="button"
              onClick={() => setViewMode("planner")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === "planner"
                  ? "bg-white shadow-sm text-[#1c1c1c]"
                  : "text-stone-300"
              }`}
            >
              Content Planner
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-stone-50 rounded-full border border-stone-100">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                status === "Ready"
                  ? "bg-[#a9b897]"
                  : "bg-amber-400"
              } animate-pulse`}
            />

            <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
              {status}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void syncPosts()}
            className="p-2 text-stone-300 hover:text-[#1c1c1c] transition-colors"
          >
            <RefreshCcw size={18} />
          </button>

          <Link
            href="/reports"
            className="p-2 text-stone-300 hover:text-[#1c1c1c] transition-colors"
          >
            <BarChart3 size={18} />
          </Link>
        </div>
      </nav>

      {/* MAIN */}

      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {viewMode === "lab" ? (
            <motion.div
              key="lab"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12"
            >
              {/* LEFT */}

              <div className="col-span-12 lg:col-span-6 space-y-8">
                <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] mb-1">
                      Contextual Alignment
                    </p>

                    <h3 className="text-3xl font-serif italic tracking-tight">
                      Tell us about your business
                    </h3>
                  </div>

                  <textarea
                    value={businessContext}
                    onChange={(e) =>
                      setBusinessContext(e.target.value)
                    }
                    placeholder="e.g., We are architectural designers focusing on functional minimalism..."
                    className="w-full h-32 bg-stone-50 rounded-2xl p-6 text-sm font-medium outline-none border border-stone-100/50 focus:border-[#a9b897] transition-all resize-none placeholder:text-stone-300"
                  />

                  <button
                    type="button"
                    onClick={analyzeBusinessDNA}
                    disabled={isAnalyzing}
                    className="w-full py-5 bg-[#1c1c1c] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-stone-800 transition-all disabled:opacity-40"
                  >
                    <Sparkles
                      size={14}
                      className="text-[#a9b897]"
                    />

                    {isAnalyzing
                      ? "Analyzing Trends..."
                      : "Generate Trending Ideas"}
                  </button>
                </div>

                {generatedConcepts.length > 0 && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-300 ml-4">
                      Strategic Content Options
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                      {generatedConcepts.map(
                        (concept, index) => (
                          <button
                            type="button"
                            key={concept.id}
                            onClick={() => {
                              setSelectedConcept(concept);

                              applyConceptToForm(concept);
                            }}
                            className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden h-32 ${
                              selectedConcept?.id === concept.id
                                ? "bg-white border-[#a9b897] shadow-md"
                                : "bg-white/60 border-stone-100 hover:border-stone-200"
                            }`}
                          >
                            <div className="text-[9px] font-mono text-stone-300">
                              Idea 0{index + 1} // {concept.format}
                            </div>

                            <div className="font-serif italic text-lg leading-tight mt-2 text-[#1c1c1c]">
                              {concept.title}
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {selectedConcept && (
                  <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl space-y-6">
                    <div className="flex justify-between items-start border-b border-stone-50 pb-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#a9b897] bg-[#a9b897]/10 px-3 py-1 rounded-full">
                          {selectedConcept.trendAngle}
                        </span>

                        <h4 className="text-2xl font-serif italic mt-3">
                          {selectedConcept.title}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-stone-300">
                        <Film size={12} />

                        Creative Production Script
                      </div>

                      <div className="bg-stone-50 rounded-2xl p-6 text-xs font-medium text-stone-600 leading-relaxed whitespace-pre-wrap font-mono">
                        {metaScript}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-stone-300">
                        <Music size={12} />

                        Recommended Sound & Trending Audio
                      </div>

                      <div className="bg-amber-50/40 border border-amber-100/50 rounded-xl p-4 flex items-center gap-3 text-xs font-semibold text-amber-900">
                        <Plus
                          size={14}
                          className="text-[#a9b897] shrink-0 animate-pulse"
                        />

                        <span>
                          {metaAudio ||
                            "No background audio required for this format placement."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT */}

              <div className="col-span-12 lg:col-span-6">
                <div className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-2xl flex flex-col justify-between min-h-[600px]">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-stone-50 pb-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-300">
                        Final Post Preview
                      </label>

                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">
                        {format} Strategy
                      </span>
                    </div>

                    {/* MEDIA */}

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest flex items-center gap-2">
                        <ImageIcon size={12} />

                        Asset Attachment
                      </label>

                      <div className="relative border border-dashed border-stone-200 rounded-2xl h-48 bg-stone-50/50 flex flex-col items-center justify-center overflow-hidden transition-all hover:bg-stone-50 group">
                        {mediaPreview ? (
                          <>
                            {mediaFile?.type.startsWith("video/") ? (
                              <video
                                src={mediaPreview}
                                className="w-full h-full object-cover"
                                controls
                                playsInline
                              />
                            ) : (
                              <img
                                src={mediaPreview}
                                alt="Upload Preview"
                                className="w-full h-full object-cover"
                              />
                            )}

                            <button
                              type="button"
                              onClick={clearMedia}
                              className="absolute top-3 right-3 p-2 bg-[#1c1c1c] text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center space-y-2 p-6 w-full h-full">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-stone-100 text-stone-400 group-hover:text-[#a9b897] transition-colors">
                              <Upload size={16} />
                            </div>

                            <span className="text-xs font-semibold text-stone-500">
                              Drop your file or browse
                            </span>

                            <span className="text-[9px] font-medium text-stone-300 uppercase tracking-wider">
                              Supports images or video formats
                            </span>

                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* CAPTION */}

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest">
                        Post Caption Copy
                      </label>

                      <textarea
                        value={caption}
                        onChange={(e) =>
                          setCaption(e.target.value)
                        }
                        className="w-full h-28 bg-stone-50 rounded-2xl p-5 text-base font-serif italic outline-none resize-none border border-stone-100 focus:border-[#a9b897] transition-all leading-relaxed"
                        placeholder="Write a custom post manually from scratch..."
                      />
                    </div>

                    {/* HASHTAGS */}

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest flex items-center gap-1.5">
                        <Hash size={12} />

                        Search Optimization Tags
                      </label>

                      <input
                        value={hashtags}
                        onChange={(e) =>
                          setHashtags(e.target.value)
                        }
                        className="w-full p-4 bg-stone-50 rounded-xl text-xs font-mono font-bold outline-none border border-stone-100 focus:border-[#a9b897] transition-all"
                        placeholder="#branding #marketing"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* PLATFORMS */}

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest">
                          Target Platform
                        </label>

                        <div className="w-full p-4 bg-stone-50 rounded-xl text-xs font-bold space-y-2">
                          {[
                            "meta",
                            "instagram",
                            "tiktok",
                            "linkedin",
                          ].map((platform) => (
                            <label
                              key={platform}
                              className="flex items-center gap-2 capitalize"
                            >
                              <input
                                type="checkbox"
                                checked={platforms.includes(platform)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPlatforms((previous) =>
                                      previous.includes(platform)
                                        ? previous
                                        : [...previous, platform]
                                    );
                                  } else {
                                    setPlatforms((previous) =>
                                      previous.filter(
                                        (item) => item !== platform
                                      )
                                    );
                                  }
                                }}
                              />

                              {platform}
                            </label>
                          ))}
                        </div>

                        {/* ACCOUNT */}

                        <div className="space-y-2 mt-4">
                          <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest">
                            Connected Account
                          </label>

                          <select
                            value={selectedAccountId}
                            onChange={(e) =>
                              setSelectedAccountId(e.target.value)
                            }
                            className="w-full p-4 bg-stone-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-stone-100"
                          >
                            <option value="">
                              Select account
                            </option>

                            {accounts.map((account) => (
                              <option
                                key={account.id}
                                value={account.id}
                              >
                                {account.platform} -{" "}
                                {account.platform_user_id ||
                                  account.id}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* DATE */}

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest flex items-center gap-1.5">
                          <Clock size={12} />

                          Publishing Schedule
                        </label>

                        <input
                          type="datetime-local"
                          value={scheduledTime}
                          onChange={(e) =>
                            setScheduledTime(e.target.value)
                          }
                          className="w-full p-4 bg-stone-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-stone-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* POST NOW */}

                  <button
                    type="button"
                    onClick={() => {
                      console.log("POST NOW CLICKED", {
                        isPosting,
                        isUploadingMedia,
                        userId: user?.id,
                        platforms,
                        caption,
                        mediaFile,
                      });

                      void handleInstantPost();
                    }}
                    disabled={isUploadingMedia}
                    className="w-full py-6 mb-3 bg-[#a9b897] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-[#97a786] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {postState === "posting"
                      ? status === "Uploading media..."
                        ? "Uploading..."
                        : status === "Saving post..."
                        ? "Saving..."
                        : status === "Sending to platform..."
                        ? "Publishing..."
                        : "Posting..."
                      : postState === "posted"
                      ? "Sent!"
                      : "Post Now"}

                    <ArrowRight size={14} />
                  </button>

                  {/* SCHEDULE */}

                  <button
                    type="button"
                    onClick={() => {
                      console.log("SCHEDULE CLICKED", {
                        isPosting,
                        isUploadingMedia,
                        userId: user?.id,
                        platforms,
                        caption,
                        scheduledTime,
                      });

                      void deployToProductionGrid();
                    }}
                    disabled={isUploadingMedia}
                    className="w-full py-6 mt-6 bg-[#1c1c1c] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-stone-800 transition-all shadow-xl shadow-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingMedia
                      ? "Staging Assets..."
                      : isPosting
                      ? "Saving..."
                      : "Schedule Content Post"}

                    <ArrowRight
                      size={14}
                      className="text-[#a9b897]"
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* --------------------------------------------------
               PLANNER
            -------------------------------------------------- */

            <motion.div
              key="planner"
              initial={{
                opacity: 0,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="max-w-6xl mx-auto space-y-12"
            >
              <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
                <div className="flex items-baseline gap-6">
                  <h2 className="text-5xl sm:text-6xl lg:text-8xl font-serif italic tracking-tighter">
                    {currentDate.toLocaleString("default", {
                      month: "long",
                    })}
                    .
                  </h2>

                  <span className="text-stone-300 text-3xl font-serif italic leading-none">
                    {currentDate.getFullYear()}
                  </span>
                </div>

                <div className="flex gap-2 bg-white p-2 rounded-2xl border border-stone-100 shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className="p-3 hover:bg-stone-50 rounded-xl transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className="p-3 hover:bg-stone-50 rounded-xl transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 sm:gap-4 lg:gap-5 bg-white p-4 sm:p-8 lg:p-16 rounded-[2rem] lg:rounded-[4rem] border border-stone-100 shadow-2xl overflow-x-auto">
                {[
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ].map((day) => (
                  <div
                    key={day}
                    className="text-center text-[10px] font-black text-stone-200 uppercase tracking-[0.3em] mb-10"
                  >
                    {day}
                  </div>
                ))}

                {posts.length === 0 && (
                  <div className="col-span-full text-center py-10 text-stone-400 text-sm font-medium">
                    No scheduled posts yet. Create your first post in
                    Strategy Lab.
                  </div>
                )}

                {calendarDays.map((day, index) => {
                  const dayPosts = posts.filter(
                    (post) =>
                      post.scheduled_for &&
                      isSameDay(
                        post.scheduled_for,
                        day,
                        currentDate.getMonth(),
                        currentDate.getFullYear()
                      )
                  );

                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(day)}
                      className={`aspect-square min-w-[60px] rounded-[1.5rem] lg:rounded-[2rem] border border-stone-50 flex items-center justify-center text-xl sm:text-2xl lg:text-4xl font-serif italic relative cursor-pointer group transition-all
                        ${
                          day === 0
                            ? "opacity-0 pointer-events-none"
                            : "hover:bg-stone-50 hover:border-stone-100"
                        }
                        ${
                          dayPosts.length > 0
                            ? "text-[#1c1c1c]"
                            : "text-stone-100"
                        }
                      `}
                    >
                      {day > 0 ? day : ""}

                      {dayPosts.length > 0 && (
                        <div className="absolute bottom-5 flex gap-1">
                          {dayPosts.slice(0, 3).map((post) => (
                            <div
                              key={post.id}
                              className={`w-2 h-2 rounded-full ${getStatusColor(
                                post.status
                              )}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --------------------------------------------------
          DAY DRAWER
      -------------------------------------------------- */}

      <AnimatePresence>
        {isDayViewOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() => setIsDayViewOpen(false)}
              className="absolute inset-0 bg-stone-100/40 backdrop-blur-md"
            />

            <motion.div
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-stone-100 p-4 sm:p-8 lg:p-12 flex flex-col"
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mb-6 lg:mb-12">
                <h3 className="text-4xl font-serif italic">
                  Daily Overview.
                </h3>

                <button
                  type="button"
                  onClick={() => setIsDayViewOpen(false)}
                  className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-4">
                {selectedDayPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-stone-50 rounded-[2rem] lg:rounded-[2.5rem] p-4 lg:p-6 space-y-4 border border-stone-100 group"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-xl bg-[#1c1c1c]/5 flex items-center justify-center text-[#a9b897]">
                        {post.platform === "tiktok" ? (
                          <Video size={20} />
                        ) : post.platform === "meta" ? (
                          <Layers size={20} />
                        ) : (
                          <LinkedinIcon size={20} />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(
                              post.status
                            )}`}
                          />

                          <p className="text-[10px] font-black uppercase text-[#a9b897] tracking-widest">
                            {post.platform} // {post.format}
                          </p>
                        </div>

                        <p className="text-sm font-serif italic text-stone-600 line-clamp-2 leading-snug mt-0.5">
                          "{post.caption}"
                        </p>

                        {post.last_error && (
                          <p className="text-[10px] text-red-500 mt-2 break-words">
                            {post.last_error}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-stone-100/50">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-stone-300 uppercase">
                        <Clock size={12} />

                        {new Date(
                          post.scheduled_for
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPreviewPost(post)}
                          className="text-stone-300 hover:text-[#1c1c1c] text-[10px] font-black uppercase tracking-widest"
                        >
                          Preview
                        </button>

                        <button
                          type="button"
                          onClick={() => void deletePost(post.id)}
                          className="text-stone-200 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setViewMode("lab");

                  setIsDayViewOpen(false);
                }}
                className="w-full py-6 mt-10 border-2 border-dashed border-stone-200 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase text-stone-300 hover:border-[#a9b897] hover:text-[#a9b897] transition-all"
              >
                <Plus size={16} />

                Add New Post
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------
          PREVIEW MODAL
      -------------------------------------------------- */}

      {previewPost && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif italic">
                Post Preview
              </h2>

              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="text-stone-400 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {previewPost.media_url &&
                (isVideoUrl(previewPost.media_url) ||
                previewPost.platform === "tiktok" ? (
                  <video
                    src={previewPost.media_url}
                    className="w-full h-72 object-cover rounded-2xl border bg-black"
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    src={previewPost.media_url}
                    alt="Post preview"
                    className="w-full h-72 object-cover rounded-2xl border"
                  />
                ))}

              <div className="text-sm font-medium text-stone-600 whitespace-pre-wrap">
                {previewPost.caption}
              </div>

              <div className="text-[10px] font-black uppercase tracking-widest text-stone-300">
                {previewPost.platform} • {previewPost.format} •{" "}
                {previewPost.status}
              </div>

              {previewPost.last_error && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-xs text-red-600 break-words">
                  {previewPost.last_error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="px-5 py-3 text-xs font-black uppercase tracking-widest text-stone-400"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => void approvePost(previewPost.id)}
                className="px-6 py-3 bg-[#a9b897] text-white rounded-xl text-xs font-black uppercase tracking-widest"
              >
                Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap");

        .font-serif {
          font-family: "Instrument Serif", serif;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}