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
        rounded-[2rem]
        border
        p-5
        sm:p-6
        transition-all
        duration-300
        ${
          dark
            ? "bg-stone-900 border-stone-900 text-white shadow-xl"
            : "bg-white border-stone-100 text-stone-900 shadow-sm"
        }
        ${className}
      `}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <p
          className={`
            text-[8px]
            font-black
            uppercase
            tracking-[0.3em]
            ${
              dark
                ? "text-stone-400"
                : "text-stone-400"
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
                  ? "bg-white/5 text-[#a9b897]"
                  : "bg-[#faf9f6] text-[#a9b897]"
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
          className={`
            font-mono
            text-2xl
            sm:text-3xl
            font-semibold
            tracking-tighter
            break-words
            ${
              highlight
                ? "text-[#a9b897]"
                : dark
                  ? "text-white"
                  : "text-stone-900"
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
                : "border-stone-100"
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
            bg-[#a9b897]/10
            pointer-events-none
          "
        />
      )}
    </div>
  );
}