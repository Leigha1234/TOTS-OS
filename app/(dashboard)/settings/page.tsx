"use client";

export const dynamic = "force-dynamic";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import LegalHub from "@/app/components/LegalHub";
import PasswordSection from "@/app/components/PasswordSection";

import ConnectedAccountModal from "./components/ConnectedAccountModal";
import ProfileSettings from "./components/ProfileSettings";
import SettingsHeader from "./components/SettingsHeader";
import SocialSettings from "./components/SocialSettings";
import TeamSettings from "./components/TeamSettings";

import { useSettingsProfile } from "./hooks/useSettingsProfile";
import { useSocialConnections } from "./hooks/useSocialConnections";
import { useSocialScheduler } from "./hooks/useSocialScheduler";
import { useTikTokOAuthResult } from "./hooks/useTikTokOAuthResult";

import { supabase } from "../../../lib/supabase";

import type {
  SettingsTab,
  TeamContactOption,
  TeamMemberView,
} from "./types";

type OAuthState = {
  platform?: string;
  userId?: string;
};

type OAuthTokens = {
  access_token?: string;
  refresh_token?: string | null;
  expires_at?: string | null;
};

function getOAuthStorageKey(platform: string) {
  return platform === "meta"
    ? "oauth_pending_meta"
    : `oauth_pending_${platform}`;
}

function SettingsInner() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const [teamMembers, setTeamMembers] = useState<TeamMemberView[]>([]);
  const [allContacts, setAllContacts] = useState<TeamContactOption[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);
  const [addingContactId, setAddingContactId] = useState<string | null>(null);

  const [showConnectedModal, setShowConnectedModal] = useState(false);
  const [connectedPlatformModal, setConnectedPlatformModal] = useState<
    string | null
  >(null);

  const {
    loading,
    isSaving,
    logoUploading,
    currentUserId,
    organisationId,
    displayName,
    setDisplayName,
    email,
    bio,
    setBio,
    logoUrl,
    saveProfile,
    uploadLogo,
    logout,
  } = useSettingsProfile();

  const {
    socialAccounts,
    connectionHealth,
    refreshConnections,
    verifyConnections,
    verifyPendingOAuth,
  } = useSocialConnections();

  const { triggerWorker } = useSocialScheduler();

  const handleTikTokConnected = useCallback(() => {
    setConnectedPlatformModal("tiktok");
    setShowConnectedModal(true);
  }, []);

  useTikTokOAuthResult({
    refreshConnections,
    verifyConnections,
    onConnected: handleTikTokConnected,
  });

  const loadOrganisationUsers = useCallback(
    async (userId: string, organisationIdValue: string) => {
      setTeamLoading(true);

      try {
        const { data: organisationUsers, error: usersError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("organisation_id", organisationIdValue)
          .order("full_name", { ascending: true });

        if (usersError) {
          throw usersError;
        }

        const members: TeamMemberView[] = (organisationUsers || []).map(
          (profile) => ({
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            role: profile.id === userId ? "owner" : "member",
          })
        );

        const { data: contacts, error: contactsError } = await supabase
          .from("contacts")
          .select("id, name, email, company_name")
          .order("created_at", { ascending: false });

        if (contactsError) {
          console.error("Contacts load error:", contactsError);
        }

        setTeamMembers(members);

        setAllContacts(
          contactsError ? [] : ((contacts || []) as TeamContactOption[])
        );
      } catch (error) {
        console.error("Failed to load organisation users:", error);

        setTeamMembers([]);
        setAllContacts([]);
      } finally {
        setTeamLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!currentUserId || !organisationId) {
      setTeamMembers([]);
      setAllContacts([]);
      return;
    }

    void loadOrganisationUsers(currentUserId, organisationId);
  }, [currentUserId, organisationId, loadOrganisationUsers]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void triggerWorker();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [triggerWorker]);

  /*
   * Meta and LinkedIn continue to use the original code/state callback.
   * TikTok is handled by useTikTokOAuthResult and the dedicated
   * /api/auth/tiktok/callback server route.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.hash === "#_=_") {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (!code || !state) {
      return;
    }

    let cancelled = false;

    const cleanOAuthUrl = () => {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    };

    const handleLegacyOAuth = async () => {
      try {
        let parsedState: OAuthState;

        try {
          parsedState = JSON.parse(
            decodeURIComponent(state)
          ) as OAuthState;
        } catch {
          throw new Error("Invalid OAuth state format");
        }

        const platform = parsedState.platform;
        const userId = parsedState.userId;

        if (!platform || !userId) {
          throw new Error("OAuth state is missing required values");
        }

        if (platform === "tiktok") {
          throw new Error(
            "TikTok must return through /api/auth/tiktok/callback"
          );
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || user.id !== userId) {
          throw new Error("OAuth user mismatch");
        }

        const response = await fetch("/api/oauth/exchange", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            platform,
            code,
            state,
            userId,
          }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "OAuth exchange failed");
        }

        const tokens = (await response.json()) as OAuthTokens;

        if (!tokens.access_token) {
          throw new Error("Missing OAuth access token");
        }

        const { error } = await supabase.from("social_accounts").upsert(
          {
            user_id: userId,
            platform,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || null,
            expires_at: tokens.expires_at || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,platform",
          }
        );

        if (error) {
          throw error;
        }

        sessionStorage.removeItem(getOAuthStorageKey(platform));
        sessionStorage.removeItem("oauth_started_at");

        await refreshConnections();
        await verifyConnections();
        await verifyPendingOAuth();

        if (!cancelled) {
          toast.success(`${platform} connected successfully`);
          setConnectedPlatformModal(platform);
          setShowConnectedModal(true);
        }
      } catch (error) {
        console.error("OAuth callback handling failed:", error);

        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "OAuth connection failed"
          );
        }
      } finally {
        cleanOAuthUrl();
      }
    };

    void handleLegacyOAuth();

    return () => {
      cancelled = true;
    };
  }, [
    refreshConnections,
    verifyConnections,
    verifyPendingOAuth,
  ]);

  const handleAddContactToTeam = useCallback(
    async (contact: TeamContactOption) => {
      if (!organisationId) {
        toast.error("Organisation not loaded");
        return;
      }

      const contactEmail = contact.email?.trim();

      if (!contactEmail) {
        toast.error("This contact has no email address");
        return;
      }

      setAddingContactId(contact.id);

      try {
        const {
          data: matchedProfile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("id, organisation_id, full_name, email")
          .ilike("email", contactEmail)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!matchedProfile) {
          throw new Error(
            "No account found for this email. They need to sign up first."
          );
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            organisation_id: organisationId,
          })
          .eq("id", matchedProfile.id);

        if (updateError) {
          throw updateError;
        }

        let autoGroupCount = 0;

        if (contact.company_name?.trim()) {
          const {
            data: companyContacts,
            error: companyContactsError,
          } = await supabase
            .from("contacts")
            .select("email")
            .ilike(
              "company_name",
              contact.company_name.trim()
            );

          if (companyContactsError) {
            console.warn(
              "Company contact lookup failed:",
              companyContactsError
            );
          } else {
            const otherEmails = (companyContacts || [])
              .map((companyContact) =>
                (companyContact.email || "")
                  .trim()
                  .toLowerCase()
              )
              .filter(
                (companyEmail) =>
                  companyEmail &&
                  companyEmail !== contactEmail.toLowerCase()
              );

            if (otherEmails.length > 0) {
              const {
                data: companyProfiles,
                error: companyProfilesError,
              } = await supabase
                .from("profiles")
                .select("id, organisation_id")
                .in("email", otherEmails);

              if (companyProfilesError) {
                console.warn(
                  "Company profile lookup failed:",
                  companyProfilesError
                );
              } else {
                const profilesToAdd = (
                  companyProfiles || []
                ).filter(
                  (profile) =>
                    profile.organisation_id !== organisationId
                );

                if (profilesToAdd.length > 0) {
                  const profileIds = profilesToAdd.map(
                    (profile) => profile.id
                  );

                  const { error: batchError } = await supabase
                    .from("profiles")
                    .update({
                      organisation_id: organisationId,
                    })
                    .in("id", profileIds);

                  if (batchError) {
                    throw batchError;
                  }

                  autoGroupCount = profileIds.length;
                }
              }
            }
          }
        }

        if (currentUserId) {
          await loadOrganisationUsers(
            currentUserId,
            organisationId
          );
        }

        const groupedMessage =
          autoGroupCount > 0
            ? ` and ${autoGroupCount} colleague${
                autoGroupCount === 1 ? "" : "s"
              } from ${contact.company_name}`
            : "";

        toast.success(
          `${
            contact.name || contactEmail
          } added to the team${groupedMessage}`
        );
      } catch (error) {
        console.error("Add contact to team failed:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to add contact to team"
        );
      } finally {
        setAddingContactId(null);
      }
    },
    [
      currentUserId,
      loadOrganisationUsers,
      organisationId,
    ]
  );

  const filteredContacts = useMemo(() => {
    const query = contactSearchQuery.trim().toLowerCase();

    if (!query) {
      return allContacts;
    }

    return allContacts.filter(
      (contact) =>
        (contact.name || "")
          .toLowerCase()
          .includes(query) ||
        (contact.email || "")
          .toLowerCase()
          .includes(query) ||
        (contact.company_name || "")
          .toLowerCase()
          .includes(query)
    );
  }, [allContacts, contactSearchQuery]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="animate-spin text-stone-400"
            size={28}
          />

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
            Initialising Workspace
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-gradient-to-b from-[#faf9f6] to-[#f3f1ec] p-4 text-stone-900 sm:p-6 lg:p-8 xl:p-10">
      <SettingsHeader
        isSaving={isSaving}
        onSave={() => void saveProfile()}
        onLogout={() => void logout()}
        onManageSubscription={() =>
          router.push("/manage-subscription")
        }
      />

      <nav className="mb-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("account")}
          className={`rounded-full px-8 py-4 text-[9px] font-black uppercase ${
            activeTab === "account"
              ? "bg-stone-900 text-white"
              : "border bg-white"
          }`}
        >
          Profile
        </button>
      </nav>

      <main className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === "account" ? (
            <motion.div
              key="account"
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -20,
              }}
              className="space-y-12"
            >
              <section className="space-y-10 rounded-[2rem] border border-stone-200 bg-white/90 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.04)] backdrop-blur sm:p-6 lg:space-y-16 lg:rounded-[4rem] lg:p-8">
                <ProfileSettings
                  displayName={displayName}
                  setDisplayName={setDisplayName}
                  email={email}
                  bio={bio}
                  setBio={setBio}
                  logoUrl={logoUrl}
                  logoUploading={logoUploading}
                  uploadLogo={uploadLogo}
                />

                <TeamSettings
                  teamLoading={teamLoading}
                  teamMembers={teamMembers}
                  allContacts={allContacts}
                  filteredContacts={filteredContacts}
                  contactSearchQuery={contactSearchQuery}
                  setContactSearchQuery={setContactSearchQuery}
                  addingContactId={addingContactId}
                  onAddContact={handleAddContactToTeam}
                />

                <SocialSettings
                  socialAccounts={socialAccounts}
                  connectionHealth={connectionHealth}
                />

                <div className="border-t border-stone-100 pt-10">
                  <PasswordSection />
                </div>
              </section>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <section className="mt-20 border-t border-stone-200 pt-12">
        <LegalHub />
      </section>

      <ConnectedAccountModal
        open={showConnectedModal}
        platform={connectedPlatformModal}
        onClose={() => {
          setShowConnectedModal(false);
          setConnectedPlatformModal(null);
        }}
      />
    </div>
  );
}

export default function Settings() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
          <div className="flex flex-col items-center gap-4">
            <Loader2
              className="animate-spin text-stone-400"
              size={28}
            />

            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
              Loading Settings
            </p>
          </div>
        </div>
      }
    >
      <SettingsInner />
    </Suspense>
  );
}