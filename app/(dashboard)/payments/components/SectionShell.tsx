"use client";

import React from "react";

type SectionShellProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function SectionShell({
  title,
  subtitle,
  action,
  children,
  className = "",
  contentClassName = "",
}: SectionShellProps) {
  return (
    <section
      className={`
        bg-white
        border border-stone-100
        rounded-[2.5rem]
        p-5 sm:p-6 lg:p-8
        shadow-sm
        ${className}
      `}
    >
      <div
        className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          justify-between
          gap-4
          mb-6
        "
      >
        <div className="min-w-0">
          <h3
            className="
              text-2xl
              sm:text-3xl
              font-serif
              italic
              tracking-tighter
              text-stone-900
            "
          >
            {title}
          </h3>

          {subtitle && (
            <p
              className="
                text-sm
                text-stone-500
                mt-2
                max-w-2xl
                leading-relaxed
              "
            >
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>

      <div className={contentClassName}>
        {children}
      </div>
    </section>
  );
}