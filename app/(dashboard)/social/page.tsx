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

  if (loading) return <div className="p-8">Checking organisation access…</div>;
  if (error) return <div role="alert" className="p-8 text-red-700">{error}</div>;
  if (!context) return <div className="p-8">No authorised organisation found.</div>;

  if (context.kind === "delegated") {
    if (context.permissions?.social?.view !== true) {
      return <div role="alert" className="p-8">Social Studio access has not been granted for {context.name}.</div>;
    }
    return <OriginalSocialStudio key={context.id} selectedOrganisationId={context.id} />;
  }

  return <OriginalSocialStudio key={context.id} />;
}
