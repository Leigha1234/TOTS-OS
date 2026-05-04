"use client";

import { useState } from "react";
import { UserPlus, Briefcase } from "lucide-react";

export function TeamOnboard() {
  const [empName, setEmpName] = useState("Jane Doe");
  const [empRole, setEmpRole] = useState("Marketing Executive");
  const [bankDetails, setBankDetails] = useState("");
  const [nextOfKin, setNextOfKin] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = () => {
    alert(`Team Member ${empName} submitted to the database.`);
  };

  return (
    <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-8">
      <div className="flex items-center gap-3 text-stone-800">
        <UserPlus size={18} className="text-[#a9b897]" />
        <h4 className="text-xl font-serif italic tracking-tight">Onboard New Team Member</h4>
      </div>

      <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">Team Matrix Database Update</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Name</label>
          <input
            value={empName}
            onChange={(e) => setEmpName(e.target.value)}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none font-medium text-stone-800"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Role/Title</label>
          <input
            value={empRole}
            onChange={(e) => setEmpRole(e.target.value)}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none font-medium text-stone-800"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Bank Details</label>
          <input
            placeholder="Bank name and account information"
            value={bankDetails}
            onChange={(e) => setBankDetails(e.target.value)}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none font-medium text-stone-800"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Next of Kin</label>
          <input
            placeholder="Name and number"
            value={nextOfKin}
            onChange={(e) => setNextOfKin(e.target.value)}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none font-medium text-stone-800"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm text-stone-800 focus:ring-4 ring-[#a9b897]/5 outline-none font-medium"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm text-stone-800 focus:ring-4 ring-[#a9b897]/5 outline-none font-medium"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-4 bg-[#a9b897]/20 border border-[#a9b897]/30 text-stone-900 rounded-2xl text-xs uppercase font-bold hover:bg-[#a9b897]/30 cursor-pointer flex items-center justify-center gap-2"
      >
        <Briefcase size={14} /> Submit to Team Matrix
      </button>
    </div>
  );
}