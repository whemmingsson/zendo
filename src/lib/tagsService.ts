import { supabase } from "./supabase";
import type { Tables } from "./database.types";

export type Tag = Tables<"Tags">;

let cache: Tag[] | null = null;

/**
 * Fetch all tags. Publicly accessible, no auth required.
 */
export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("Tags")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }

  return data;
}

/**
 * Returns tags from cache, fetching from Supabase only on the first call.
 */
export async function getCachedTags(): Promise<Tag[]> {
  if (cache) return cache;
  cache = await getTags();
  return cache;
}

/**
 * Invalidate the tags cache, forcing the next call to re-fetch.
 */
export function invalidateTagsCache(): void {
  cache = null;
}
