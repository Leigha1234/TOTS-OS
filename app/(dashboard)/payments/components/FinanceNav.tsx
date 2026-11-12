"use client";
import type React from "react";
import { BarChart3, BriefcaseBusiness, Clock3, FileText, Landmark, Receipt, ShoppingBag, CalendarDays, CreditCard } from "lucide-react";
export type FinanceTab = "overview" | "storeReports" | "bookingReports" | "stripeReports" | "sales" | "expenses" | "tax" | "payroll" | "timesheets";
type FinanceNavProps = { activeTab: FinanceTab; onChange: (tab: FinanceTab) => void };
const tabs: { key: FinanceTab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "storeReports", label: "Store Reports", icon: ShoppingBag },
  { key: "bookingReports", label: "Booking Reports", icon: CalendarDays },
  { key: "stripeReports", label: "Stripe Reports", icon: CreditCard },
  { key: "sales", label: "Invoices & quotes", icon: FileText },
  { key: "expenses", label: "Expenses", icon: Receipt, ShoppingBag, CalendarDays, CreditCard },
  { key: "tax", label: "Tax & VAT", icon: Landmark },
  { key: "payroll", label: "Payroll", icon: BriefcaseBusiness },
  { key: "timesheets", label: "Timesheets", icon: Clock3 },
];
export default function FinanceNav({ activeTab, onChange }: FinanceNavProps) {
  return <div className="w-full overflow-x-auto pb-1"><nav aria-label="Finance sections" className="flex min-w-max items-center gap-1.5 rounded-2xl border border-[#E5EAE5] bg-white p-2 shadow-[0_6px_22px_-16px_rgba(20,40,30,.35)]">
    {tabs.map(({ key, label, icon: Icon }) => <button key={key} type="button" aria-current={activeTab === key ? "page" : undefined} onClick={() => onChange(key)} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D32] ${activeTab === key ? "bg-[#0F3D32] text-white shadow-sm" : "text-[#52645A] hover:bg-[#EAF1EC] hover:text-[#0F3D32]"}`}><Icon size={16} aria-hidden="true" />{label}</button>)}
  </nav></div>;
}
