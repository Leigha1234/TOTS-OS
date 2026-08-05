"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  bio: string | null;
  logo_url: string | null;
  organisation_id: string | null;
};

export function useSettingsProfile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [organisationId, setOrganisationId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setCurrentUserId(user.id);
      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          email,
          bio,
          logo_url,
          organisation_id
        `
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Profile not found.");
      }

      const profile = data as Profile;

      setDisplayName(profile.full_name || "");
      setBio(profile.bio || "");
      setLogoUrl(profile.logo_url || "");
      setOrganisationId(profile.organisation_id);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const saveProfile = useCallback(async () => {
    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: displayName.trim(),
          bio: bio.trim(),
          logo_url: logoUrl || null,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      toast.success("Settings saved successfully.");
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save settings."
      );
    } finally {
      setIsSaving(false);
    }
  }, [bio, displayName, logoUrl]);

  const uploadLogo = useCallback(async (file: File) => {
    setLogoUploading(true);

    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed.");
      }

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      const accessToken =
        sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        throw new Error("Not authenticated.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/settings/logo-upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const body = await response.json();

      if (!response.ok || !body.publicUrl) {
        throw new Error(
          body.error ||
            body.message ||
            "Logo upload failed."
        );
      }

      setLogoUrl(body.publicUrl);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            logo_url: body.publicUrl,
          })
          .eq("id", user.id);

        if (error) {
          throw error;
        }
      }

      toast.success("Logo uploaded successfully.");
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Logo upload failed."
      );
    } finally {
      setLogoUploading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  return {
    // Loading
    loading,
    isSaving,
    logoUploading,

    // User
    currentUserId,
    organisationId,

    // Profile values
    displayName,
    setDisplayName,

    email,

    bio,
    setBio,

    logoUrl,
    setLogoUrl,

    // Actions
    loadProfile,
    saveProfile,
    uploadLogo,
    logout,
  };
}