"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getUserTeam, getUserRole, canCreate } from "@/lib/permissions";
import Button from "@/app/components/Button"; 
import { User, Building2, Mail, Trash2, Plus, Search, ChevronRight, Contact2 } from "lucide-react";
import Link from "next/link";

export default function CRMPage() {
  // --- STATE ---
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    client_type: "Lead",
    status: "live",
  });

  // --- DATA ACTIONS ---
  const loadData = useCallback(async (team: string, searchTerm: string = "") => {
    let query = supabase.from("customers").select("*").eq("team_id", team);
    
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`);
    }

    const { data } = await query.order("created_at", { ascending: false });
    if (data) setCustomers(data);
  }, []);

  // --- INITIALIZE ---
  useEffect(() => {
    async function init() {
      const team = await getUserTeam();
      const r = await getUserRole();
      if (team) {
        setTeamId(team);
        setRole(r);
        await loadData(team);
      }
      setLoading(false);
    }
    init();
  }, [loadData]);

  async function addCustomer() {
    if (!teamId || !canCreate(role)) {
      alert("Unauthorized to create records.");
      return;
    }
    if (!form.name || !form.email) return alert("Name and Email are required.");

    setAdding(true);
    const { error } = await supabase.from("customers").insert({
      ...form,
      team_id: teamId,
      stage: "lead"
    });

    if (error) {
      alert(error.message);
    } else {
      setForm({ name: "", email: "", company: "", client_type: "Lead", status: "live" });
      await loadData(teamId);
    }
    setAdding(false);
  }

  async function deleteCustomer(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this profile?")) return;
    await supabase.from("customers").delete().eq("id", id);
    loadData(teamId!);
  }

  if (loading) return <div className="p-12 text-stone-500 italic font-serif bg-black min-h-screen">Initialising Directory...</div>;

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto min-h-screen text-white">
      {/* HEADER */}
      <header className="flex justify-between items-end">
        <div>
            <h1 className="text-5xl font-serif italic tracking-tighter">Network Directory</h1>
            <p className="text-stone-500 text-[10px] uppercase tracking-[0.4em] mt-2">
            Clearance Level: <span className="text-[#a9b897]">{role}</span>
            </p>
        </div>
        <Link href="/campaigns" className="text-[10px] font-black uppercase tracking-widest text-stone-600 hover:text-[#a9b897] transition-colors border-b border-stone-800 pb-1">
            Global Campaigns →
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* ADD PROFILE FORM */}
        <div className="bg-stone-950 border border-stone-800 p-8 rounded-[2.5rem] space-y-5 h-fit lg:sticky lg:top-8 shadow-2xl">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-[#a9b897] mb-2 flex items-center gap-2 font-sans">
            <Plus size={14} /> Initialize Node
          </h2>
          <div className="space-y-3">
            <input 
              placeholder="Full Name" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-stone-900 border border-stone-800 p-4 rounded-2xl text-white text-sm outline-none focus:border-[#a9b897] transition-all"
            />
            <input 
              placeholder="Email Address" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full bg-stone-900 border border-stone-800 p-4 rounded-2xl text-white text-sm outline-none focus:border-[#a9b897] transition-all"
            />
            <input 
              placeholder="Company" 
              value={form.company} 
              onChange={e => setForm({...form, company: e.target.value})}
              className="w-full bg-stone-900 border border-stone-800 p-4 rounded-2xl text-white text-sm outline-none focus:border-[#a9b897] transition-all"
            />
          </div>
          <Button onClick={addCustomer} disabled={adding} className="w-full py-5 rounded-2xl">
            {adding ? "Writing to Database..." : "Create Profile"}
          </Button>
        </div>

        {/* SEARCH & LIST */}
        <div className="lg:col-span-2 space-y-8">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-600" size={20} />
            <input 
              placeholder="Search intelligence records..." 
              value={search}
              onChange={e => {
                  setSearch(e.target.value);
                  loadData(teamId!, e.target.value);
              }}
              className="w-full bg-stone-950 border border-stone-800 p-5 pl-14 rounded-[1.5rem] text-white outline-none focus:border-[#a9b897] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customers.map((c) => (
              <Link href={`/customers/${c.id}`} key={c.id} className="block group">
                <div className="bg-stone-950 border border-stone-800 p-6 rounded-[2rem] group-hover:border-[#a9b897] transition-all cursor-pointer relative shadow-lg overflow-hidden">
                  
                  {/* Background Decoration */}
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <Contact2 size={120} />
                  </div>

                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-stone-900 rounded-2xl text-[#a9b897] group-hover:bg-[#a9b897] group-hover:text-black transition-all">
                      <User size={20} />
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-stone-600 group-hover:text-[#a9b897]">
                        View Profile <ChevronRight size={14} />
                    </div>
                  </div>

                  <div className="space-y-1 relative z-10">
                    <h3 className="text-xl font-serif italic text-white">{c.name}</h3>
                    <div className="flex items-center gap-2 text-stone-500">
                      <Building2 size={12} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">{c.company || "Independent Record"}</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-stone-900 flex justify-between items-center relative z-10">
                    <div className="flex gap-2 items-center text-stone-600 group-hover:text-stone-400">
                       <Mail size={12} />
                       <span className="text-[10px]">{c.email}</span>
                    </div>
                    <button 
                      onClick={(e) => deleteCustomer(c.id, e)}
                      className="p-2 text-stone-800 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Link>
            ))}

            {customers.length === 0 && (
              <div className="col-span-2 py-20 text-center border border-dashed border-stone-800 rounded-[3rem]">
                <p className="text-stone-600 font-serif italic">No profiles found in this sector.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}