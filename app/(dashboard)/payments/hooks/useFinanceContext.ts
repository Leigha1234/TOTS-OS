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
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clears all locally resolved context.
   */
  const clearContext = useCallback(() => {
    setUserId(null);
    setOrgId(null);
    setTeamId(null);
    setRole(null);
    setSubscriptionTier(null);
  }, []);

  /**
   * Resolve the currently authenticated user's organisation/team context.
   */
  const resolveContext =
    useCallback(async (): Promise<FinanceContext | null> => {
      setError(null);

      try {
        // ---------------------------------------------------------
        // 1. AUTHENTICATED USER
        // ---------------------------------------------------------

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

        // ---------------------------------------------------------
        // 2. LOAD PROFILE + TEAM MEMBERSHIP
        // ---------------------------------------------------------

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

        // ---------------------------------------------------------
        // 3. HANDLE LOOKUP ERRORS
        // ---------------------------------------------------------

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

        /**
         * We do not immediately throw for either query individually,
         * because TOTS-OS can resolve organisation context from either
         * profiles OR team_members.
         */

        // ---------------------------------------------------------
        // 4. RESOLVE ORGANISATION
        // ---------------------------------------------------------

        const resolvedOrgId =
          profile?.organisation_id ??
          membership?.organisation_id ??
          null;

        const resolvedTeamId =
          membership?.team_id ??
          null;

        // Prefer team role where one exists because team membership
        // can override the general profile role.
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

        // ---------------------------------------------------------
        // 5. SAVE CONTEXT
        // ---------------------------------------------------------

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
        setSubscriptionTier(context.subscriptionTier);

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

  /**
   * Manually refresh organisation/team context.
   *
   * Useful if:
   * - team membership changes
   * - organisation changes
   * - permissions change
   * - subscription changes
   */
  const refreshContext = useCallback(async () => {
    setLoading(true);

    try {
      return await resolveContext();
    } finally {
      setLoading(false);
    }
  }, [resolveContext]);

  // -------------------------------------------------------------
  // INITIAL LOAD
  // -------------------------------------------------------------

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

    initialise();

    return () => {
      mounted = false;
    };
  }, [resolveContext]);

  // -------------------------------------------------------------
  // AUTH STATE SYNC
  // -------------------------------------------------------------

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "SIGNED_OUT") {
          clearContext();
          setError(null);
          return;
        }

        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          await resolveContext();
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