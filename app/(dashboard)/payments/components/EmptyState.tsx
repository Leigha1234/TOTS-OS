"use client";

import {
  LucideIcon,
  Plus,
} from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;

  title: string;

  description?: string;

  actionLabel?: string;

  onAction?: () => void;

  compact?: boolean;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`
        w-full
        border
        border-dashed
        border-stone-200
        bg-[#faf9f6]
        rounded-[24px]
        flex
        flex-col
        items-center
        justify-center
        text-center
        ${
          compact
            ? "px-5 py-8"
            : "px-6 py-14"
        }
      `}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-white border border-[#E6ECE7] flex items-center justify-center text-[#0F3D32] shadow-sm mb-4">
          <Icon size={19} />
        </div>
      )}

      <h4 className="font-serif italic text-xl tracking-tight text-[#1E2A27]">
        {title}
      </h4>

      {description && (
        <p className="text-xs text-stone-400 max-w-sm leading-relaxed mt-2">
          {description}
        </p>
      )}

      {actionLabel &&
        onAction && (
          <button
            type="button"
            onClick={
              onAction
            }
            className="
              mt-5
              px-5 py-2.5
              rounded-full
              bg-[#0F3D32]
              text-white
              hover:bg-[#0F3D32]
              hover:text-[#1E2A27]
              transition-all
              flex
              items-center
              gap-2
            "
          >
            <Plus size={13} />

            <span className="text-[11px] font-black uppercase tracking-widest">
              {actionLabel}
            </span>
          </button>
        )}
    </div>
  );
}