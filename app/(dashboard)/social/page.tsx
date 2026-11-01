"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import OriginalSocialStudio from "./OriginalSocialStudio";

const STORAGE_KEY = "tots_agency_preview_organisation_id";

type OrganisationContext = {
  id: string;
  name: string;
  kind: "direct" | "delegated";
  permissions: Record<string, Record<string, boolean>> | null;
};

type ContextsResponse = {
  contexts?: OrganisationContext[];
  error?: string;
};

export default function SocialPage() {
  const [context, setContext] = useState<OrganisationContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    // Do not unmount the editor during background permission refreshes.
    // Native file pickers trigger browser focus when they close.
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("Please log in");

      const response = await fetch("/api/agency/contexts", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const body = (await response.json()) as ContextsResponse;
      if (!response.ok) throw new Error(body.error || "Unable to verify organisation access");

      const contexts = Array.isArray(body.contexts) ? body.contexts : [];
      const selectedId = localStorage.getItem(STORAGE_KEY);
      const selected = contexts.find((item) => item.id === selectedId)
        ?? contexts.find((item) => item.kind === "direct")
        ?? null;

      // A revoked or inaccessible organisation must never remain active.
      if (selectedId && selected?.id !== selectedId) {
        localStorage.removeItem(STORAGE_KEY);
      }
      setContext(selected);
      setError("");
    } catch (caught) {
      setContext(null);
      setError(caught instanceof Error ? caught.message : "Unable to verify access");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener("tots:organisation-changed", onChange);
    return () => {
      window.removeEventListener("tots:organisation-changed", onChange);
    };
  }, [refresh]);

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center bg-[#FAF9F6] p-8"><div className="rounded-3xl border border-[#E5EAE5] bg-white px-10 py-8 text-center shadow-sm"><div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-[#D7E6DF] border-t-[#0F3D32]" /><p className="font-serif text-xl text-[#0F3D32]">Preparing your Social Studio</p><p className="mt-2 text-sm text-[#63756D]">Checking organisation access…</p></div></div>;
  if (error) return <div role="alert" className="m-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">{error}</div>;
  if (!context) return <div className="m-8 rounded-2xl border border-[#E5EAE5] bg-white p-8 text-[#0F3D32]">No authorised organisation found.</div>;

  if (context.kind === "delegated") {
    if (context.permissions?.social?.view !== true) {
      return <div role="alert" className="m-8 rounded-2xl border border-[#E5EAE5] bg-white p-8 text-[#0F3D32]">Social Studio access has not been granted for {context.name}.</div>;
    }
    return <OriginalSocialStudio key={context.id} selectedOrganisationId={context.id} />;
  }

  return <OriginalSocialStudio key={context.id} />;
}
