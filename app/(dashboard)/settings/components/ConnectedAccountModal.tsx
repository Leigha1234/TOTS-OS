"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  CheckCircle2,
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  X,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type ConnectedAccountModalProps = {
  open: boolean;

  platform:
    | string
    | null;

  onClose: () => void;
};

// ============================================================
// PLATFORM HELPERS
// ============================================================

function normalizePlatform(
  platform: string
) {
  return platform
    .trim()
    .toLowerCase();
}

// ============================================================

function getPlatformLabel(
  platform: string
) {
  const normalized =
    normalizePlatform(
      platform
    );

  if (
    normalized ===
    "facebook"
  ) {
    return "Facebook";
  }

  if (
    normalized ===
    "instagram"
  ) {
    return "Instagram";
  }

  if (
    normalized ===
    "meta"
  ) {
    return "Facebook & Instagram";
  }

  if (
    normalized ===
    "linkedin"
  ) {
    return "LinkedIn";
  }

  if (
    normalized ===
    "tiktok"
  ) {
    return "TikTok";
  }

  return (
    normalized
      .charAt(0)
      .toUpperCase() +
    normalized.slice(1)
  );
}

// ============================================================

function getConnectionDescription(
  platform: string
) {
  const normalized =
    normalizePlatform(
      platform
    );

  if (
    normalized ===
    "facebook"
  ) {
    return "Your Facebook Page has been successfully connected to TOTS-OS.";
  }

  if (
    normalized ===
    "instagram"
  ) {
    return "Your Instagram Business or Creator account has been successfully connected to TOTS-OS.";
  }

  if (
    normalized ===
    "meta"
  ) {
    return "Your Facebook and Instagram accounts have been successfully connected to TOTS-OS.";
  }

  if (
    normalized ===
    "linkedin"
  ) {
    return "Your LinkedIn account has been successfully connected to TOTS-OS.";
  }

  if (
    normalized ===
    "tiktok"
  ) {
    return "Your TikTok account has been successfully connected to TOTS-OS.";
  }

  return `Your ${getPlatformLabel(
    platform
  )} account has been successfully connected to TOTS-OS.`;
}

// ============================================================

function getWorkspaceDescription(
  platform: string
) {
  const normalized =
    normalizePlatform(
      platform
    );

  if (
    normalized ===
    "facebook"
  ) {
    return "Facebook is now available as its own publishing destination in your social workspace.";
  }

  if (
    normalized ===
    "instagram"
  ) {
    return "Instagram is now available as its own publishing destination in your social workspace.";
  }

  if (
    normalized ===
    "meta"
  ) {
    return "Facebook and Instagram are now available as separate publishing destinations in your social workspace.";
  }

  if (
    normalized ===
    "tiktok"
  ) {
    return "TikTok is now connected and available across your social workspace.";
  }

  if (
    normalized ===
    "linkedin"
  ) {
    return "LinkedIn is now connected and available across your social workspace.";
  }

  return "Your connected account is now available across your TOTS-OS social workspace.";
}

// ============================================================
// PLATFORM ICON
// ============================================================

function PlatformIcon({
  platform,
}: {
  platform: string;
}) {
  const normalized =
    normalizePlatform(
      platform
    );

  if (
    normalized ===
    "facebook"
  ) {
    return (
      <Facebook
        size={34}
        strokeWidth={1.8}
      />
    );
  }

  if (
    normalized ===
    "instagram"
  ) {
    return (
      <Instagram
        size={34}
        strokeWidth={1.8}
      />
    );
  }

  if (
    normalized ===
    "linkedin"
  ) {
    return (
      <Linkedin
        size={34}
        strokeWidth={1.8}
      />
    );
  }

  if (
    normalized ===
    "tiktok"
  ) {
    return (
      <Music2
        size={34}
        strokeWidth={1.8}
      />
    );
  }

  return (
    <CheckCircle2
      size={38}
      strokeWidth={1.8}
    />
  );
}

// ============================================================
// META PLATFORM DISPLAY
// ============================================================

function MetaPlatformIcons() {
  return (
    <div className="flex items-center justify-center">
      {/* Facebook */}

      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[#eef3ff] text-[#4267B2] shadow-sm">
        <Facebook
          size={28}
          strokeWidth={1.8}
        />
      </div>

      {/* Instagram */}

      <div className="-ml-3 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[#fff1f5] text-[#C13584] shadow-sm">
        <Instagram
          size={28}
          strokeWidth={1.8}
        />
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function ConnectedAccountModal({
  open,
  platform,
  onClose,
}: ConnectedAccountModalProps) {
  if (
    !platform
  ) {
    return null;
  }

  const normalizedPlatform =
    normalizePlatform(
      platform
    );

  const platformLabel =
    getPlatformLabel(
      platform
    );

  const description =
    getConnectionDescription(
      platform
    );

  const workspaceDescription =
    getWorkspaceDescription(
      platform
    );

  const isMeta =
    normalizedPlatform ===
    "meta";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          onClick={
            onClose
          }
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            transition={{
              duration: 0.2,
            }}
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
            className="relative w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-6 shadow-2xl sm:p-8"
          >
            {/* ==================================================
                CLOSE
            ================================================== */}

            <button
              type="button"
              onClick={
                onClose
              }
              className="absolute right-5 top-5 rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              aria-label="Close"
            >
              <X
                size={
                  18
                }
              />
            </button>

            {/* ==================================================
                SUCCESS ICON
            ================================================== */}

            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2
                  size={
                    42
                  }
                  className="text-emerald-600"
                />
              </div>
            </div>

            {/* ==================================================
                CONTENT
            ================================================== */}

            <div className="mt-7 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400">
                Connection Successful
              </p>

              <h2 className="mt-3 font-serif text-3xl italic text-stone-900">
                {
                  platformLabel
                }{" "}
                Connected
              </h2>

              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-stone-500">
                {
                  description
                }
              </p>
            </div>

            {/* ==================================================
                CONNECTED PLATFORM
            ================================================== */}

            <div className="mt-7 rounded-[1.5rem] border border-stone-100 bg-stone-50 p-5">
              {isMeta ? (
                <>
                  <MetaPlatformIcons />

                  <div className="mt-4 text-center">
                    <p className="text-xs font-bold text-stone-800">
                      Facebook
                      <span className="mx-2 text-stone-300">
                        +
                      </span>
                      Instagram
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-stone-400">
                      One Meta connection,
                      two separate publishing
                      destinations.
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm">
                    <PlatformIcon
                      platform={
                        platform
                      }
                    />
                  </div>

                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-stone-800">
                      {
                        platformLabel
                      }
                    </p>

                    <p className="mt-1 text-[10px] text-emerald-600">
                      Connected
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ==================================================
                FACEBOOK / INSTAGRAM SEPARATION
            ================================================== */}

            {isMeta && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* FACEBOOK */}

                <div className="rounded-2xl border border-stone-100 bg-white p-4 text-center shadow-sm">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3ff] text-[#4267B2]">
                    <Facebook
                      size={
                        20
                      }
                    />
                  </div>

                  <p className="mt-3 text-[11px] font-bold text-stone-800">
                    Facebook
                  </p>

                  <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-600">
                    Available
                  </p>
                </div>

                {/* INSTAGRAM */}

                <div className="rounded-2xl border border-stone-100 bg-white p-4 text-center shadow-sm">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff1f5] text-[#C13584]">
                    <Instagram
                      size={
                        20
                      }
                    />
                  </div>

                  <p className="mt-3 text-[11px] font-bold text-stone-800">
                    Instagram
                  </p>

                  <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-600">
                    Available
                  </p>
                </div>
              </div>
            )}

            {/* ==================================================
                EXPLANATION
            ================================================== */}

            <p className="mx-auto mt-6 max-w-sm text-center text-xs leading-5 text-stone-500">
              {
                workspaceDescription
              }
            </p>

            {/* ==================================================
                CONTINUE
            ================================================== */}

            <button
              type="button"
              onClick={
                onClose
              }
              className="mt-8 w-full rounded-full bg-stone-900 px-6 py-4 text-[10px] font-black uppercase tracking-wider text-white transition hover:opacity-90"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}