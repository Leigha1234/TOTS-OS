"use client";

import { Loader2 } from "lucide-react";

type SettingsHeaderProps = {
  isSaving: boolean;
  onSave: () => void;
  onLogout: () => void;
  onManageSubscription: () => void;
};

export default function SettingsHeader({
  isSaving,
  onSave,
  onLogout,
  onManageSubscription,
}: SettingsHeaderProps) {
  return (
    <header className="mb-10 flex flex-col gap-8 rounded-[2rem] border border-[#235847] bg-gradient-to-br from-[#092d26] via-[#0f3d32] to-[#1b5545] px-7 py-9 text-[#f6f3e9] shadow-xl sm:px-10 lg:px-12 lg:py-12 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-6">
        <div>

          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c2d8c9]">ORBI / Workspace preferences</p>
          <h1 className="mt-3 break-words font-serif text-4xl tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
            Settings
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-[#d5e5db]">
            Manage your profile, organisation, branding, social media
            integrations and account security from one place.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-full border border-white/25 bg-white/10 text-white px-8 py-5 text-[10px] font-black uppercase tracking-wider transition hover:bg-white/20 sm:w-auto"
        >
          Sign Out
        </button>

        <button
          type="button"
          onClick={onManageSubscription}
          className="w-full rounded-full border border-white/25 bg-white/10 text-white px-8 py-5 text-[10px] font-black uppercase tracking-wider transition hover:bg-white/20 sm:w-auto"
        >
          Manage Subscription
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex w-full min-w-[170px] items-center justify-center gap-2 rounded-full bg-[#f2efe5] px-10 py-5 text-[10px] font-black uppercase tracking-wider text-[#0f3d32] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSaving && (
            <Loader2
              size={14}
              className="animate-spin"
            />
          )}

          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </header>
  );
}