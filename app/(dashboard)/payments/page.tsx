"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Banknote, 
  Plus, 
  Calculator, 
  Send, 
  Percent,
  Minus,
  Mail,
  FileText,
  Save,
  Check,
  UserPlus,
  Briefcase
} from "lucide-react";

export default function PaymentsPage() {
  // Ledger States
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  
  const [vatRate, setVatRate] = useState("20"); 
  const [discountAmount, setDiscountAmount] = useState("");
  const [liabilityLabel, setNewLiabilityLabel] = useState("");
  const [liabilityAmount, setNewLiabilityAmount] = useState("");
  
  // Onboarding Panel States
  const [empName, setEmpName] = useState("Jane Doe");
  const [empRole, setEmpRole] = useState("Marketing Executive");
  const [bankDetails, setBankDetails] = useState("");
  const [nextOfKin, setNextOfKin] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const addItem = () => {
    if (!newItemName || !newItemAmount) return;
    const amount = parseFloat(newItemAmount);
    const qty = parseInt(newItemQty) || 1;

    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: newItemName,
        amount: amount,
        quantity: qty,
        total: amount * qty,
      }
    ]);

    setNewItemName("");
    setNewItemAmount("");
    setNewItemQty("1");
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Calculation logic
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const discount = parseFloat(discountAmount) || 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const vat = taxableAmount * (parseFloat(vatRate) / 100);
  const total = taxableAmount + vat;

  // Handlers for controls
  const handleDispatch = () => {
    if (items.length === 0) {
      alert("Ledger is empty. Add elements to this invoice before dispatching.");
      return;
    }
    alert(`Invoice dispatched to workspace with a total of £${total.toFixed(2)}.`);
  };

  const handleSaveDraft = () => {
    alert("Ledger entry saved to draft state.");
  };

  const handleApprove = () => {
    alert("Invoice approved.");
  };

  const handleVoid = () => {
    setItems([]);
    setDiscountAmount("");
    alert("Ledger entry cleared.");
  };

  const handleLiability = () => {
    if (!liabilityLabel || !liabilityAmount) {
      alert("Please fill both Liability Label and Amount.");
      return;
    }
    alert(`Liability ${liabilityLabel} registered at £${liabilityAmount}.`);
    setNewLiabilityLabel("");
    setNewLiabilityAmount("");
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 max-w-[1600px] mx-auto space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <Calculator size={14} />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Integrated Ecosystem</p>
          </div>
          <h1 className="text-6xl font-serif italic tracking-tighter">ApexOS Payments & Appraisals</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* COLUMN 1: SIDEBAR INPUTS */}
        <div className="lg:col-span-1 space-y-8 h-fit">
          
          {/* LEDGER ENTRY */}
          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-serif italic text-stone-800 tracking-tight">New Ledger Entry</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Add an item to this invoice</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Item Description</label>
                <input
                  placeholder="e.g. Node Maintenance"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none transition-all font-medium placeholder:text-stone-300 text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Price (£)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none transition-all font-medium placeholder:text-stone-300 text-stone-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Quantity</label>
                  <input
                    type="number"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none font-medium text-stone-800"
                  />
                </div>
              </div>

              <button
                onClick={addItem}
                disabled={!newItemName || !newItemAmount}
                className="w-full py-5 rounded-[2rem] flex justify-center items-center gap-4 bg-stone-900 text-white disabled:opacity-40 hover:bg-stone-800 transition-all cursor-pointer font-bold tracking-[0.2em] text-xs uppercase shadow-xl"
              >
                <Plus size={16} /> Add Item
              </button>
            </div>
          </div>

          {/* LIABILITY MANAGEMENT */}
          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm space-y-6">
            <h3 className="text-xl font-serif italic text-stone-800 tracking-tight">Add Liability</h3>
            <div className="space-y-4">
              <input
                placeholder="Liability Label"
                value={liabilityLabel}
                onChange={(e) => setNewLiabilityLabel(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-10 px-4 text-xs font-bold outline-none text-stone-800"
              />
              <input
                type="number"
                placeholder="Amt (£)"
                value={liabilityAmount}
                onChange={(e) => setNewLiabilityAmount(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-10 px-4 text-xs font-bold outline-none text-stone-800"
              />
              <button
                onClick={handleLiability}
                className="w-full py-3 border border-stone-200 text-stone-700 rounded-2xl text-xs uppercase font-bold hover:bg-stone-50 cursor-pointer"
              >
                Add Liability
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2 AND 3: MAIN WORKSPACE */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ONBOARDING PANEL */}
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
              onClick={() => alert(`Team Member ${empName} submitted successfully.`)}
              className="w-full py-4 bg-[#a9b897]/20 border border-[#a9b897]/30 text-stone-900 rounded-2xl text-xs uppercase font-bold hover:bg-[#a9b897]/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <Briefcase size={14} /> Submit to Team Matrix
            </button>
          </div>

          {/* LEDGER DATA OR EMPTY STATE */}
          {items.length === 0 ? (
            <div className="h-[350px] border-2 border-dashed border-stone-200 rounded-[3.5rem] flex flex-col items-center justify-center p-12 text-center space-y-6 bg-white">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
                <Banknote size={24} className="text-stone-300" />
              </div>
              <p className="text-stone-400 font-serif italic text-xl">No items in the ledger.</p>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-8">
              <h4 className="text-2xl font-serif italic text-stone-800 tracking-tight">Ledger Items</h4>
              <div className="divide-y divide-stone-100">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-4">
                    <div>
                      <p className="font-semibold text-stone-800">{item.name}</p>
                      <p className="text-xs text-stone-400">£{item.amount} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-mono text-stone-900 font-bold">£{item.total.toFixed(2)}</span>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TOTALS AND VAT / DISCOUNT CALCULATIONS */}
          <div className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-stone-500 tracking-[0.2em]">VAT Rate (%)</label>
                <div className="relative">
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-sm text-white focus:ring-4 ring-[#a9b897]/20 outline-none appearance-none transition-all cursor-pointer font-bold"
                  >
                    <option value="0">0% (Zero Rated)</option>
                    <option value="5">5% (Reduced Rate)</option>
                    <option value="20">20% (Standard Rate)</option>
                  </select>
                  <Percent size={16} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-stone-500 tracking-[0.2em]">Discount Amount (£)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-sm text-white focus:ring-4 ring-[#a9b897]/20 outline-none transition-all placeholder:text-stone-700 font-bold"
                />
              </div>
            </div>

            <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-black tracking-widest text-stone-500 uppercase">Grand Total</p>
                <p className="text-5xl font-mono tracking-tighter">£{total.toFixed(2)}</p>
              </div>

              <button
                onClick={handleDispatch}
                className="w-full md:w-auto px-10 py-5 rounded-[2rem] bg-[#a9b897] text-stone-900 font-bold tracking-[0.3em] uppercase text-xs flex justify-center items-center gap-4 hover:bg-[#99a888] transition-all"
              >
                <Send size={16} /> Dispatch Ledger
              </button>
            </div>
          </div>

          {/* GLOBAL ACTIONS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={handleDispatch}
              className="py-4 bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-700 hover:border-stone-400 transition-all shadow-sm"
            >
              <Mail size={16} />
              <span className="text-[8px] font-black uppercase tracking-wider">Email to Client</span>
            </button>
            
            <button
              onClick={() => alert("PDF Export feature processing.")}
              className="py-4 bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-700 hover:border-stone-400 transition-all shadow-sm"
            >
              <FileText size={16} />
              <span className="text-[8px] font-black uppercase tracking-wider">Export PDF</span>
            </button>

            <button
              onClick={handleSaveDraft}
              className="py-4 bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-700 hover:border-stone-400 transition-all shadow-sm"
            >
              <Save size={16} />
              <span className="text-[8px] font-black uppercase tracking-wider">Save Draft</span>
            </button>

            <button
              onClick={handleApprove}
              className="py-4 bg-green-50 border border-green-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-green-600 hover:bg-green-100/40 transition-all cursor-pointer"
            >
              <Check size={16} />
              <span className="text-[8px] font-black uppercase tracking-wider">Approve</span>
            </button>
          </div>

          {/* VOID/RESET PANEL */}
          <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-red-700">Clear Ledger Data</p>
              <p className="text-[9px] text-red-400 tracking-wider uppercase font-black">Reset invoice values to zero</p>
            </div>
            <button
              onClick={handleVoid}
              className="px-6 py-3 bg-red-600 text-white rounded-xl text-[9px] uppercase font-black hover:bg-red-500 shadow-sm"
            >
              Void
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}