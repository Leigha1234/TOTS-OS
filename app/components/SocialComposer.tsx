"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Facebook,
  Instagram,
  Loader2,
  TriangleAlert,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type SocialAccount = {
  id: string;

  platform: string;

  page_name?:
    string | null;

  page_id?:
    string | null;

  page_access_token?:
    string | null;

  instagram_business_account_id?:
    string | null;

  display_name?:
    string | null;
};

type PublishDestination =
  | "facebook"
  | "instagram";

type PublishResult = {
  success?: boolean;

  partialSuccess?: boolean;

  message?: string;

  error?: string;

  errors?: Array<{
    destination:
      PublishDestination;

    error:
      string;
  }>;
};

interface SocialComposerProps {
  accounts:
    SocialAccount[];
}

// ============================================================
// HELPERS
// ============================================================

function normalisePlatform(
  value:
    string
) {
  const platform =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  if (
    platform ===
      "facebook" ||
    platform ===
      "instagram"
  ) {
    return "meta";
  }

  return platform;
}

// ============================================================
// COMPONENT
// ============================================================

export default function SocialComposer({
  accounts,
}: SocialComposerProps) {
  // ==========================================================
  // META ACCOUNT
  // ==========================================================

  const metaAccount =
    useMemo(
      () => {
        return (
          accounts.find(
            (
              account
            ) =>
              normalisePlatform(
                account.platform
              ) ===
              "meta"
          ) ||
          null
        );
      },
      [
        accounts,
      ]
    );

  // ==========================================================
  // AVAILABLE DESTINATIONS
  // ==========================================================

  const facebookAvailable =
    Boolean(
      metaAccount?.id &&
      metaAccount?.page_id
    );

  const instagramAvailable =
    Boolean(
      metaAccount?.id &&
      metaAccount
        ?.instagram_business_account_id
    );

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    destinations,
    setDestinations,
  ] =
    useState<
      PublishDestination[]
    >(
      []
    );

  const [
    content,
    setContent,
  ] =
    useState(
      ""
    );

  const [
    imageUrl,
    setImageUrl,
  ] =
    useState(
      ""
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    message,
    setMessage,
  ] =
    useState(
      ""
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  // ==========================================================
  // TOGGLE DESTINATION
  // ==========================================================

  function toggleDestination(
    destination:
      PublishDestination
  ) {
    setMessage(
      ""
    );

    setError(
      ""
    );

    setDestinations(
      (
        current
      ) => {
        if (
          current.includes(
            destination
          )
        ) {
          return current.filter(
            (
              item
            ) =>
              item !==
              destination
          );
        }

        return [
          ...current,
          destination,
        ];
      }
    );
  }

  // ==========================================================
  // PUBLISH
  // ==========================================================

  async function publishPost() {
    setMessage(
      ""
    );

    setError(
      ""
    );

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !metaAccount
    ) {
      setError(
        "Connect Meta before publishing to Facebook or Instagram."
      );

      return;
    }

    if (
      destinations.length ===
      0
    ) {
      setError(
        "Choose Facebook, Instagram, or both."
      );

      return;
    }

    if (
      !content.trim()
    ) {
      setError(
        "Add some content before publishing."
      );

      return;
    }

    if (
      destinations.includes(
        "facebook"
      ) &&
      !facebookAvailable
    ) {
      setError(
        "Your Meta connection does not currently include a Facebook Page."
      );

      return;
    }

    if (
      destinations.includes(
        "instagram"
      ) &&
      !instagramAvailable
    ) {
      setError(
        "No Instagram Business or Creator account is linked to this Meta connection."
      );

      return;
    }

    if (
      destinations.includes(
        "instagram"
      ) &&
      !imageUrl.trim()
    ) {
      setError(
        "Instagram requires an image URL."
      );

      return;
    }

    // ========================================================
    // REQUEST
    // ========================================================

    setLoading(
      true
    );

    try {
      const response =
        await fetch(
          "/api/social/post",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                socialAccountId:
                  metaAccount.id,

                content:
                  content.trim(),

                imageUrl:
                  imageUrl.trim(),

                destinations,
              }),
          }
        );

      const data =
        (
          await response
            .json()
            .catch(
              () =>
                ({})
            )
        ) as PublishResult;

      // ======================================================
      // ERROR
      // ======================================================

      if (
        !response.ok ||
        data.success ===
          false
      ) {
        throw new Error(
          data.error ||
            "Unable to publish post."
        );
      }

      // ======================================================
      // SUCCESS
      // ======================================================

      setMessage(
        data.message ||
          (
            destinations.length >
            1
              ? "Post published successfully to Facebook and Instagram."
              : destinations[0] ===
                  "instagram"
                ? "Post published successfully to Instagram."
                : "Post published successfully to Facebook."
          )
      );

      /*
       * Keep the chosen destinations selected.
       *
       * This makes repeated posting easier.
       */

      setContent(
        ""
      );

      setImageUrl(
        ""
      );
    } catch (
      publishError:
        unknown
    ) {
      console.error(
        "[SOCIAL COMPOSER] Publishing failed:",
        publishError
      );

      setError(
        publishError instanceof
          Error
          ? publishError.message
          : "Publishing failed."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  // ==========================================================
  // DISPLAY NAME
  // ==========================================================

  const metaDisplayName =
    metaAccount
      ?.page_name ||
    metaAccount
      ?.display_name ||
    "Meta account";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-5 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
          Social publishing
        </p>

        <h2 className="mt-2 text-xl font-semibold text-stone-800">
          Create Social Post
        </h2>

        <p className="mt-1 text-xs leading-5 text-stone-500">
          Choose exactly where you want this post to go.
        </p>

        {metaAccount && (
          <p className="mt-2 text-[10px] text-stone-400">
            Connected through{" "}
            <strong className="font-semibold text-stone-600">
              {
                metaDisplayName
              }
            </strong>
          </p>
        )}
      </div>

      {/* =====================================================
          DESTINATIONS
      ===================================================== */}

      <div>
        <p className="mb-3 text-[9px] font-black uppercase tracking-[0.15em] text-stone-400">
          Publish to
        </p>

        <div className="grid gap-3 sm:grid-cols-2">

          {/* =================================================
              FACEBOOK
          ================================================= */}

          <button
            type="button"
            disabled={
              loading ||
              !facebookAvailable
            }
            onClick={() =>
              toggleDestination(
                "facebook"
              )
            }
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
              destinations.includes(
                "facebook"
              )
                ? "border-[#A3B18A] bg-[#f3f6ef]"
                : "border-stone-200 bg-white hover:border-stone-300"
            } disabled:cursor-not-allowed disabled:opacity-45`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef1f8] text-[#4267B2]">
              <Facebook
                size={
                  18
                }
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-stone-800">
                  Facebook
                </p>

                {destinations.includes(
                  "facebook"
                ) && (
                  <CheckCircle2
                    size={
                      14
                    }
                    className="text-[#829473]"
                  />
                )}
              </div>

              <p className="mt-1 truncate text-[9px] text-stone-400">
                {facebookAvailable
                  ? metaAccount
                      ?.page_name ||
                    "Facebook Page connected"
                  : "No Facebook Page available"}
              </p>
            </div>
          </button>

          {/* =================================================
              INSTAGRAM
          ================================================= */}

          <button
            type="button"
            disabled={
              loading ||
              !instagramAvailable
            }
            onClick={() =>
              toggleDestination(
                "instagram"
              )
            }
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
              destinations.includes(
                "instagram"
              )
                ? "border-[#A3B18A] bg-[#f3f6ef]"
                : "border-stone-200 bg-white hover:border-stone-300"
            } disabled:cursor-not-allowed disabled:opacity-45`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
              <Instagram
                size={
                  18
                }
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-stone-800">
                  Instagram
                </p>

                {destinations.includes(
                  "instagram"
                ) && (
                  <CheckCircle2
                    size={
                      14
                    }
                    className="text-[#829473]"
                  />
                )}
              </div>

              <p className="mt-1 truncate text-[9px] text-stone-400">
                {instagramAvailable
                  ? "Instagram Business connected"
                  : "No Instagram Business account"}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div>
        <label
          htmlFor="social-post-content"
          className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-stone-400"
        >
          Caption
        </label>

        <textarea
          id="social-post-content"
          value={
            content
          }
          onChange={(
            event
          ) =>
            setContent(
              event.target.value
            )
          }
          placeholder="Write your post..."
          rows={
            6
          }
          disabled={
            loading
          }
          className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-800 outline-none transition placeholder:text-stone-300 focus:border-[#A3B18A] focus:bg-white disabled:opacity-60"
        />
      </div>

      {/* =====================================================
          IMAGE URL
      ===================================================== */}

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor="social-post-image"
            className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-400"
          >
            Image URL
          </label>

          {destinations.includes(
            "instagram"
          ) && (
            <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-amber-600">
              Required for Instagram
            </span>
          )}
        </div>

        <input
          id="social-post-image"
          value={
            imageUrl
          }
          onChange={(
            event
          ) =>
            setImageUrl(
              event.target.value
            )
          }
          placeholder="https://..."
          disabled={
            loading
          }
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-800 outline-none transition placeholder:text-stone-300 focus:border-[#A3B18A] focus:bg-white disabled:opacity-60"
        />

        <p className="mt-2 text-[9px] leading-4 text-stone-400">
          Facebook can publish text-only posts. Instagram currently
          requires a publicly accessible image URL.
        </p>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
          <TriangleAlert
            size={
              16
            }
            className="mt-0.5 shrink-0 text-red-400"
          />

          <p className="text-xs leading-5 text-red-600">
            {
              error
            }
          </p>
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {message && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#dce4d2] bg-[#f3f6ef] p-4">
          <CheckCircle2
            size={
              16
            }
            className="mt-0.5 shrink-0 text-[#829473]"
          />

          <p className="text-xs leading-5 text-stone-600">
            {
              message
            }
          </p>
        </div>
      )}

      {/* =====================================================
          PUBLISH
      ===================================================== */}

      <button
        type="button"
        onClick={() =>
          void publishPost()
        }
        disabled={
          loading ||
          !metaAccount ||
          destinations.length ===
            0
        }
        className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2
              size={
                14
              }
              className="animate-spin"
            />

            Publishing...
          </>
        ) : destinations.length ===
          2 ? (
          "Publish to Facebook + Instagram"
        ) : destinations[0] ===
          "instagram" ? (
          "Publish to Instagram"
        ) : destinations[0] ===
          "facebook" ? (
          "Publish to Facebook"
        ) : (
          "Choose where to publish"
        )}
      </button>
    </div>
  );
}