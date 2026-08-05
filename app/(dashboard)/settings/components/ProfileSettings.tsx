"use client";

import { Image as ImageIcon, Upload } from "lucide-react";

type ProfileSettingsProps = {
  displayName: string;
  setDisplayName: (value: string) => void;

  email: string;

  bio: string;
  setBio: (value: string) => void;

  logoUrl: string;
  logoUploading: boolean;
  uploadLogo: (file: File) => Promise<void> | void;
};

export default function ProfileSettings({
  displayName,
  setDisplayName,
  email,
  bio,
  setBio,
  logoUrl,
  logoUploading,
  uploadLogo,
}: ProfileSettingsProps) {
  return (
    <div className="flex min-w-0 flex-col gap-8 lg:flex-row lg:gap-10">
      {/* Avatar */}
      <div className="mx-auto shrink-0 lg:mx-0">
        <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[3rem] border border-stone-100 bg-[#faf9f6] sm:h-36 sm:w-36 lg:h-40 lg:w-40">
          <span className="font-serif text-4xl italic text-stone-200">
            {displayName
              ? displayName
                  .split(" ")
                  .filter(Boolean)
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()
              : "OS"}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="min-w-0 flex-1 space-y-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <div className="space-y-2">
            <label className="ml-4 text-[9px] font-black uppercase tracking-widest text-stone-300">
              Full Name
            </label>

            <input
              value={displayName}
              onChange={(e) =>
                setDisplayName(e.target.value)
              }
              className="w-full rounded-2xl border border-stone-200 bg-[#faf9f6] p-5 text-xs font-bold outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-300"
            />
          </div>

          <div className="space-y-2">
            <label className="ml-4 text-[9px] font-black uppercase tracking-widest text-stone-300">
              Email Address
            </label>

            <input
              value={email}
              disabled
              className="w-full cursor-not-allowed rounded-2xl border border-stone-200 bg-[#faf9f6] p-5 text-xs font-bold opacity-60"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="ml-4 text-[9px] font-black uppercase tracking-widest text-stone-300">
            Administrative Summary
          </label>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[140px] w-full rounded-3xl border border-stone-200 bg-[#faf9f6] p-6 font-serif text-xl italic outline-none"
          />
        </div>

        <div className="space-y-3">
          <label className="ml-4 text-[9px] font-black uppercase tracking-widest text-stone-300">
            Company Logo
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-[#faf9f6]">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <ImageIcon
                  size={20}
                  className="text-stone-300"
                />
              )}
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold transition hover:bg-stone-50">
              <Upload size={14} />

              {logoUploading
                ? "Uploading..."
                : "Upload Logo"}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={logoUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    void uploadLogo(file);
                  }

                  e.target.value = "";
                }}
              />
            </label>

            {logoUrl && (
              <span className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                Uploaded
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}