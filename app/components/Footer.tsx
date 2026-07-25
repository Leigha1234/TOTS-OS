"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Footer() {
  const [referralCode, setReferralCode] = useState("");
  const [footerLinks, setFooterLinks] = useState<
    Array<{ title: string; href: string }>
  >([]);


  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 500);

    return () => clearTimeout(timer);
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

        setFooterLinks(custom);
      } catch (err) {
        console.warn("Failed to load footer links:", err);
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

  return (
    <>
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