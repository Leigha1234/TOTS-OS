"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

type Filter = { op: "eq" | "in"; column: string; value: unknown };
type Query = {
  table: string; operation: string; columns: string; filters: Filter[];
  values?: unknown; order?: { column: string; ascending: boolean }; limit?: number;
  single?: "single" | "maybeSingle";
};

/** A small adapter for the original editor's existing query chains.
 * Only the server decides which tables, fields and operations are allowed.
 * It never changes the global Supabase client or intercepts unrelated requests.
 */
export function createAgencyCampaignClient(client: SupabaseClient, organisationId: string): SupabaseClient {
  function from(table: string) {
    const query: Query = { table, operation: "select", columns: "*", filters: [] };
    let execution: Promise<unknown> | undefined;
    const builder = {
      select(columns = "*") { query.columns = columns; return builder; },
      insert(values: unknown) { query.operation = "insert"; query.values = values; return builder; },
      update(values: unknown) { query.operation = "update"; query.values = values; return builder; },
      upsert(values: unknown, _options?: unknown) { query.operation = "upsert"; query.values = values; return builder; },
      delete() { query.operation = "delete"; return builder; },
      eq(column: string, value: unknown) { query.filters.push({ op: "eq", column, value }); return builder; },
      in(column: string, value: unknown[]) { query.filters.push({ op: "in", column, value }); return builder; },
      order(column: string, options?: { ascending?: boolean }) { query.order = { column, ascending: options?.ascending !== false }; return builder; },
      limit(value: number) { query.limit = value; return builder; },
      single() { query.single = "single"; return builder; },
      maybeSingle() { query.single = "maybeSingle"; return builder; },
      then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
        execution ??= (async () => {
          try {
            const { data: { session } } = await client.auth.getSession();
            if (!session) throw new Error("Please sign in again.");
            const response = await fetch("/api/agency/email/data", {
              method: "POST", cache: "no-store",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({ organisationId, ...query }),
            });
            const result = await response.json();
            if (!response.ok) return { data: null, error: { message: result.error || "Unable to access this client's email data." } };
            return result;
          } catch (error) {
            return { data: null, error: { message: error instanceof Error ? error.message : "Request failed" } };
          }
        })();
        return execution.then(resolve, reject);
      },
    };
    return builder;
  }
  return new Proxy(client, {
    get(target, key) {
      if (key === "from") return from;
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
