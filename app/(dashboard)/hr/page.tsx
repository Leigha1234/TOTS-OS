"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save,
  Users,
  Clock,
  Calendar,
  X,
  Award,
  Trash2,
  UserPlus
} from "lucide-react";

export default function HRPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Advanced HR Form
  const [empName, setEmpName] = useState("Jane Doe");
  const [empNumber, setEmpNumber] = useState("EMP-0401");
  const [empRole, setEmpRole] = useState("Marketing Executive");
  const [contractType, setContractType] = useState("Full-Time");
  const [workingHours, setWorkingHours] = useState("40");
  const [holidayEntitlement, setHolidayEntitlement] = useState("28");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinNumber, setNextOfKinNumber] = useState("");

  const [payrollEntries, setPayrollEntries] = useState<any[]>([
    { id: "1", employee: "Sarah Chen", role: "Developer", total: 2000, dateOfPay: "2026-05-28" }
  ]);

  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeRole, setNewEmployeeRole] = useState("");
  const [newEmployeePay, setNewEmployeePay] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const addPayrollEntry = () => {
    if (!newEmployeeName || !newEmployeePay) return;
    
    setPayrollEntries([
      ...payrollEntries,
      {
        id: Date.now().toString(),
        employee: newEmployeeName,
        role: newEmployeeRole || "Team Member",
        total: parseFloat(newEmployeePay),
        dateOfPay: new Date().toISOString().split("T")[0],
      }
    ]);
    setNewEmployeeName("");
    setNewEmployeeRole("");
    setNewEmployeePay("");
  };

  const removePayrollEntry = (id: string) => {
    setPayrollEntries(payrollEntries.filter(entry => entry.id !== id));
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 max-w-[1400px] mx-auto space-y-12">
      
      {/* HR Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <Users size={14} />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Human Resources Operations</p>
          </div>
          <h1 className="text-5xl font-serif italic tracking-tighter">Human Resources & Payroll</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-stone-200 px-6 py-4 rounded-2xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Personnel Operations</p>
        </div>
      </header>

      {/* Navigation Controls */}
      <div className="flex flex-wrap gap-4 border-b border-stone-200 pb-4">
        <button 
          onClick={() => router.push("/payments")}
          className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer transition"
        >
          Financials
        </button>
        <button 
          onClick={() => router.push("/timesheets")}
          className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer transition"
        >
          Timesheets
        </button>
        <button 
          className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-stone-900 text-white shadow-xl cursor-pointer"
        >
          HR & Payroll
        </button>
      </div>

      {/* Metric Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-stone-900 text-stone-100 p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-stone-800 rounded-2xl text-[#a9b897]"><Award size={24} /></div>
            <span className="text-[9px] font-black uppercase text-stone-500 tracking-[0.3em]">Total Payroll</span>
          </div>
          <div>
            <p className="text-4xl font-mono tracking-tighter">£{payrollEntries.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}</p>
            <p className="text-[10px] text-stone-500 uppercase font-black mt-2 tracking-widest">Aggregate Payroll Pool</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl"><Clock size={24} /></div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Active Contracts</span>
          </div>
          <div>
            <p className="text-4xl font-mono tracking-tighter text-stone-800">{contractType}</p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Contract Status</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><Calendar size={24} /></div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Holiday Entitlement</span>
          </div>
          <div>
            <p className="text-4xl font-mono tracking-tighter text-stone-800">{holidayEntitlement} Days</p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Annual Allowance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Profile Input Information Forms */}
        <div className="lg:col-span-2 bg-white border border-stone-200/60 p-10 rounded-[3rem] shadow-sm space-y-8">
          <div className="flex items-center gap-4 border-b border-stone-100 pb-6">
            <UserPlus size={20} className="text-[#a9b897]" />
            <h3 className="text-2xl font-serif italic text-stone-800">Employee Profiles & Records</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Full Name</label>
              <input 
                value={empName} 
                onChange={(e) => setEmpName(e.target.value)}
                className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Employee Number</label>
              <input 
                value={empNumber} 
                onChange={(e) => setEmpNumber(e.target.value)}
                className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Role Title</label>
              <input 
                value={empRole} 
                onChange={(e) => setEmpRole(e.target.value)}
                className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Contract Type</label>
              <select 
                value={contractType} 
                onChange={(e) => setContractType(e.target.value)}
                className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contractor">Contractor</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Working Hours (Weekly)</label>
              <input 
                type="number"
                value={workingHours} 
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Holiday Entitlement (Days)</label>
              <input 
                type="number"
                value={holidayEntitlement} 
                onChange={(e) => setHolidayEntitlement(e.target.value)}
                className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Next of Kin Name</label>
              <input 
                value={nextOfKinName} 
                onChange={(e) => setNextOfKinName(e.target.value)}
                className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Next of Kin Phone</label>
              <input 
                value={nextOfKinNumber} 
                onChange={(e) => setNextOfKinNumber(e.target.value)}
                className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
              />
            </div>
          </div>

          <div className="border-t border-stone-100 pt-8 space-y-6">
            <h4 className="text-xl font-serif italic text-stone-800">Payroll Instructions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Bank Name</label>
                <input 
                  value={bankName} 
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Account Number</label>
                <input 
                  value={accountNumber} 
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Sort Code</label>
                <input 
                  value={sortCode} 
                  onChange={(e) => setSortCode(e.target.value)}
                  className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8">
            <button 
              onClick={() => { alert("Employee profile changes saved!") }}
              className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer flex items-center gap-3 shadow-xl"
            >
              <Save size={16} /> Save Profile
            </button>
          </div>
        </div>

        {/* Sidebar Payroll Operations Section */}
        <div className="space-y-8">
          
          {/* Add Entry Card */}
          <div className="bg-white border border-stone-200/60 p-8 rounded-[2.5rem] space-y-6 shadow-sm">
            <h4 className="text-xl font-serif italic text-stone-800">Add Payroll Record</h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Employee Name</label>
                <input 
                  placeholder="Employee Name"
                  value={newEmployeeName} 
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Role</label>
                <input 
                  placeholder="Role Title"
                  value={newEmployeeRole} 
                  onChange={(e) => setNewEmployeeRole(e.target.value)}
                  className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Pay Amount (£)</label>
                <input 
                  type="number"
                  placeholder="Amount"
                  value={newEmployeePay} 
                  onChange={(e) => setNewEmployeePay(e.target.value)}
                  className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                />
              </div>
            </div>

            <button 
              onClick={addPayrollEntry}
              className="w-full py-4 bg-[#a9b897] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#99a788] transition-all cursor-pointer shadow-lg"
            >
              Log Payment Record
            </button>
          </div>

          {/* Payroll List */}
          <div className="bg-white border border-stone-200/60 p-8 rounded-[2.5rem] space-y-6 shadow-sm">
            <h4 className="text-xl font-serif italic text-stone-800">Recent Payroll Ledger</h4>
            
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
              {payrollEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-5 bg-stone-50 border border-stone-100/60 rounded-2xl">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-stone-800">{entry.employee}</p>
                    <p className="text-[9px] font-medium text-stone-500 uppercase">{entry.role}</p>
                    <p className="text-[9px] font-mono text-[#a9b897] mt-1">Due: {entry.dateOfPay}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-bold text-stone-900">£{entry.total.toLocaleString()}</span>
                    <button 
                      onClick={() => removePayrollEntry(entry.id)} 
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-white rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {payrollEntries.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-xs text-stone-400 font-serif italic">No recent payroll entries logged.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}