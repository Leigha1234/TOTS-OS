"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, Loader2, Shield, User, CheckCircle2 } from "lucide-react";
import AdminPermissionToggle from "../../../../components/AdminPermissionToggle"; // Ensure this is created
import { toast } from "sonner";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// List of all available modules in TOTS OS
const MODULE_PAGES = ["Dashboard", "Calendar", "Campaigns", "Contacts", "Notes", "Finance", "Projects", "Reports", "Social", "Vault", "Settings"];

export default function MemberSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // 1. Fetch Member Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .single();
      setMember(profile);

      // 2. Fetch Existing Permissions
      const { data: perms } = await supabase
        .from("permissions")
        .select("page_slug, can_access")
        .eq("user_id", params.id);

      // Define an interface for the permission object
interface Permission {
  page_slug: string;
  can_access: boolean;
}

// Update the reduce function
const permMap = perms?.reduce((acc: Record<string, boolean>, p: Permission) => ({ 
  ...acc, 
  [p.page_slug]: p.can_access 
}), {});
      setPermissions(permMap || {});
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#A3B18A]" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#faf9f6] p-12 text-stone-900 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="mb-10 flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors">
        <ArrowLeft size={16} /> Back to Team Hub
      </button>

      <header className="mb-12">
        <div className="flex items-center gap-6 mb-4">
          <div className="w-20 h-20 rounded-[2.5rem] bg-stone-900 text-[#A3B18A] flex items-center justify-center text-3xl font-serif italic">
            {member?.full_name?.charAt(0) || "U"}
          </div>
          <div>
            <h1 className="text-4xl font-serif italic">{member?.full_name}</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A3B18A]">{member?.email}</p>
          </div>
        </div>
      </header>

      <section className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8 border-b border-stone-50 pb-6">
          <Shield className="text-[#A3B18A]" size={20} />
          <h2 className="text-xl font-serif italic">Access Permissions</h2>
        </div>

        <div className="space-y-4">
          {MODULE_PAGES.map((page) => (
            <div key={page} className="flex items-center justify-between p-6 bg-[#faf9f6] rounded-2xl border border-stone-50 hover:border-stone-100 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-[#A3B18A]" />
                <span className="text-[10px] font-black uppercase tracking-widest">{page}</span>
              </div>
              <AdminPermissionToggle 
                memberId={params.id} 
                pageSlug={page} 
                initialAccess={permissions[page] || false} 
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}