"use client";

import React from "react";
import { Activity, Cpu } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
  isDark?: boolean;
  highlight?: boolean;
  pulse?: boolean;
  className?: string;
};

export default function MetricCard({
  label,
  value,
  sub,
  icon,
  prefix = "£",
  suffix = "",
  isDark = false,
  highlight = false,
  pulse = false,
  className = "",
}: MetricCardProps) {
  const formattedValue =
    typeof value === "number"
      ? value.toLocaleString("en-GB", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : value;

  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-[24px]
        p-5
        sm:p-6
        min-h-[155px]
        sm:min-h-[175px]
        flex
        flex-col
        justify-between
        transition-all
        duration-500
        group
        ${
          isDark
            ? "bg-[#0F3D32] border border-[#0F3D32] text-white shadow-xl"
            : "bg-white border border-[#E6ECE7] text-[#1E2A27] shadow-[0_10px_28px_-22px_rgba(15,61,50,.4)] hover:shadow-md"
        }
        ${className}
      `}
    >
      {/* HEADER */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <p
          className={`
            text-[11px]
            font-black
            uppercase
            tracking-[0.12em]
            ${
              isDark
                ? "text-[#D7E8DD]"
                : "text-[#63786D]"
            }
          `}
        >
          {label}
        </p>

        {icon && (
          <div
            className={`
              p-3
              rounded-xl
              transition-all
              ${
                isDark
                  ? "bg-white/15 text-white"
                  : "bg-[#faf9f6] text-[#63786D] group-hover:text-stone-900"
              }
            `}
          >
            {React.isValidElement(icon)
              ? React.cloneElement(
                  icon as React.ReactElement<{
                    size?: number;
                  }>,
                  {
                    size: 16,
                  }
                )
              : icon}
          </div>
        )}
      </div>

      {/* VALUE */}
      <div className="relative z-10 mt-5 text-left">
        <h2
          className={`
            font-semibold tabular-nums
            tracking-tighter
            leading-tight
            ${
              String(formattedValue).length > 10
                ? "text-xl sm:text-2xl"
                : "text-2xl sm:text-3xl"
            }
            ${
              highlight
                ? "text-[#0F3D32]"
                : isDark
                  ? "text-white"
                  : "text-stone-900"
            }
          `}
        >
          {prefix}
          {formattedValue}
          {suffix}
        </h2>
      </div>

      {/* FOOTER */}
      <div
        className={`
          relative
          z-10
          pt-4
          border-t
          flex
          items-center
          justify-between
          gap-4
          ${
            isDark
              ? "border-white/10"
              : "border-stone-100"
          }
        `}
      >
        <span
          className={`
            text-[11px]
            font-serif
            italic
            ${
              isDark
                ? "text-[#E4EFE7]"
                : "text-stone-400"
            }
          `}
        >
          {sub || "—"}
        </span>

        {(pulse || isDark) && (
          <Activity
            size={10}
            className={`
              text-[#0F3D32]
              ${pulse ? "animate-pulse" : ""}
            `}
          />
        )}
      </div>

      {/* BACKGROUND DETAIL */}
      {isDark && (
        <Cpu
          size={120}
          className="
            absolute
            -right-10
            -top-10
            opacity-[0.03]
            text-white
            pointer-events-none
          "
        />
      )}

      {highlight && !isDark && (
        <div
          className="
            absolute
            -right-10
            -top-10
            w-28
            h-28
            rounded-full
            bg-[#0F3D32]/10
            pointer-events-none
          "
        />
      )}
    </div>
  );
}