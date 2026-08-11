"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type FinanceContext = {
  userId: string | null;
  orgId: string | null;
  teamId: string | null;
  role: string | null;
  subscriptionTier: string | null;
};

type UseFinanceContextResult = FinanceContext & {
  loading: boolean;
  error: string | null;
  refreshContext: () => Promise<FinanceContext | null>;
};

/**
 * Resolves the current user's finance context.
 *
 * This keeps the Finance section linked to the same:
 * - Supabase user
 * - organisation
 * - team
 * - role
 * - subscription tier
 *
 * used throughout TOTS-OS.
 */
export function useFinanceContext(): UseFinanceContextResult {
  const [userId, setUserId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  const [role, setRole] = useState<string | null>(null);

  const [subscriptionTier, setSubscriptionTier] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearContext = useCallback(() => {
    setUserId(null);
    setOrgId(null);
    setTeamId(null);
    setRole(null);
    setSubscriptionTier(null);
  }, []);

  const resolveContext =
    useCallback(async (): Promise<FinanceContext | null> => {
      setError(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw new Error(authError.message);
        }

        if (!user?.id) {
          clearContext();

          throw new Error(
            "You must be signed in to access Finance."
          );
        }

        const [
          { data: profile, error: profileError },
          { data: membership, error: membershipError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              `
                id,
                organisation_id,
                role,
                subscription_tier
              `
            )
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("team_members")
            .select(
              `
                user_id,
                team_id,
                organisation_id,
                role
              `
            )
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (profileError) {
          console.error(
            "Finance context profile lookup error:",
            profileError
          );
        }

        if (membershipError) {
          console.error(
            "Finance context team membership lookup error:",
            membershipError
          );
        }

        const resolvedOrgId =
          profile?.organisation_id ??
          membership?.organisation_id ??
          null;

        const resolvedTeamId =
          membership?.team_id ?? null;

        const resolvedRole = String(
          membership?.role ??
            profile?.role ??
            "user"
        )
          .toLowerCase()
          .trim();

        const resolvedTier = String(
          profile?.subscription_tier ??
            "unpaid"
        )
          .toLowerCase()
          .trim();

        if (!resolvedOrgId) {
          clearContext();

          throw new Error(
            "This account is not linked to an organisation."
          );
        }

        const context: FinanceContext = {
          userId: user.id,
          orgId: resolvedOrgId,
          teamId: resolvedTeamId,
          role: resolvedRole,
          subscriptionTier: resolvedTier,
        };

        setUserId(context.userId);
        setOrgId(context.orgId);
        setTeamId(context.teamId);
        setRole(context.role);
        setSubscriptionTier(
          context.subscriptionTier
        );

        return context;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to resolve finance context.";

        setError(message);

        console.error(
          "Finance context resolution error:",
          err
        );

        return null;
      }
    }, [clearContext]);

  const refreshContext =
    useCallback(async (): Promise<FinanceContext | null> => {
      setLoading(true);

      try {
        return await resolveContext();
      } finally {
        setLoading(false);
      }
    }, [resolveContext]);

  useEffect(() => {
    let mounted = true;

    async function initialise() {
      setLoading(true);

      try {
        await resolveContext();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void initialise();

    return () => {
      mounted = false;
    };
  }, [resolveContext]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "SIGNED_OUT") {
          clearContext();
          setError(null);
          setLoading(false);
          return;
        }

        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          setLoading(true);

          try {
            await resolveContext();
          } finally {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [clearContext, resolveContext]);

  return {
    userId,
    orgId,
    teamId,
    role,
    subscriptionTier,
    loading,
    error,
    refreshContext,
  };
}

export default useFinanceContext;