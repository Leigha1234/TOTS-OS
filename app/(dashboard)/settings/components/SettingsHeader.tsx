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
    <header className="mb-12 flex flex-col gap-8 border-b border-stone-200 pb-10 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-6">
        <div>

          <h1 className="mt-3 break-words font-serif text-4xl italic tracking-tighter sm:text-5xl lg:text-6xl xl:text-7xl">
            Settings
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-stone-500">
            Manage your profile, organisation, branding, social media
            integrations and account security from one place.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-full border border-stone-300 bg-white px-8 py-5 text-[10px] font-black uppercase tracking-wider transition hover:bg-stone-50 sm:w-auto"
        >
          Sign Out
        </button>

        <button
          type="button"
          onClick={onManageSubscription}
          className="w-full rounded-full border border-stone-300 bg-white px-8 py-5 text-[10px] font-black uppercase tracking-wider transition hover:bg-stone-50 sm:w-auto"
        >
          Manage Subscription
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex w-full min-w-[170px] items-center justify-center gap-2 rounded-full bg-stone-900 px-10 py-5 text-[10px] font-black uppercase tracking-wider text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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