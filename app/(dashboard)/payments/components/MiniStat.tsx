"use client";

import React from "react";

type MiniStatProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
  dark?: boolean;
  highlight?: boolean;
  className?: string;
};

export default function MiniStat({
  label,
  value,
  sub,
  icon,
  prefix = "",
  suffix = "",
  dark = false,
  highlight = false,
  className = "",
}: MiniStatProps) {
  const formattedValue =
    typeof value === "number"
      ? value.toLocaleString("en-GB", {
          maximumFractionDigits: 2,
        })
      : value;

  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-[24px]
        border
        p-5
        sm:p-6
        transition-all
        duration-300
        ${
          dark
            ? "bg-[#0F3D32] border-stone-900 text-white shadow-xl"
            : "bg-white border-[#E6ECE7] text-[#1E2A27] shadow-sm"
        }
        ${className}
      `}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <p
          style={{
            color: dark ? "#FFFFFF" : "#103D30",
            WebkitTextFillColor: dark ? "#FFFFFF" : "#103D30",
            opacity: 1,
          }}
          className={`
            text-[11px]
            font-black
            uppercase
            tracking-[0.3em]
            ${
              dark
                ? "text-white/75"
                : "text-[#52665C]"
            }
          `}
        >
          {label}
        </p>

        {icon && (
          <div
            className={`
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              ${
                dark
                  ? "bg-white/5 text-[#0F3D32]"
                  : "bg-[#faf9f6] text-[#0F3D32]"
              }
            `}
          >
            {icon}
          </div>
        )}
      </div>

      {/* VALUE */}
      <div className="mt-5">
        <p
          style={{ color: dark ? "#FFFFFF" : "#102F27", opacity: 1, WebkitTextFillColor: dark ? "#FFFFFF" : "#102F27" }}
          className={`
            font-mono
            text-2xl
            sm:text-3xl
            font-semibold
            tracking-tighter
            break-words
            ${
              highlight
                ? "text-[#0F3D32]"
                : dark
                  ? "text-white"
                  : "text-[#1E2A27]"
            }
          `}
        >
          {prefix}
          {formattedValue}
          {suffix}
        </p>
      </div>

      {/* SUBTEXT */}
      {sub && (
        <div
          className={`
            mt-5
            pt-4
            border-t
            ${
              dark
                ? "border-white/10"
                : "border-[#E6ECE7]"
            }
          `}
        >
          <p
            className={`
              text-[9px]
              leading-relaxed
              ${
                dark
                  ? "text-stone-400"
                  : "text-stone-500"
              }
            `}
          >
            {sub}
          </p>
        </div>
      )}

      {/* DECORATIVE ACCENT */}
      {highlight && (
        <div
          className="
            absolute
            -right-8
            -top-8
            h-24
            w-24
            rounded-full
            bg-[#0F3D32]/10
            pointer-events-none
          "
        />
      )}
    </div>
  );
}