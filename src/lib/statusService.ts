import { supabase } from "./supabase";
import type { Tables } from "./database.types";

export type Status = Tables<"Statuses">;

let cache: Status[] | null = null;

/**
 * Fetch all statuses. Publicly accessible, no auth required.
 */
export async function getStatuses(): Promise<Status[]> {
  const { data, error } = await supabase
    .from("Statuses")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch statuses: ${error.message}`);
  }

  return data;
}

/**
 * Returns statuses from cache, fetching from Supabase only on the first call.
 */
export async function getCachedStatuses(): Promise<Status[]> {
  if (cache) return cache;
  cache = await getStatuses();
  return cache;
}

/**
 * Invalidate the statuses cache, forcing the next call to re-fetch.
 */
export function invalidateStatusCache(): void {
  cache = null;
}
