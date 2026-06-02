"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  FileText, User, ShieldCheck, Zap, Activity,
  Settings2, SendHorizonal, Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const TEMPLATES = [
  { id: 'minimal', name: 'Minimalist', icon: <Type size={14}/> },
  { id: 'visual', name: 'Visual', icon: <ImageIcon size={14}/> },
  { id: 'letter', name: 'Founder', icon: <User size={14}/> },
  { id: 'report', name: 'Intel', icon: <FileText size={14}/> }
];

export default function CampaignsPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audienceType, setAudienceType] = useState<'list' | 'individual'>('individual');
  
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: mem } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
    if (mem?.team_id) {
      setTeamId(mem.team_id);
      loadData(mem.team_id);
    }
  }

  async function loadData(tId: string) {
    const supabase = createClient();
    const { data: camps } = await supabase.from("campaigns").select("*, subscriber_lists(name)").eq("team_id", tId).order("scheduled_for", { ascending: true });
    const { data: listRes } = await supabase.from("subscriber_lists").select("*").eq("team_id", tId);
    const { data: custRes } = await supabase.from("customers").select("*").eq("team_id", tId);

    setCampaigns(camps || []);
    setLists(listRes || []);
    setCustomers(custRes || []);
  }

  const handleSchedule = async () => {
    if (!teamId) return;
    const targetSet = audienceType === 'list' ? form.list_id : form.customer_id;
    if (!targetSet || !form.title || !form.subject) {
      return toast.error("Configuration Error", { description: "Missing protocol fields." });
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("campaigns").insert([{
      ...form,
      team_id: teamId,
      status: 'scheduled',
    }]);

    if (!error) {
      toast.success("Transmission Locked", { description: "Dispatch scheduled in queue." });
      setShowModal(false);
      loadData(teamId);
      setForm({ title: "", subject: "", list_id: "", customer_id: "", template_id: "minimal", scheduled_for: "", content: "" });
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] p-8 md:p-20 space-y-16">
      
      {/* HEADER PROTOCOL */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--border)] pb-12 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--brand-primary)]">
            <Activity size={14} />
            <p className="font-black uppercase text-[10px] tracking-[0.4em]">Communications Hub</p>
          </div>
          <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none">Campaigns</h1>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[var(--text-main)] text-[var(--bg)] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-[var(--brand-primary)] hover:text-white transition-all shadow-xl group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-500" />
          Create Transmission
        </button>
      </header>

      {/* SYSTEM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* TRANSMISSION QUEUE */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)]">Active Queue</h2>
            <div className="h-px flex-1 bg-[var(--border)] opacity-50" />
          </div>

          {campaigns.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-[var(--bg-soft)] border border-dashed border-[var(--border)] rounded-[3rem] text-[var(--text-muted)]">
              <Inbox size={32} strokeWidth={1} className="mb-4 opacity-20" />
              <p className="font-serif italic text-xl">Queue is currently idle.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map(c => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  key={c.id} 
                  className="p-8 bg-[var(--card-bg)] border border-[var(--border)] rounded-[2.5rem] flex justify-between items-center hover:shadow-xl hover:border-[var(--brand-primary)]/30 transition-all group"
                >
                  <div className="flex items-center gap-8">
                    <div className="w-14 h-14 flex items-center justify-center bg-[var(--bg-soft)] rounded-2xl border border-[var(--border)] text-[var(--brand-primary)] group-hover:scale-110 transition-transform">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif italic text-[var(--text-main)] leading-none mb-2">{c.title}</h3>
                      <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        <Zap size={10} />
                        <span>Scheduled: {new Date(c.scheduled_for).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-2 bg-[var(--bg-soft)] border border-[var(--border)] rounded-full text-[9px] font-black uppercase tracking-widest text-[var(--brand-primary)]">
                    {c.status}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* NETWORK STATS */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[var(--text-main)] rounded-[3.5rem] p-12 text-[var(--bg)] shadow-2xl relative overflow-hidden">
            <Zap className="absolute -right-10 -bottom-10 w-48 h-48 opacity-5 text-[var(--brand-primary)]" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-10">Network Nodes</h2>
            
            <div className="space-y-8 relative z-10">
              <div className="space-y-1">
                <p className="text-5xl font-serif italic tracking-tighter text-[var(--brand-primary)]">{customers.length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Verified Recipients</p>
              </div>
              <div className="h-px bg-white/5" />
              <div className="space-y-1">
                <p className="text-5xl font-serif italic tracking-tighter text-white">{lists.length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Active Segments</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* COMPOSER MODAL (Neural Control Center) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-2xl z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[var(--bg)] w-full max-w-7xl h-[90vh] rounded-[4rem] shadow-3xl flex overflow-hidden border border-[var(--border)]"
            >
              {/* SIDEBAR CONFIG */}
              <div className="w-96 bg-[var(--bg-soft)] border-r border-[var(--border)] flex flex-col p-12 overflow-y-auto">
                <header className="flex justify-between items-center mb-12">
                  <div className="flex items-center gap-2">
                    <Settings2 size={14} className="text-[var(--brand-primary)]" />
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)]">Parameters</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                    <X size={24}/>
                  </button>
                </header>

                <div className="space-y-12">
                  {/* STYLE NODES */}
                  <section className="space-y-6">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Interface Style</label>
                    <div className="grid grid-cols-2 gap-3">
                      {TEMPLATES.map(t => (
                        <button 
                          key={t.id} 
                          onClick={() => setForm({...form, template_id: t.id})}
                          className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                            form.template_id === t.id 
                            ? 'bg-[var(--card-bg)] border-[var(--brand-primary)] text-[var(--brand-primary)] shadow-lg scale-105' 
                            : 'border-[var(--border)] text-[var(--text-muted)] opacity-50'
                          }`}
                        >
                          {t.icon}
                          <span className="text-[9px] font-black uppercase tracking-widest">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* TARGETING SYSTEM */}
                  <section className="space-y-6">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Target Vector</label>
                    <div className="bg-[var(--bg)] p-1.5 rounded-2xl border border-[var(--border)] flex">
                      <button onClick={() => setAudienceType('individual')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${audienceType === 'individual' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-md' : 'text-[var(--text-muted)]'}`}>Individual</button>
                      <button onClick={() => setAudienceType('list')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${audienceType === 'list' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-md' : 'text-[var(--text-muted)]'}`}>Segment</button>
                    </div>
                    
                    <select 
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl px-6 py-5 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 ring-[var(--brand-primary)]/10 transition-all cursor-pointer"
                      value={audienceType === 'individual' ? form.customer_id : form.list_id}
                      onChange={e => setForm(audienceType === 'individual' ? {...form, customer_id: e.target.value} : {...form, list_id: e.target.value})}
                    >
                      <option value="">Select Recipient...</option>
                      {audienceType === 'individual' 
                        ? customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                        : lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                      }
                    </select>
                  </section>
                </div>

                <div className="mt-auto pt-12 border-t border-[var(--border)] opacity-20">
                  <p className="text-[8px] font-mono text-center">ENCRYPTION_PROTOCOL_ACTIVE</p>
                </div>
              </div>

              {/* EDITOR VIEW */}
              <div className="flex-1 bg-[var(--bg)] overflow-y-auto p-16 flex flex-col">
                 <div className="max-w-2xl w-full mx-auto space-y-12">
                    <div className="space-y-4">
                      <input 
                        placeholder="Internal Campaign Name"
                        className="text-4xl md:text-5xl font-serif italic bg-transparent outline-none border-b border-[var(--border)] pb-4 w-full focus:border-[var(--brand-primary)] transition-colors placeholder:opacity-20"
                        value={form.title}
                        onChange={e => setForm({...form, title: e.target.value})}
                      />
                      <input 
                        placeholder="Email Subject Line"
                        className="text-sm font-medium bg-[var(--bg-soft)] rounded-xl px-6 py-4 w-full border border-[var(--border)] outline-none"
                        value={form.subject}
                        onChange={e => setForm({...form, subject: e.target.value})}
                      />
                    </div>

                    <textarea 
                      placeholder="Compose your transmission..."
                      rows={12}
                      className="w-full bg-transparent text-lg font-serif italic leading-relaxed outline-none border-l-2 border-[var(--border)] pl-8 focus:border-[var(--brand-primary)] transition-all resize-none"
                      value={form.content}
                      onChange={e => setForm({...form, content: e.target.value})}
                    />

                    <div className="flex flex-col md:flex-row items-center justify-between border-t border-[var(--border)] pt-12 gap-8">
                       <input 
                        type="datetime-local"
                        className="bg-[var(--bg-soft)] border border-[var(--border)] px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none"
                        value={form.scheduled_for}
                        onChange={e => setForm({...form, scheduled_for: e.target.value})}
                       />

                       <div className="flex items-center gap-8">
                          <button onClick={() => setShowModal(false)} className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Abort</button>
                          <button 
                            disabled={loading}
                            onClick={handleSchedule} 
                            className="bg-[var(--brand-primary)] text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                          >
                            <SendHorizonal size={16} />
                            {loading ? "Transmitting..." : "Schedule Dispatch"}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function createClient() {
  return supabase;
}
