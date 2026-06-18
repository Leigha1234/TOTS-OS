"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  Wand2, Loader2, Check, Sparkles, Calendar as CalendarIcon, 
  AlignLeft, Bold, Eye, Palette, Menu, Users, Hash, Radio, Zap,
  Mail, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Campaign = {
  id: string;
  title: string;
  subject: string | null;
  content: string | null;
  list_id: string | null;
  scheduled_for: string | null;
  status?: string;
  sent_at?: string | null;
  sent_count?: number | null;
  open_count?: number | null;
  subscriber_lists?: {
    name: string | null;
  } | null;
};


function createCampaignService(supabase: any, organisationId: string | null) {
  return {
    async listCampaigns() {
      if (!organisationId) return [];

      const { data, error } = await supabase
        .from("campaigns")
        .select("*, subscriber_lists(name)")
        .eq("organisation_id", organisationId)
        .order("scheduled_for", { ascending: true });

      if (error) {
        console.error("listCampaigns error:", error);
        return [];
      }

      return data || [];
    },

    async createCampaign(payload: any) {
      const { data, error } = await supabase
        .from("campaigns")
        .insert(payload)
        .select();

      if (error) {
        console.error("createCampaign error:", error);
        throw error;
      }

      return data?.[0] || null;
    },

    async updateCampaign(id: string, payload: any) {
      const { data, error } = await supabase
        .from("campaigns")
        .update(payload)
        .eq("id", id)
        .select();

      if (error) {
        console.error("updateCampaign error:", error);
        throw error;
      }

      return data?.[0] || null;
    },

    async deleteCampaign(id: string) {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("deleteCampaign error:", error);
        throw error;
      }
    },

    async deleteList(id: string) {
      // 1. Detach campaigns from this list to prevent FK constraint errors
      const { error: campaignError } = await supabase
        .from("campaigns")
        .update({ list_id: null })
        .eq("list_id", id);

      if (campaignError) {
        console.error("deleteList campaign detach error:", campaignError);
        throw campaignError;
      }

      // 2. Delete subscriber list links
      const { error: linkError } = await supabase
        .from("profile_subscriber_lists")
        .delete()
        .eq("list_id", id);

      if (linkError) {
        console.error("deleteList subscriber link error:", linkError);
        throw linkError;
      }

      // 3. Delete the list itself
      const { data, error } = await supabase
        .from("subscriber_lists")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        console.error("deleteList error:", error);
        throw error;
      }

      console.log("Deleted list:", data);
    },

    async removeSubscriber(listId: string, profileId: string) {
      const { error } = await supabase
        .from("profile_subscriber_lists")
        .delete()
        .eq("list_id", listId)
        .eq("profile_id", profileId);

      if (error) {
        console.error("removeSubscriber error:", error);
        throw error;
      }
    },

    async listSubscriberLists() {
      if (!organisationId) return [];

      const { data, error } = await supabase
        .from("subscriber_lists")
        .select("*")
        .eq("organisation_id", organisationId);

      if (error) {
        console.error("listSubscriberLists error:", error);
        return [];
      }

      return data || [];
    },

    async listProfiles() {
      if (!organisationId) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,full_name,email,is_subscribed")
        .eq("organisation_id", organisationId)
        .eq("is_subscribed", true);

      if (error) {
        console.error("listProfiles error:", error);
        return [];
      }

      return data || [];
    },

    async addSubscribers(listId: string, profileIds: string[]) {
      if (!organisationId) return;

      const rows = profileIds.map(profile_id => ({
        profile_id,
        list_id: listId,
        organisation_id: organisationId
      }));

      const { error } = await supabase
        .from("profile_subscriber_lists")
        .upsert(rows, { onConflict: "profile_id,list_id" });

      if (error) {
        console.error("addSubscribers error:", error);
        throw error;
      }
    },

    async subscriberCounts() {
      if (!organisationId) return {};

      const { data, error } = await supabase
        .from("profile_subscriber_lists")
        .select("list_id")
        .eq("organisation_id", organisationId);

      if (error || !data) return {};

      const counts: Record<string, number> = {};
      data.forEach((row: any) => {
        counts[row.list_id] = (counts[row.list_id] || 0) + 1;
      });

      return counts;
    }
  };
}

function useCampaigns(supabase: any) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState("Your Company");
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [subscriberCounts, setSubscriberCounts] = useState<Record<string, number>>({});
  const [profiles, setProfiles] = useState<any[]>([]);

  const requestRef = useRef(0);
  const cacheRef = useRef<{ data: Campaign[] | null; ts: number }>({
    data: null,
    ts: 0
  });

  const abortRef = useRef<AbortController | null>(null);
  const optimisticStatusRef = useRef<Record<string, string>>({});

  const service = useMemo(
    () => createCampaignService(supabase, organisationId),
    [supabase, organisationId]
  );

  const refreshCampaigns = async () => {
    const now = Date.now();

    // 30s cache (prevents over-fetching under load)
    if (cacheRef.current.data && now - cacheRef.current.ts < 30000) {
      setCampaigns(cacheRef.current.data);
      return;
    }

    // abort previous request if still running
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const data = await service.listCampaigns();

    if (controller.signal.aborted) return;

    cacheRef.current = {
      data,
      ts: now
    };

    setCampaigns(prev => {
      const incoming = data || [];

      return incoming.map((c: any) => {
        const optimisticStatus = optimisticStatusRef.current[c.id];

        if (optimisticStatus) {
          return {
            ...c,
            status: optimisticStatus
          };
        }

        return c;
      });
    });
  };

  // Get org context
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: team, error: teamError } = await supabase
        .from("team")
        .select("organisation_id, company_name, name")
        .limit(1)
        .maybeSingle();

      console.log("Team record:", team);
      console.log("Team error:", teamError);

      if (team?.organisation_id) {
        setCompanyName(team.company_name || team.name || "Your Company");
        setOrganisationId(team.organisation_id);
      }
    };

    init();
  }, [supabase]);

  // Load data once org is ready
  useEffect(() => {
    if (!organisationId) return;

    const load = async () => {
      console.log("Loading campaigns for organisation:", organisationId);

      const [camps, listsData, profilesData, counts] = await Promise.all([
        service.listCampaigns(),
        service.listSubscriberLists(),
        service.listProfiles(),
        service.subscriberCounts()
      ]);

      setCampaigns(camps);
      setLists(listsData);
      setProfiles(profilesData);
      setSubscriberCounts(counts);
    };

    load();
  }, [organisationId, supabase]);

  const createList = async (name: string) => {
    const trimmed = name?.trim();

    if (!organisationId) {
      console.error("Missing organisationId");
      alert("Organisation not loaded yet");
      return;
    }

    if (!trimmed) {
      alert("List name cannot be empty");
      return;
    }

    const { data, error } = await supabase
      .from("subscriber_lists")
      .insert({
        name: trimmed,
        organisation_id: organisationId
      })
      .select()
      .single();

    if (error) {
      console.error("createList error:", error);
      alert(error.message || "Failed to create list");
      return;
    }

    // update UI immediately without refetch
    setLists(prev => [...prev, data]);
  };

  const scheduleCampaign = async (form: any) => {
    if (!organisationId) return;

    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      ...form,
      list_id: form.list_id || null,
      user_id: user?.id,
      organisation_id: organisationId
    };

    const created = await service.createCampaign(payload);

    if (created) {
      setCampaigns(prev => [created, ...prev]);
      optimisticStatusRef.current[created.id] = created.status || 'queued';
    }

    cacheRef.current.ts = 0;
    await refreshCampaigns();
  };

  // Load list subscribers
  const loadListSubscribers = async (listId: string) => {
    if (!listId || !organisationId) return;

    const { data, error } = await supabase
      .from("profile_subscriber_lists")
      .select("profile_id, profiles(*)")
      .eq("list_id", listId);

    if (error) {
      console.error("Load subscribers error:", error);
      return [];
    }

    return data || [];
  };

  const updateCampaign = async (form: any, id: string) => {
    const updated = await service.updateCampaign(id, {
      ...form,
      list_id: form.list_id || null
    });

    if (updated) {
      setCampaigns(prev =>
        prev.map(c => (c.id === id ? { ...c, ...updated } : c))
      );
      if (updated?.status) {
        optimisticStatusRef.current[id] = updated.status;
      }
    }

    cacheRef.current.ts = 0;
    await refreshCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    await service.deleteCampaign(id);
    delete optimisticStatusRef.current[id];
    setCampaigns(prev => prev.filter(c => c.id !== id));

    cacheRef.current.ts = 0;
  };

  const deleteList = async (id: string) => {
    await service.deleteList(id);

    setLists(prev => prev.filter(l => l.id !== id));
  };

  const removeSubscriber = async (listId: string, profileId: string) => {
    await service.removeSubscriber(listId, profileId);

    const counts = await service.subscriberCounts();
    setSubscriberCounts(counts);
  };

  // Send campaign now
  const sendCampaignNow = async (campaignId: string) => {
    optimisticStatusRef.current[campaignId] = 'sending';
    let res;
    try {
      res = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to send campaign');
        optimisticStatusRef.current[campaignId] = 'failed';
        return res;
      }

      optimisticStatusRef.current[campaignId] = 'sent';
      cacheRef.current.ts = 0;
      await refreshCampaigns();

      return res;
    } catch (err) {
      optimisticStatusRef.current[campaignId] = 'failed';
      throw err;
    }
  };

  // Click tracking helper
  const trackCampaignClick = async (campaignId: string, url: string) => {
    try {
      await fetch('/api/campaigns/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, url })
      });
    } catch (err) {
      console.error('Click tracking failed:', err);
    }
  };

  // Process due scheduled campaigns (cron trigger)
  const processDueCampaigns = async () => {
    try {
      await fetch('/api/campaigns/process-due', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      // refresh campaigns after processing
      cacheRef.current.ts = 0;
      await refreshCampaigns();
    } catch (err) {
      console.error('Error processing due campaigns:', err);
    }
  };

  const addSubscribersToList = async (listId: string, profileIds: string[]) => {
    await service.addSubscribers(listId, profileIds);
    const counts = await service.subscriberCounts();
    setSubscriberCounts(counts);
  };

  // Real-time updates for campaigns and subscriber lists
  useEffect(() => {
    if (!organisationId) return;

    const channel = supabase
      .channel("realtime-campaigns-lists")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profile_subscriber_lists" },
        () => {
          service.subscriberCounts().then(setSubscriberCounts);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaigns" },
        () => {
          refreshCampaigns();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaign_opens" },
        async () => {
          const { data } = await supabase
            .from("campaign_opens")
            .select("campaign_id");

          const counts: Record<string, number> = {};

          (data || []).forEach((row: any) => {
            counts[row.campaign_id] = (counts[row.campaign_id] || 0) + 1;
          });

          setCampaigns(prev =>
            prev.map(c => ({
              ...c,
              open_count: counts[c.id] || 0
            }))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaign_clicks" },
        () => {
          // realtime click tracking updates
          refreshCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organisationId, supabase, service]);

  console.log("Hook lists state:", lists);
  return {
    campaigns,
    lists: Array.isArray(lists) ? lists : [],
    companyName,
    organisationId,
    createList,
    scheduleCampaign,
    loadListSubscribers,
    updateCampaign,
    deleteCampaign,
    deleteList,
    removeSubscriber,
    subscriberCounts,
    profiles,
    sendCampaignNow,
    setCampaigns,
    addSubscribersToList,
    processDueCampaigns,
    trackCampaignClick,
    refreshCampaigns,
  };
}

export default function CampaignsPage() {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const {
    campaigns,
    setCampaigns,
    lists,
    companyName,
    organisationId,
    createList,
    scheduleCampaign,
    loadListSubscribers,
    updateCampaign,
    deleteCampaign,
    deleteList,
    removeSubscriber,
    subscriberCounts,
    profiles,
    sendCampaignNow: sendCampaignNowBase,
    addSubscribersToList,
    processDueCampaigns,
    refreshCampaigns,
  } = useCampaigns(supabase);
  console.log("Component lists prop:", lists);

  // UI STATE
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  const [showListDetailModal, setShowListDetailModal] = useState(false);
  const [selectedList, setSelectedList] = useState<any | null>(null);
  const [listSubscribers, setListSubscribers] = useState<any[]>([]);

  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [showSubscriberManager, setShowSubscriberManager] = useState(false);

  const [step, setStep] = useState<'editor' | 'schedule'>('editor');

  const [newListName, setNewListName] = useState("");

  const [showClarityPrompt, setShowClarityPrompt] = useState(false);
  const [clarityTopic, setClarityTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  const sendCampaignNow = async (campaignId: string) => {
    // 1. Optimistic UI update
    setCampaigns(prev =>
      prev.map(c =>
        c.id === campaignId ? { ...c, status: "sending" } : c
      )
    );

    if (selectedCampaign?.id === campaignId) {
      setSelectedCampaign((prev: any) =>
        prev ? { ...prev, status: "sending" } : prev
      );
    }

    try {
      // 2. Trigger backend send
      const res = await sendCampaignNowBase(campaignId);

      if (!res || !res.ok) {
        throw new Error("Failed to send campaign");
      }

      // 3. Mark as sent with sent_at fallback if missing
      setCampaigns(prev =>
        prev.map(c =>
          c.id === campaignId
            ? {
                ...c,
                status: "sent",
                sent_at: c.sent_at || new Date().toISOString()
              }
            : c
        )
      );

      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign((prev: any) =>
          prev ? {
            ...prev,
            status: "sent",
            sent_at: prev.sent_at || new Date().toISOString()
          } : prev
        );
      }

      // 4. Refresh server truth (including sent/open counts)
      setTimeout(() => {
        refreshCampaigns();
      }, 1500);

    } catch (err) {
      console.error("sendCampaignNow error:", err);

      // Mark failed state
      setCampaigns(prev =>
        prev.map(c =>
          c.id === campaignId ? { ...c, status: "failed" } : c
        )
      );

      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign((prev: any) =>
          prev ? { ...prev, status: "failed" } : prev
        );
      }
      await refreshCampaigns();
    }
  };

  const [form, setForm] = useState({
    title: "",
    subject: "",
    list_id: "",
    scheduled_for: "",
    content: ""
  });
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // AI generation helper
  const executeGeneration = () => {
    if (!clarityTopic) return;
    setIsGenerating(true);

    setTimeout(() => {
      setForm(prev => ({
        ...prev,
        subject: `Update: ${clarityTopic.split(' ').slice(0, 3).join(' ')}`,
        content: `Dear Team,\n\nFollowing up on our campaign goals regarding ${clarityTopic}.`
      }));
      setIsGenerating(false);
      setShowClarityPrompt(false);
    }, 1500);
  };

  const formatScheduledDate = (dateString: string | null) => {
    if (!dateString) return "Immediate Release";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 md:p-12 text-stone-900 font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-end mb-8 md:mb-16 border-b border-stone-200 pb-10 gap-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--brand-primary)] mb-3 opacity-80">Campaign Dashboard</p>
          <h1 className="text-5xl md:text-7xl font-serif italic text-stone-800 tracking-tighter">Campaigns</h1>
        </div>
        <button 
          onClick={() => {
            setEditingCampaignId(null);
            setStep('editor');
            setForm({
              title: "",
              subject: "",
              list_id: "",
              scheduled_for: "",
              content: ""
            });
            setShowModal(true);
          }}
          className="bg-stone-900 text-[var(--brand-primary)] w-full md:w-auto px-8 py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl hover:brightness-110 transition-all"
        >
          <Plus size={18} /> Create Campaign
        </button>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* PIPELINE FEED WITH ENHANCED DETAILS */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Campaign Status Pipeline</p>
          {campaigns.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-[3.5rem] p-24 text-center shadow-sm">
              <p className="font-serif italic text-stone-200 text-2xl">No campaigns scheduled at this time.</p>
            </div>
          ) : (
            campaigns.map(c => (
              <div 
                key={c.id} 
                onClick={() => { setSelectedCampaign(c); setShowViewModal(true); }}
                className="bg-white p-8 rounded-[3rem] border border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-6 group shadow-sm hover:shadow-md hover:border-stone-200 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-6 flex-1 min-w-0">
                  <div className="p-5 bg-stone-50 rounded-2xl text-[var(--brand-primary)] shrink-0">
                    <Radio size={20} className="animate-pulse" />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-xl text-stone-800 uppercase tracking-tight truncate">{c.title}</h3>
                      <span className="text-[9px] px-3 py-1 bg-stone-100 rounded-full font-black text-stone-500 uppercase tracking-wider">
                        {c.subscriber_lists?.name || 'Unassigned List'}
                      </span>
                    </div>
                    <p className="text-xs font-serif italic text-stone-500 truncate block">
                      Subject: {c.subject || "No Subject Specified"}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-wider text-stone-400 pt-1">
                      <span className="flex items-center gap-1"><Clock size={12} /> {formatScheduledDate(c.scheduled_for)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {/* Status badge and open rate removed */}
                </div>
              </div>
            ))
          )}
        </div>

        {/* SEGMENTS ASIDE */}
        <aside className="lg:col-span-4 order-1 lg:order-2">
          <div className="bg-stone-50 border border-stone-200 rounded-[3.5rem] p-12 shadow-sm">
            <div className="flex justify-between items-center mb-10">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--brand-primary)]">Campaign Lists</p>
                <button onClick={() => setShowListModal(true)} className="p-2 bg-white rounded-full border border-stone-200 hover:bg-stone-100 transition-colors"><Plus size={14}/></button>
            </div>
            <div className="space-y-6">
              {lists.map(l => (
                <div 
                  key={l.id} 
                  onClick={async () => {
                    setSelectedList(l);
                    setShowListDetailModal(true);

                    const res = await loadListSubscribers(l.id);
                    setListSubscribers(res);
                  }}
                  className="flex justify-between items-center border-b border-stone-200 pb-4 text-[10px] font-black tracking-widest uppercase text-stone-600 cursor-pointer hover:text-stone-900"
                >
                  {l.name} ({subscriberCounts?.[l.id] || 0})
                  <Hash size={10} className="text-stone-300" />
                </div>
              ))}
              {lists.length === 0 && <p className="text-[10px] font-serif italic text-stone-400">No subscriber lists created yet.</p>}
            </div>
          </div>
        </aside>
      </div>

      {/* DETAILED CAMPAIGN VIEW MODAL */}
      <AnimatePresence>
        {showViewModal && selectedCampaign && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-10 bg-stone-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#faf9f6] w-full max-w-3xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[90vh]"
            >
              {/* TOP PROFILE HEADER */}
              <div className="p-8 md:p-12 border-b border-stone-200 bg-stone-50 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest px-4 py-1 bg-stone-900 text-[var(--brand-primary)] rounded-full">
                      Campaign Profile
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest px-4 py-1 bg-white border border-stone-200 text-stone-500 rounded-full">
                      {selectedCampaign.subscriber_lists?.name || 'Unassigned Target'}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-stone-800 uppercase tracking-tight">{selectedCampaign.title}</h2>
                </div>
                <button 
                  onClick={() => { setShowViewModal(false); setSelectedCampaign(null); }} 
                  className="p-3 bg-white hover:bg-stone-100 border border-stone-200 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* DETAILS METADATA BODY */}
              <div className="p-8 md:p-12 overflow-y-auto no-scrollbar space-y-8 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-stone-100 pb-6 text-xs">
                  <div>
                    <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider mb-1">Scheduled Time</p>
                    <p className="font-bold text-stone-800 flex items-center gap-2"><Clock size={14} className="text-stone-400" /> {formatScheduledDate(selectedCampaign.scheduled_for)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider mb-1">Company Name</p>
                    <p className="font-bold text-stone-800 flex items-center gap-2"><Users size={14} className="text-stone-400" /> {companyName}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider mb-2">Subject Line</p>
                  <div className="p-5 bg-white rounded-2xl border border-stone-100 text-lg font-serif italic text-stone-900 shadow-inner">
                    {selectedCampaign.subject || "No Subject Specified"}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider mb-2">Email Content Output</p>
                  <div className="p-8 md:p-10 bg-white rounded-[2.5rem] border border-stone-200 shadow-sm font-serif text-stone-800 leading-relaxed text-base whitespace-pre-wrap min-h-[200px]">
                    {selectedCampaign.content || "Empty content payload."}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <p className="text-[9px] uppercase font-black text-stone-400">Sent</p>
                    <p className="text-xl font-bold">{selectedCampaign.sent_count || 0}</p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <p className="text-[9px] uppercase font-black text-stone-400">Opens</p>
                    <p className="text-xl font-bold">
                      {selectedCampaign?.open_count || 0}
                    </p>
                  </div>
                  {/* Open Rate metric card removed */}
                </div>
              </div>

              {/* VIEW FOOTER */}
              {(() => {
                // Ensure currentCampaign and status are up to date for modal
                const currentCampaign = campaigns.find(c => c.id === selectedCampaign?.id) || selectedCampaign;
                const isSending = currentCampaign?.status === 'sending';
                const isSent = currentCampaign?.status === 'sent';
                return (
                  <div className="p-6 bg-stone-50 border-t border-stone-200 text-center flex justify-between">
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        setSelectedCampaign(null);

                        setEditingCampaignId(selectedCampaign.id);
                        setForm({
                          title: selectedCampaign.title || "",
                          subject: selectedCampaign.subject || "",
                          list_id: selectedCampaign.list_id ? String(selectedCampaign.list_id) : "",
                          scheduled_for: selectedCampaign.scheduled_for || "",
                          content: selectedCampaign.content || ""
                        });

                        setShowModal(true);
                      }}
                      className="px-8 py-4 bg-white border border-stone-200 text-stone-700 rounded-xl font-black text-[10px] uppercase"
                    >
                      Edit Campaign
                    </button>

                    <button
                      onClick={() => setShowEmailPreview(true)}
                      className="px-8 py-4 bg-stone-100 border border-stone-200 text-stone-700 rounded-xl font-black text-[10px] uppercase"
                    >
                      Preview Email
                    </button>

                    <button
                      onClick={() => sendCampaignNow(selectedCampaign.id)}
                      disabled={isSending || isSent}
                      className={`px-8 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${
                        isSent
                          ? 'bg-green-700 text-white opacity-80 cursor-not-allowed'
                          : isSending
                          ? 'bg-yellow-500 text-white cursor-wait'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isSent ? 'Sent' : isSending ? 'Sending...' : 'Send Now'}
                    </button>

                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${selectedCampaign.title}"? This cannot be undone.`)) return;

                        await deleteCampaign(selectedCampaign.id);

                        setShowViewModal(false);
                        setSelectedCampaign(null);
                      }}
                      className="px-8 py-4 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase"
                    >
                      Delete Campaign
                    </button>

                    
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE LIST MODAL */}
      <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl border border-stone-200 relative">
                {/* Close Button Top Right */}
                <button 
                  onClick={() => setShowListModal(false)}
                  className="absolute top-8 right-8 p-2 text-stone-400 hover:text-stone-900 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>

                <h3 className="text-2xl font-serif italic mb-6">Create Campaign List</h3>
                <input 
                    value={newListName} onChange={e => setNewListName(e.target.value)}
                    placeholder="Segment Name (e.g. Investors)" 
                    className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-100 mb-6 outline-none focus:border-stone-900"
                />
                <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        await createList(newListName);
                        setNewListName("");
                        setShowListModal(false);
                      }}
                      className="w-full py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Create List
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN EDITOR */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-10 bg-stone-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#faf9f6] w-full md:max-w-[1400px] h-full md:h-[85vh] md:rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-stone-200 relative"
            >
              {/* Close Button Top Right */}
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 md:top-10 md:right-10 z-[110] p-3 bg-white hover:bg-stone-100 border border-stone-200 rounded-full text-stone-700 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>

              {/* ACTIONS SIDEBAR */}
              <div className="w-full md:w-80 bg-stone-50 border-r border-stone-200 p-12 flex flex-col shrink-0">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-8">Campaign Control</p>
                <div className="mb-4 p-4 bg-white border border-stone-100 rounded-2xl">
                  <p className="text-[8px] font-black uppercase text-stone-400 tracking-wider mb-1">Company Name</p>
                  <p className="text-xs font-bold text-stone-800 uppercase tracking-tight truncate">{companyName}</p>
                </div>
              </div>

              {/* EDITOR */}
              <div className="flex-1 bg-stone-100/30 p-8 md:p-16 overflow-y-auto no-scrollbar">
                {step === 'editor' && (
                  <div className="w-full max-w-3xl mx-auto pb-20">
                    <div className="flex justify-between items-center mb-10 pr-14 md:pr-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Campaign Content Draft</span>
                      <button onClick={() => setShowClarityPrompt(true)} className="px-6 py-3 rounded-full shadow-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-stone-900 text-[var(--brand-primary)]">
                        <Zap size={14} fill="var(--brand-primary)" /> Clarity Content Assistant
                      </button>
                    </div>

                    <AnimatePresence>
                      {showClarityPrompt && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="relative w-full bg-stone-900 text-white p-8 mb-10 rounded-[3rem] border border-[var(--brand-primary)]/20 shadow-sm overflow-hidden">
                          <button 
                            onClick={() => setShowClarityPrompt(false)} 
                            className="absolute top-6 right-6 p-2 text-stone-400 hover:text-white rounded-full transition-colors"
                          >
                            <X size={16} />
                          </button>

                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] mb-4">Campaign Objectives</h4>
                          <input 
                            value={clarityTopic} onChange={e => setClarityTopic(e.target.value)}
                            className="w-full p-5 text-sm font-serif italic bg-white/5 rounded-2xl border border-white/10 mb-4 outline-none text-white placeholder:text-stone-500"
                            placeholder="Specify the campaign intent..."
                          />
                          <div className="flex gap-2">
                            <button onClick={executeGeneration} className="bg-[var(--brand-primary)] text-stone-900 px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                              {isGenerating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} Generate Content
                            </button>
                            <button onClick={() => setShowClarityPrompt(false)} className="px-6 py-3 text-[9px] font-black uppercase text-stone-400">Cancel</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="w-full min-h-[800px] rounded-[4rem] p-12 md:p-24 flex flex-col shadow-2xl transition-all duration-500 border border-stone-200 bg-white text-stone-600">
                      <input 
                        placeholder="Campaign Title..." 
                        className="text-xl font-bold outline-none mb-8 bg-transparent border-b border-stone-900/10 pb-4 placeholder:opacity-30 text-stone-900"
                        value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                      />
                      <textarea 
                        placeholder="Email Subject Line..." 
                        className="text-3xl md:text-5xl font-serif italic outline-none mb-12 bg-transparent placeholder:opacity-20 border-b border-stone-900/10 pb-8 resize-none h-32 leading-tight text-stone-900"
                        value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                      />
                      <textarea 
                        placeholder="Compose your email content body here..."
                        className="flex-1 text-xl font-serif italic leading-relaxed outline-none resize-none bg-transparent placeholder:opacity-20 min-h-[400px] text-stone-700"
                        value={form.content} onChange={e => setForm({...form, content: e.target.value})}
                      />
                      
                      {/* DYNAMIC FOOTER */}
                      <footer className="mt-16 pt-12 border-t border-stone-900/10 text-center">
                         <p className="text-[11px] font-black uppercase tracking-[0.5em] mb-3 text-stone-900">{companyName}</p>
                         <p className="text-[8px] text-stone-400 uppercase tracking-[0.3em] font-medium italic">Powered by TOTS-OS</p>
                      </footer>
                    </div>

                    <div className="flex justify-center mt-12">
                        <button 
                        onClick={() => setStep('schedule')}
                        className="bg-stone-900 px-24 py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] text-[var(--brand-primary)] shadow-2xl hover:scale-105 transition-all"
                        >
                        Proceed to Scheduling
                        </button>
                    </div>
                  </div>
                )}

                {step === 'schedule' && (
                  <div className="w-full max-w-2xl mx-auto bg-white p-16 rounded-[4rem] border border-stone-200 shadow-2xl text-center mt-10 md:mt-0">
                     <Users size={32} className="mx-auto mb-6 text-stone-200" />
                     <h2 className="text-4xl font-serif italic text-stone-800 mb-8">Scheduling </h2>
                     <div className="space-y-8 text-left mb-12">
                       <div>
                         <label className="text-[9px] font-black uppercase text-stone-400 mb-3 block ml-1">Target Campaign List</label>
                         <p className="text-[10px] text-stone-500 mb-2">
                           Available lists: {Array.isArray(lists) ? lists.length : 0}
                           <br />
                           First list: {Array.isArray(lists) && lists[0] ? lists[0].name : "none"}
                         </p>
                         <select
                           value={form.list_id ?? ""}
                           onChange={e => setForm({ ...form, list_id: e.target.value || "" })}
                           className="w-full p-5 bg-stone-50 border border-stone-200 rounded-2xl text-xs outline-none focus:border-stone-900"
                         >
                           <option value="">Select target audience list...</option>
                           {Array.isArray(lists) && lists.map((l) => (
                             <option key={l.id} value={l.id}>
                               {l.name}
                             </option>
                           ))}
                         </select>
                       </div>
                       <div>
                         <label className="text-[9px] font-black uppercase text-stone-400 mb-3 block ml-1">Scheduled Time</label>
                         <input type="datetime-local" value={form.scheduled_for} onChange={e => setForm({...form, scheduled_for: e.target.value})} className="w-full p-5 bg-stone-50 border border-stone-200 rounded-2xl text-xs outline-none focus:border-stone-900" />
                       </div>
                     </div>
                     <div className="flex justify-center gap-4">
                       <button onClick={() => setStep('editor')} className="px-10 py-5 rounded-2xl bg-stone-100 text-stone-500 font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all">Return to Editor</button>
                       <button 
                        onClick={async () => {
                          if (!form.title || !form.subject || !form.list_id) {
                            alert("Please fill in title, subject and target list.");
                            return;
                          }

                          if (editingCampaignId) {
                            await updateCampaign(form, editingCampaignId);
                          } else {
                            await scheduleCampaign(form);
                          }

                          setEditingCampaignId(null);
                          setShowModal(false);
                          setStep('editor');
                        }}
                        className="px-12 py-5 rounded-2xl bg-stone-900 text-[var(--brand-primary)] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:brightness-110"
                       >
                         <CalendarIcon size={16}/>Schedule
                       </button>
                     </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EMAIL PREVIEW MODAL */}
      {showEmailPreview && selectedCampaign && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-900/70 p-6">
          <div className="bg-white max-w-3xl w-full rounded-[3rem] p-10 border border-stone-200 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif italic">Email Preview</h2>
              <button onClick={() => setShowEmailPreview(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="border border-stone-100 rounded-2xl p-8 bg-stone-50">
              <p className="text-xs uppercase font-black text-stone-400 mb-2">Subject</p>
              <p className="font-bold mb-6">{selectedCampaign.subject}</p>

              <p className="text-xs uppercase font-black text-stone-400 mb-2">Body</p>
              <div className="whitespace-pre-wrap font-serif text-stone-700 leading-relaxed">
                {selectedCampaign.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIST DETAIL MODAL */}
      <AnimatePresence>
        {showListDetailModal && selectedList && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-stone-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] p-10 border border-stone-200 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif italic">{selectedList.name}</h2>
                <button onClick={() => setShowListDetailModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <p className="text-[10px] uppercase font-black tracking-widest text-stone-400 mb-6">
                Active Subscribers ({listSubscribers.length})
              </p>
              <button
                onClick={() => setShowSubscriberManager(true)}
                className="mb-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] uppercase font-black"
              >
                Add Subscribers
              </button>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {listSubscribers.length === 0 && (
                  <p className="text-stone-400 text-sm italic">No subscribers found.</p>
                )}

                {listSubscribers.map((s: any) => (
                  <div
                    key={s.profile_id}
                    className="p-4 bg-stone-50 rounded-xl border border-stone-100 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-sm text-stone-800">
                        {s.profiles?.name || "Unnamed User"}
                      </p>
                      <p className="text-xs text-stone-500">
                        {s.profiles?.email || "No email"}
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        await removeSubscriber(selectedList.id, s.profile_id);

                        const updated = await loadListSubscribers(selectedList.id);
                        setListSubscribers(updated);
                      }}
                      className="text-red-600 text-xs font-black uppercase"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-right">
                <button
                  onClick={async () => {
                    if (!confirm(`Delete list "${selectedList.name}"? This cannot be undone.`)) return;

                    try {
                      await deleteList(selectedList.id);
                    } catch (err) {
                      console.error(err);
                      alert(`Failed to delete list. Check browser console for the Supabase error.`);
                      return;
                    }

                    setShowListDetailModal(false);
                    setSelectedList(null);
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase mr-3"
                >
                  Delete List
                </button>
                <button
                  onClick={() => setShowListDetailModal(false)}
                  className="px-6 py-3 bg-stone-900 text-[var(--brand-primary)] rounded-xl text-[10px] font-black uppercase"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUBSCRIBER MANAGER MODAL */}
      {showSubscriberManager && selectedList && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 p-6">
          <div className="bg-white max-w-2xl w-full rounded-[3rem] p-8">
            <div className="flex justify-between mb-6">
              <h3 className="text-xl font-bold">Manage Subscribers</h3>
              <button onClick={() => setShowSubscriberManager(false)}><X size={18} /></button>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {profiles.map((profile: any) => (
                <label key={profile.id} className="flex items-center gap-3 p-3 border rounded-xl">
                  <input
                    type="checkbox"
                    checked={selectedProfiles.includes(profile.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProfiles(prev => [...prev, profile.id]);
                      } else {
                        setSelectedProfiles(prev => prev.filter(id => id !== profile.id));
                      }
                    }}
                  />
                  <div>
                    <p className="font-bold">{profile.full_name || profile.name}</p>
                    <p className="text-xs text-stone-500">{profile.email}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={async () => {
                await addSubscribersToList(selectedList.id, selectedProfiles);
                const res = await loadListSubscribers(selectedList.id);
                setListSubscribers(res);
                setShowSubscriberManager(false);
              }}
              className="mt-6 w-full py-4 bg-stone-900 text-white rounded-2xl font-black"
            >
              Save Subscribers
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL SCROLLBAR REMOVAL */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}