"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Copy, Check, X } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [footerLinks, setFooterLinks] = useState<
    Array<{ title: string; href: string }>
  >([]);

  const defaultFooterLinks = [
    { title: "Privacy Policy", href: "/docs/privacypolicy" },
    { title: "Terms & Conditions", href: "/docs/termsconditions" },
    { title: "Service Policy", href: "/docs/servicepolicy" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tots-custom-legal-docs");
      if (!raw) {
        setFooterLinks(defaultFooterLinks);
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setFooterLinks(defaultFooterLinks);
        return;
      }

      const custom = parsed
        .filter((d: any) => d?.title)
        .slice(0, 6)
        .map((d: any) => ({
          title: String(d.title),
          href: "/settings",
        }));

      setFooterLinks([...defaultFooterLinks, ...custom]);
    } catch {
      setFooterLinks(defaultFooterLinks);
    }
  }, []);

  useEffect(() => {
    const loadOrgFooterLinks = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth.user;
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("organisation_id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.organisation_id) return;

        const { data: settingsData } = await supabase
          .from("settings")
          .select("social_links")
          .eq("organisation_id", profile.organisation_id)
          .maybeSingle();

        const docs = (settingsData?.social_links as any)?.legal_docs;
        if (!Array.isArray(docs) || docs.length === 0) return;

        const custom = docs
          .filter((d: any) => d?.title)
          .slice(0, 6)
          .map((d: any) => ({
            title: String(d.title),
            href: "/settings",
          }));

        setFooterLinks([...defaultFooterLinks, ...custom]);
      } catch {
        // ignore
      }
    };

    void loadOrgFooterLinks();
  }, []);

  async function load() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }
    } catch (err) {
      console.warn("Footer background sync paused.");
    }
  }

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    try {
      // Find newsletter list (PUBLIC signup - no auth required)
      const { data: list, error: listError } = await supabase
        .from("subscriber_lists")
        .select("id, organisation_id")
        .ilike("name", "newsletter")
        .limit(1)
        .maybeSingle();

      if (listError || !list?.id) {
        console.error("Newsletter list not found:", listError?.message);
        return;
      }

      // Insert subscriber
      const { error: insertError } = await supabase.from("subscribers").insert({
        email: normalizedEmail,
        list_id: list.id,
        organisation_id: list.organisation_id ?? null,
        status: "subscribed",
      });

      if (insertError) {
        if (insertError.code === "23505") {
          // already subscribed
          setEmail("");
          setOpen(false);
          return;
        }

        console.error("Newsletter signup failed:", insertError.message);
        return;
      }

      // Trigger welcome email via Edge Function (best-effort)
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: { email: normalizedEmail },
        });
      } catch (err) {
        console.error("Welcome email failed:", err);
      }

      console.log("Subscribed to newsletter:", normalizedEmail);

      setEmail("");
      setOpen(false);
    } catch (err) {
      console.error("Unexpected newsletter signup error:", err);
    }
  }

  function copyCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-6 right-6 w-80 p-5 bg-stone-900 border border-white/10 rounded-2xl shadow-2xl z-50">
          <button onClick={() => setOpen(false)} className="absolute top-3 right-3">
            <X size={16} />
          </button>

          <p className="text-sm font-semibold mb-1 text-white">Join the newsletter</p>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded-xl"
          />

          <button onClick={submit} className="w-full mt-2 bg-white text-black p-2 rounded-xl">
            Subscribe
          </button>
        </div>
      )}

      <footer className="mt-24">
        <div className="flex flex-wrap gap-2">
          {footerLinks.map((item, idx) => (
            <Link key={`${item.title}-${item.href}-${idx}`} href={item.href}>
              {item.title}
            </Link>
          ))}
        </div>
      </footer>
    </>
  );
}