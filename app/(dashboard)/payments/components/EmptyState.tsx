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
        rounded-[2rem]
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
        <div className="w-12 h-12 rounded-2xl bg-white border border-stone-100 flex items-center justify-center text-[#a9b897] shadow-sm mb-4">
          <Icon size={19} />
        </div>
      )}

      <h4 className="font-serif italic text-xl tracking-tight text-stone-900">
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
              bg-stone-900
              text-white
              hover:bg-[#a9b897]
              hover:text-stone-900
              transition-all
              flex
              items-center
              gap-2
            "
          >
            <Plus size={13} />

            <span className="text-[8px] font-black uppercase tracking-widest">
              {actionLabel}
            </span>
          </button>
        )}
    </div>
  );
}