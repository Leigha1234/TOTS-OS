"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  FileText,
  Landmark,
  Receipt,
} from "lucide-react";

export type FinanceTab =
  | "overview"
  | "sales"
  | "expenses"
  | "tax"
  | "payroll"
  | "timesheets";

type FinanceNavProps = {
  activeTab: FinanceTab;
  onChange: (
    tab: FinanceTab
  ) => void;
};

const tabs: {
  key: FinanceTab;
  label: string;
  icon: React.ElementType;
}[] = [
  {
    key: "overview",
    label: "Overview",
    icon: BarChart3,
  },
  {
    key: "sales",
    label: "Invoices & Quotes",
    icon: FileText,
  },
  {
    key: "expenses",
    label: "Expenses",
    icon: Receipt,
  },
  {
    key: "tax",
    label: "Tax & VAT",
    icon: Landmark,
  },
  {
    key: "payroll",
    label: "Payroll",
    icon: BriefcaseBusiness,
  },
  {
    key: "timesheets",
    label: "Timesheets",
    icon: Clock3,
  },
];

export default function FinanceNav({
  activeTab,
  onChange,
}: FinanceNavProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <nav className="flex items-center gap-1 min-w-max bg-white border border-stone-100 shadow-sm rounded-[1.5rem] p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                onChange(tab.key)
              }
              className={`
                flex items-center gap-2
                px-4 py-2.5
                rounded-xl
                whitespace-nowrap
                transition-all duration-200
                ${
                  active
                    ? "bg-stone-900 text-white shadow-md"
                    : "text-stone-400 hover:text-stone-900 hover:bg-[#faf9f6]"
                }
              `}
            >
              <Icon
                size={14}
                className={
                  active
                    ? "text-[#a9b897]"
                    : ""
                }
              />

              <span className="text-[8px] font-black uppercase tracking-[0.14em]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}