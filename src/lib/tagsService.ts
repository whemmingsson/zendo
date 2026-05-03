import { supabase } from "./supabase";
import type { Tables, TablesInsert, TablesUpdate } from "./database.types";

export type Tag = Tables<"Tags">;
type TagInsert = TablesInsert<"Tags">;
type TagUpdate = TablesUpdate<"Tags">;

let cache: Tag[] | null = null;
let usageCountsCache = new Map<string, Record<number, number>>();

const isNoRowsError = (code: string | undefined): boolean => {
  return code === "PGRST116";
};

const assertCurrentUserIsAdmin = async (): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated");
  }

  const { data, error } = await supabase
    .from("Admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error && !isNoRowsError(error.code)) {
    throw new Error(`Failed to verify admin access: ${error.message}`);
  }

  if (!data) {
    throw new Error("Admin access required");
  }
};

export async function isCurrentUserAdmin(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("Admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error && !isNoRowsError(error.code)) {
    throw new Error(`Failed to verify admin access: ${error.message}`);
  }

  return !!data;
}

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

function getUsageCountCacheKey(tagIds: number[]): string {
  return [...new Set(tagIds)].sort((a, b) => a - b).join(",");
}

function invalidateTagUsageCountsCache(): void {
  usageCountsCache = new Map();
}

export async function createTag(input: {
  label: string;
  description?: string;
  color?: string;
}): Promise<Tag> {
  await assertCurrentUserIsAdmin();

  const payload: TagInsert = {
    label: input.label,
    description: input.description?.trim() ? input.description.trim() : null,
    color: input.color?.trim() ? input.color.trim() : null,
  };

  const { data, error } = await supabase
    .from("Tags")
    .insert([payload])
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create tag: ${error.message}`);
  }

  invalidateTagsCache();
  invalidateTagUsageCountsCache();
  return data;
}

export async function updateTag(
  tagId: number,
  updates: {
    label?: string;
    description?: string;
    color?: string;
  },
): Promise<Tag> {
  await assertCurrentUserIsAdmin();

  const payload: TagUpdate = {};

  if (typeof updates.label === "string") {
    payload.label = updates.label.trim();
  }

  if (typeof updates.description === "string") {
    payload.description = updates.description.trim() || null;
  }

  if (typeof updates.color === "string") {
    payload.color = updates.color.trim() || null;
  }

  const { data, error } = await supabase
    .from("Tags")
    .update(payload)
    .eq("id", tagId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update tag: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to update tag: tag not found");
  }

  invalidateTagsCache();
  invalidateTagUsageCountsCache();
  return data;
}

export async function getTagUsageCount(tagId: number): Promise<number> {
  const counts = await getTagUsageCounts([tagId]);
  return counts[tagId] ?? 0;
}

export async function getTagUsageCounts(
  tagIds: number[],
): Promise<Record<number, number>> {
  const normalizedTagIds = [...new Set(tagIds)];

  if (normalizedTagIds.length === 0) {
    return {};
  }

  const cacheKey = getUsageCountCacheKey(normalizedTagIds);

  const cached = usageCountsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { data, error } = await supabase
    .from("Tasks_Tags")
    .select("tag_id")
    .in("tag_id", normalizedTagIds);

  if (error) {
    throw new Error(`Failed to fetch tag usage counts: ${error.message}`);
  }

  const counts: Record<number, number> = {};

  for (const tagId of normalizedTagIds) {
    counts[tagId] = 0;
  }

  for (const relation of data) {
    counts[relation.tag_id] = (counts[relation.tag_id] ?? 0) + 1;
  }

  usageCountsCache.set(cacheKey, counts);
  return counts;
}

export async function deleteTag(tagId: number): Promise<void> {
  await assertCurrentUserIsAdmin();

  const { error: unlinkError } = await supabase
    .from("Tasks_Tags")
    .delete()
    .eq("tag_id", tagId);

  if (unlinkError) {
    throw new Error(`Failed to remove tag from tasks: ${unlinkError.message}`);
  }

  const { error: deleteError } = await supabase
    .from("Tags")
    .delete()
    .eq("id", tagId);

  if (deleteError) {
    throw new Error(`Failed to delete tag: ${deleteError.message}`);
  }

  invalidateTagsCache();
  invalidateTagUsageCountsCache();
}
