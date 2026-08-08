"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Pause,
  XCircle,
} from "lucide-react";

type StatusPillProps = {
  status?: string | null;
  showIcon?: boolean;
  className?: string;
};

type StatusConfig = {
  label: string;
  classes: string;
  icon: React.ElementType;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Successful / completed
  paid: {
    label: "Paid",
    classes: "bg-green-50 text-green-700 border-green-100",
    icon: CheckCircle2,
  },
  accepted: {
    label: "Accepted",
    classes: "bg-green-50 text-green-700 border-green-100",
    icon: CheckCircle2,
  },
  approved: {
    label: "Approved",
    classes: "bg-green-50 text-green-700 border-green-100",
    icon: CheckCircle2,
  },
  submitted: {
    label: "Submitted",
    classes: "bg-green-50 text-green-700 border-green-100",
    icon: FileCheck2,
  },
  filed: {
    label: "Filed",
    classes: "bg-green-50 text-green-700 border-green-100",
    icon: FileCheck2,
  },
  converted: {
    label: "Converted",
    classes: "bg-green-50 text-green-700 border-green-100",
    icon: CheckCircle2,
  },
  active: {
    label: "Active",
    classes: "bg-green-50 text-green-700 border-green-100",
    icon: CheckCircle2,
  },

  // Waiting / in progress
  pending: {
    label: "Pending",
    classes: "bg-amber-50 text-amber-700 border-amber-100",
    icon: Clock3,
  },
  processing: {
    label: "Processing",
    classes: "bg-blue-50 text-blue-700 border-blue-100",
    icon: Clock3,
  },
  scheduled: {
    label: "Scheduled",
    classes: "bg-blue-50 text-blue-700 border-blue-100",
    icon: Clock3,
  },
  sent: {
    label: "Sent",
    classes: "bg-blue-50 text-blue-700 border-blue-100",
    icon: Clock3,
  },

  // Draft
  draft: {
    label: "Draft",
    classes: "bg-stone-50 text-stone-500 border-stone-200",
    icon: FileCheck2,
  },

  // Paused / inactive
  paused: {
    label: "Paused",
    classes: "bg-stone-50 text-stone-500 border-stone-200",
    icon: Pause,
  },
  inactive: {
    label: "Inactive",
    classes: "bg-stone-50 text-stone-500 border-stone-200",
    icon: Pause,
  },

  // Attention
  overdue: {
    label: "Overdue",
    classes: "bg-red-50 text-red-600 border-red-100",
    icon: AlertCircle,
  },
  rejected: {
    label: "Rejected",
    classes: "bg-red-50 text-red-600 border-red-100",
    icon: XCircle,
  },
  failed: {
    label: "Failed",
    classes: "bg-red-50 text-red-600 border-red-100",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-red-50 text-red-600 border-red-100",
    icon: XCircle,
  },
};

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function StatusPill({
  status,
  showIcon = false,
  className = "",
}: StatusPillProps) {
  const normalizedStatus = (status || "draft")
    .toString()
    .toLowerCase()
    .trim();

  const config =
    STATUS_CONFIG[normalizedStatus] || {
      label: formatStatus(normalizedStatus),
      classes: "bg-stone-50 text-stone-500 border-stone-200",
      icon: Clock3,
    };

  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-3 py-1.5
        rounded-full
        border
        text-[8px]
        font-black
        uppercase
        tracking-[0.12em]
        whitespace-nowrap
        ${config.classes}
        ${className}
      `}
    >
      {showIcon && <Icon size={10} strokeWidth={2.5} />}

      <span>{config.label}</span>
    </span>
  );
}