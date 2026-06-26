"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

const legalDocs = [
  { name: "AI Policy", href: "/docs/aipolicy" },
  { name: "Beta Terms", href: "/docs/betaterms" },
  { name: "Cancellation Policy", href: "/docs/cancellationpolicy" },
  { name: "Cookies Policy", href: "/docs/cookies" },
  { name: "Data Terms", href: "/docs/dataterms" },
  { name: "Privacy Policy", href: "/docs/privacypolicy" },
  { name: "Property Notice", href: "/docs/propertynotice" },
  { name: "Security Policy", href: "/docs/securitypolicy" },
  { name: "Service Policy", href: "/docs/servicepolicy" },
  { name: "Terms & Conditions", href: "/docs/termsconditions" },
];

type CrmContact = {
  id: string;
  name: string;
  email: string | null;
};

type UserLegalDoc = {
  id: string;
  title: string;
  content: string;
};

const CUSTOM_DOCS_STORAGE_KEY = "tots-custom-legal-docs";

export default function LegalHub() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [busyDoc, setBusyDoc] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [settingsSocialLinks, setSettingsSocialLinks] = useState<Record<string, any>>({});
  const [customDocs, setCustomDocs] = useState<UserLegalDoc[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");

  useEffect(() => {
    const loadContacts = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organisation_id) return;
      setOrgId(profile.organisation_id);

      const { data: settingsData } = await supabase
        .from("settings")
        .select("social_links")
        .eq("organisation_id", profile.organisation_id)
        .maybeSingle();

      if (settingsData?.social_links && typeof settingsData.social_links === "object") {
        setSettingsSocialLinks(settingsData.social_links as Record<string, any>);
        const persistedDocs = (settingsData.social_links as any).legal_docs;
        if (Array.isArray(persistedDocs)) {
          setCustomDocs(
            persistedDocs
              .filter((d: any) => d && d.id && d.title)
              .map((d: any) => ({
                id: String(d.id),
                title: String(d.title),
                content: String(d.content || ""),
              }))
          );
        }
      }

      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email")
        .eq("organisation_id", profile.organisation_id)
        .order("name", { ascending: true });

      if (error) {
        console.error("Failed loading CRM contacts:", error);
        return;
      }

      setContacts((data || []).filter((c: CrmContact) => !!c.email));
    };

    loadContacts();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_DOCS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCustomDocs(
          parsed
            .filter((d: any) => d && d.id && d.title)
            .map((d: any) => ({
              id: String(d.id),
              title: String(d.title),
              content: String(d.content || ""),
            }))
        );
      }
    } catch (e) {
      console.warn("Failed to load custom legal docs:", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_DOCS_STORAGE_KEY, JSON.stringify(customDocs));
    } catch (e) {
      console.warn("Failed to persist custom legal docs:", e);
    }
  }, [customDocs]);

  const selectedContact = useMemo(
    () => contacts.find((c) => c.email === selectedEmail),
    [contacts, selectedEmail]
  );

  const footerDocs = useMemo(
    () => [
      ...legalDocs.map((d) => ({
        id: d.href,
        title: d.name,
        href: d.href,
        content: "",
        source: "default" as const,
      })),
      ...customDocs.map((d) => ({
        id: d.id,
        title: d.title,
        href: "",
        content: d.content,
        source: "custom" as const,
      })),
    ],
    [customDocs]
  );

  const buildPdfFromDoc = async (doc: { name: string; href: string }) => {
    setBusyDoc(doc.href);

    try {
      const res = await fetch(doc.href, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Could not load document page");
      }

      const html = await res.text();
      const parser = new DOMParser();
      const parsed = parser.parseFromString(html, "text/html");

      const title = parsed.querySelector("h1")?.textContent?.trim() || doc.name;
      const bodyText = (parsed.body?.innerText || "")
        .replace(/\s+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const content = bodyText || `Read online: ${window.location.origin}${doc.href}`;

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxWidth = pageWidth - margin * 2;

      pdf.setFontSize(16);
      pdf.text(title, margin, margin);

      pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(content, maxWidth);

      let y = margin + 28;
      for (const line of lines) {
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += 16;
      }

      const filename = `${doc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      pdf.save(filename);
      toast.success("PDF downloaded");
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      toast.error(error?.message || "Failed to generate PDF");
    } finally {
      setBusyDoc(null);
    }
  };

  const buildPdfFromCustomDoc = async (doc: UserLegalDoc) => {
    setBusyDoc(doc.id);

    try {
      const title = doc.title || "Untitled Document";
      const content = (doc.content || "").trim() || "No content provided.";

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxWidth = pageWidth - margin * 2;

      pdf.setFontSize(16);
      pdf.text(title, margin, margin);

      pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(content, maxWidth);

      let y = margin + 28;
      for (const line of lines) {
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += 16;
      }

      const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      pdf.save(filename);
      toast.success("PDF downloaded");
    } catch (error: any) {
      console.error("Custom PDF generation failed:", error);
      toast.error(error?.message || "Failed to generate PDF");
    } finally {
      setBusyDoc(null);
    }
  };

  const shareDocByEmail = async (doc: { name: string; href: string }) => {
    if (!selectedEmail) {
      toast.error("Choose a CRM contact first");
      return;
    }

    setBusyDoc(doc.href);

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedEmail,
          subject: `${doc.name} from TOTS OS`,
          body: `Hello ${selectedContact?.name || "there"},<br /><br />You can read this document here: ${window.location.origin}${doc.href}<br /><br />A printable PDF can be downloaded from the same page in Settings > Legal & Support.`,
        }),
      });

      const payload = await res.json();
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.error || "Failed to send email");
      }

      toast.success(`Sent to ${selectedEmail}`);
    } catch (error: any) {
      console.error("Document share failed:", error);
      toast.error(error?.message || "Failed to share document");
    } finally {
      setBusyDoc(null);
    }
  };

  const shareCustomDocByEmail = async (doc: UserLegalDoc) => {
    if (!selectedEmail) {
      toast.error("Choose a CRM contact first");
      return;
    }

    setBusyDoc(doc.id);

    try {
      const content = (doc.content || "").trim() || "No content provided.";

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedEmail,
          subject: `${doc.title} from TOTS OS`,
          body: `Hello ${selectedContact?.name || "there"},<br /><br />Please find the document below:<br /><br /><strong>${doc.title}</strong><br /><br />${content.replace(/\n/g, "<br />")}`,
        }),
      });

      const payload = await res.json();
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.error || "Failed to send email");
      }

      toast.success(`Sent to ${selectedEmail}`);
    } catch (error: any) {
      console.error("Custom document share failed:", error);
      toast.error(error?.message || "Failed to share document");
    } finally {
      setBusyDoc(null);
    }
  };

  const addCustomDoc = () => {
    const title = draftTitle.trim();
    const content = draftContent.trim();

    if (!title) {
      toast.error("Document title is required");
      return;
    }

    const nextDocs = [
      {
        id: crypto.randomUUID(),
        title,
        content,
      },
      ...customDocs,
    ];

    setCustomDocs(nextDocs);

    if (orgId) {
      const nextSocialLinks = {
        ...settingsSocialLinks,
        legal_docs: nextDocs,
      };
      setSettingsSocialLinks(nextSocialLinks);
      void supabase.from("settings").upsert({
        organisation_id: orgId,
        social_links: nextSocialLinks,
      });
    }

    setDraftTitle("");
    setDraftContent("");
    toast.success("Custom document saved");
  };

  const deleteCustomDoc = (docId: string) => {
    const nextDocs = customDocs.filter((d) => d.id !== docId);
    setCustomDocs(nextDocs);

    if (orgId) {
      const nextSocialLinks = {
        ...settingsSocialLinks,
        legal_docs: nextDocs,
      };
      setSettingsSocialLinks(nextSocialLinks);
      void supabase.from("settings").upsert({
        organisation_id: orgId,
        social_links: nextSocialLinks,
      });
    }
  };

  return (
    <section className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">Legal & Support</h2>
        <p className="text-sm text-gray-500">
          Manage your legal information, create custom docs, export PDF copies, and share documents with CRM contacts.
        </p>
      </div>

      <div className="p-3 border rounded-lg bg-white/70 space-y-2">
        <label className="block text-xs font-semibold text-gray-600">Create Custom Document</label>
        <input
          className="w-full p-2 border rounded-md text-sm"
          placeholder="Document title"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
        />
        <textarea
          className="w-full p-2 border rounded-md text-sm min-h-[110px]"
          placeholder="Write your legal/support content..."
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
        />
        <button
          type="button"
          onClick={addCustomDoc}
          className="text-xs px-3 py-2 rounded-md bg-stone-900 text-white"
        >
          Save Document
        </button>
      </div>

      <div className="p-3 border rounded-lg bg-white/70">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          Share to CRM contact
        </label>
        <select
          className="w-full p-2 border rounded-md text-sm"
          value={selectedEmail}
          onChange={(e) => setSelectedEmail(e.target.value)}
        >
          <option value="">Select contact</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.email || ""}>
              {contact.name} ({contact.email})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {legalDocs.map((doc) => (
          <div
            key={doc.href}
            className="flex items-center gap-2 justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Link href={doc.href} className="text-sm font-medium text-gray-700 hover:underline">
              {doc.name}
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => buildPdfFromDoc(doc)}
                disabled={busyDoc === doc.href}
                className="text-xs px-2 py-1 border rounded-md bg-white disabled:opacity-50"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => shareDocByEmail(doc)}
                disabled={busyDoc === doc.href}
                className="text-xs px-2 py-1 rounded-md bg-stone-900 text-white disabled:opacity-50"
              >
                Email
              </button>
            </div>
          </div>
        ))}

        {customDocs.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-2 justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-gray-700">{doc.title}</p>
              <p className="text-[11px] text-gray-500">Custom document</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => buildPdfFromCustomDoc(doc)}
                disabled={busyDoc === doc.id}
                className="text-xs px-2 py-1 border rounded-md bg-white disabled:opacity-50"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => shareCustomDocByEmail(doc)}
                disabled={busyDoc === doc.id}
                className="text-xs px-2 py-1 rounded-md bg-stone-900 text-white disabled:opacity-50"
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => deleteCustomDoc(doc.id)}
                className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-stone-200">
        <p className="text-xs font-semibold text-gray-600 mb-2">Footer Links Preview (User Editable)</p>
        <div className="flex flex-wrap gap-2">
          {footerDocs.map((doc) => (
            doc.source === "default" ? (
              <Link
                key={doc.id}
                href={doc.href}
                className="text-[11px] px-2 py-1 rounded-md border bg-white hover:bg-stone-50"
              >
                {doc.title}
              </Link>
            ) : (
              <span
                key={doc.id}
                className="text-[11px] px-2 py-1 rounded-md border bg-white"
                title={doc.content || "No content"}
              >
                {doc.title}
              </span>
            )
          ))}
        </div>
      </div>
    </section>
  );
}