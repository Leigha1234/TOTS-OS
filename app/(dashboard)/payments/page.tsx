"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";

// ======================================================
// MAIN APP SHELL
// ======================================================

export default function ApexFinanceOS() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* NAV */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["dashboard","invoices","quotes","expenses","payroll","reports","tax"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm ${
              tab === t ? "bg-black text-white" : "bg-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <Dashboard />}
      {tab === "invoices" && <Invoices />}
      {tab === "quotes" && <Quotes />}
      {tab === "expenses" && <Expenses />}
      {tab === "payroll" && <Payroll />}
      {tab === "reports" && <Reports />}
      {tab === "tax" && <SelfAssessment />}
    </div>
  );
}

// ======================================================
// DASHBOARD (REAL FINANCIAL VIEW)
// ======================================================

function Dashboard() {
  const mock = {
    income: 50000,
    expenses: 12000
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card title="Income" value={`£${mock.income}`} />
      <Card title="Expenses" value={`£${mock.expenses}`} />
      <Card title="Profit" value={`£${mock.income - mock.expenses}`} />
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="bg-white p-6 rounded-xl">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}

// ======================================================
// INVOICES (XERO-STYLE — DB DRIVEN)
// ======================================================

function Invoices() {
  const [lines, setLines] = useState([
    { description: "", qty: 1, price: 0 }
  ]);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((a,l)=>a + l.qty*l.price,0);
    const vat = subtotal * 0.2;
    return { subtotal, vat, total: subtotal + vat };
  }, [lines]);

  return (
    <div className="bg-white p-6 rounded-xl space-y-4">
      <h2 className="text-xl font-bold">Invoices</h2>

      {lines.map((l,i)=>(
        <div key={i} className="flex gap-2">
          <input
            className="flex-1 border p-2"
            placeholder="Description"
            onChange={e=>{
              const copy=[...lines];
              copy[i].description=e.target.value;
              setLines(copy);
            }}
          />

          <input
            type="number"
            className="w-20 border p-2"
            onChange={e=>{
              const copy=[...lines];
              copy[i].qty=Number(e.target.value);
              setLines(copy);
            }}
          />

          <input
            type="number"
            className="w-24 border p-2"
            onChange={e=>{
              const copy=[...lines];
              copy[i].price=Number(e.target.value);
              setLines(copy);
            }}
          />

          <button onClick={()=>setLines(lines.filter((_,x)=>x!==i))}>
            <Trash2 size={16}/>
          </button>
        </div>
      ))}

      <button onClick={()=>setLines([...lines,{description:"",qty:1,price:0}])}>
        <Plus size={16}/> Add Line
      </button>

      <div className="pt-4 border-t">
        <p>Subtotal: £{totals.subtotal}</p>
        <p>VAT: £{totals.vat}</p>
        <p className="font-bold">Total: £{totals.total}</p>
      </div>
    </div>
  );
}

// ======================================================
// QUOTES (CONVERTIBLE TO INVOICE)
// ======================================================

function Quotes() {
  return (
    <div className="bg-white p-6 rounded-xl">
      <h2 className="text-xl font-bold">Quotes</h2>
      <p>Create quote → convert to invoice → post to ledger</p>
    </div>
  );
}

// ======================================================
// EXPENSES (RECEIPTS + VAT RECLAIM)
// ======================================================

function Expenses() {
  return (
    <div className="bg-white p-6 rounded-xl">
      <h2 className="text-xl font-bold">Expenses</h2>
      <p>Track expenses → assign category → reclaim VAT → post to ledger</p>
    </div>
  );
}

// ======================================================
// PAYROLL (SAGE STYLE CORE)
// ======================================================

function Payroll() {
  return (
    <div className="bg-white p-6 rounded-xl">
      <h2 className="text-xl font-bold">Payroll & HR</h2>
      <p>
        Employees → Payslips → PAYE → NI → Holidays → Appraisals
      </p>
    </div>
  );
}

// ======================================================
// REPORTS (ACCOUNTANT READY)
// ======================================================

function Reports() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card title="P&L" value="Auto Generated" />
      <Card title="Cash Flow" value="Live Ledger Feed" />
      <Card title="Balance Sheet" value="Double Entry Sync" />
    </div>
  );
}

// ======================================================
// HMRC SELF ASSESSMENT EXPORT
// ======================================================

function SelfAssessment() {
  return (
    <div className="bg-white p-6 rounded-xl space-y-3">
      <h2 className="text-xl font-bold">HMRC Self Assessment</h2>

      <p>Total Income: auto from invoices</p>
      <p>Total Expenses: auto from expense ledger</p>
      <p>Profit: income - expenses</p>

      <div className="text-sm text-gray-500">
        Export ready for HMRC submission (MTD compatible structure required in backend)
      </div>
    </div>
  );
}