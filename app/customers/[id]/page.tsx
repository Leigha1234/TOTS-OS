"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Card from "@/app/components/Card"; 
import Button from "@/app/components/Button";
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  FileText, Upload, User, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TEMPLATES = [
  { id: 'minimal', name: 'Minimalist', icon: <Type size={16}/>, description: "Classic typewriter aesthetic." },
  { id: 'visual', name: 'Visual', icon: <ImageIcon size={16}/>, description: "Hero image focused design." },
  { id: 'letter', name: 'Founder', icon: <User size={16}/>, description: "Personalized letterhead style." },
  { id: 'report', name: 'Intel', icon: <FileText size={16}/>, description: "Structured data & insights." }
];

export default function CampaignsPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audienceType, setAudienceType] = useState<'list' | 'individual'>('individual');
  
  const [branding, setBranding] = useState({
    logo_url: "",
    contact_details: "Studio 4, The Creative Quarter, London",
    company_name: "The Organised Types"
  });

  const [form, setForm] = useState({
    title: "",
    subject: "",
    list_id: "",
    customer_id: "",
    template_id: "minimal",
    scheduled_for: "",
    content: ""
  });

  useEffect(() => { init(); }, []);

  async function init() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: mem } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
    if (mem?.team_id) {
      setTeamId(mem.team_id);
      loadData(mem.team_id);
    }
  }

  async function loadData(tId: string) {
    const supabase = await createClient();
    const { data: camps } = await supabase.from("campaigns").select("*, subscriber_lists(name)").eq("team_id", tId).order("scheduled_for", { ascending: true });
    const { data: listRes } = await supabase.from("subscriber_lists").select("*").eq("team_id", tId);
    const { data: custRes } = await supabase.from("customers").select("*").eq("team_id", tId);

    setCampaigns(camps || []);
    setLists(listRes || []);
    setCustomers(custRes || []);
  }

  const handleSchedule = async () => {
    if (!teamId) return alert("Team ID missing.");
    const targetSet = audienceType === 'list' ? form.list_id : form.customer_id;
    if (!targetSet || !form.title || !form.subject) return alert("Missing required fields.");

    setLoading(true);
    const supabase = await createClient();
    const payload = {
      ...form,
      team_id: teamId,
      status: 'scheduled',
      content: `${form.content}\n\n---\n${branding.company_name}\n${branding.contact_details}`
    };

    const { error } = await supabase.from("campaigns").insert([payload]);
    if (!error) {
      setShowModal(false);
      loadData(teamId);
      setForm({ title: "", subject: "", list_id: "", customer_id: "", template_id: "minimal", scheduled_for: "", content: "" });
    }
    setLoading(false);
  };

  return (
    <main className="p-8 md:p-12 space-y-12 max-w-7xl mx-auto min-h-screen bg-[#faf9f6] text-stone-900">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-stone-200 pb-12">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Communications</p>
          <h1 className="text-5xl font-serif italic text-stone-800 tracking-tighter">Campaigns</h1>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-stone-900 text-[#a9b897] flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
          <Plus size={16} /> New Dispatch
        </Button>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Queue</h2>
          {campaigns.length === 0 ? (
            <div className="p-16 text-center bg-white border border-stone-100 rounded-[3rem] italic text-stone-300">No transmissions in queue.</div>
          ) : (
            campaigns.map(c => (
              <Card key={c.id} className="p-8 rounded-[2.5rem] flex justify-between items-center hover:border-[#a9b897]/50 transition-all cursor-default">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-stone-50 rounded-2xl text-[#a9b897]"><Clock size={20} /></div>
                  <div>
                    <h3 className="font-bold text-lg">{c.title}</h3>
                    <p className="text-[9px] uppercase tracking-widest text-stone-400">
                      Target: {new Date(c.scheduled_for).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-stone-100 rounded-full text-stone-500">{c.status}</div>
              </Card>
            ))
          )}
        </div>

        <aside className="lg:col-span-4 bg-[#1c1c1c] rounded-[3rem] p-10 text-white h-fit shadow-2xl">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 mb-6">Network Nodes</h2>
          <div className="space-y-4 font-mono">
            <div className="flex justify-between text-[10px] uppercase text-[#a9b897]">
              <span>Active Recipients</span>
              <span>{customers.length}</span>
            </div>
            <div className="flex justify-between text-[10px] uppercase text-stone-500 border-t border-stone-800 pt-4">
              <span>Mailing Segments</span>
              <span>{lists.length}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* COMPOSER MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-7xl h-[92vh] rounded-[4rem] shadow-3xl flex overflow-hidden border border-stone-200 relative"
            >
              <div className="w-80 bg-stone-50 border-r border-stone-100 flex flex-col p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">Config</p>
                  <button onClick={() => setShowModal(false)} className="text-stone-300 hover:text-stone-900"><X size={20}/></button>
                </header>

                <div className="space-y-8">
                  <section>
                    <label className="text-[8px] font-black uppercase text-stone-400 block mb-4">Template Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TEMPLATES.map(t => (
                        <button 
                          key={t.id} 
                          onClick={() => setForm({...form, template_id: t.id})}
                          className={`p-3 rounded-xl border text-center transition-all ${form.template_id === t.id ? 'bg-white border-stone-200 shadow-sm text-[#a9b897]' : 'border-transparent text-stone-400 opacity-60'}`}
                        >
                          <div className="flex justify-center mb-1">{t.icon}</div>
                          <span className="text-[8px] font-black uppercase">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <label className="text-[8px] font-black uppercase text-stone-400">Audience Segment</label>
                    <div className="bg-stone-200/50 p-1 rounded-xl flex">
                      <button onClick={() => setAudienceType('individual')} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${audienceType === 'individual' ? 'bg-white shadow-sm' : 'text-stone-400'}`}>Node</button>
                      <button onClick={() => setAudienceType('list')} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${audienceType === 'list' ? 'bg-white shadow-sm' : 'text-stone-400'}`}>List</button>
                    </div>
                    <select 
                      className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-[10px] font-bold uppercase outline-none"
                      value={audienceType === 'individual' ? form.customer_id : form.list_id}
                      onChange={e => setForm(audienceType === 'individual' ? {...form, customer_id: e.target.value} : {...form, list_id: e.target.value})}
                    >
                      <option value="">Select Target...</option>
                      {audienceType === 'individual' 
                        ? customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                        : lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                      }
                    </select>
                  </section>
                </div>
              </div>

              <div className="flex-1 bg-[#fcfbf9] overflow-y-auto p-12 flex flex-col items-center">
                 {/* ... remainder of UI for editor remains same ... */}
                 <div className="mt-12 flex items-center gap-8">
                  <button onClick={() => setShowModal(false)} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">Abort</button>
                  <Button 
                    disabled={loading}
                    onClick={handleSchedule} 
                    className="bg-stone-900 text-[#a9b897] px-16 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    {loading ? "Transmitting..." : "Schedule Dispatch"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}