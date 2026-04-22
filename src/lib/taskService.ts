import { supabase } from "./supabase";
import type { Tables, TablesInsert } from "./database.types";
import { getCachedStatuses } from "./statusService";
import type { Status } from "./statusService";

type Task = Tables<"Tasks">;
type TaskInsert = TablesInsert<"Tasks">;

export type TaskWithStatus = Omit<Task, "status_id"> & {
  status: Status | null;
};

function enrichWithStatus(task: Task, statuses: Status[]): TaskWithStatus {
  const { status_id, ...rest } = task;
  return {
    ...rest,
    status: statuses.find((s) => s.id === status_id) ?? null,
  };
}

/**
 * Create a new task for the authenticated user
 */
export async function createTask(
  title: string,
  description?: string,
  statusId?: number,
): Promise<TaskWithStatus | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to create a task");
  }

  const taskData: TaskInsert = {
    title,
    description: description || null,
    status_id: statusId ?? null,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("Tasks")
    .insert([taskData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  const statuses = await getCachedStatuses();
  return enrichWithStatus(data, statuses);
}

/**
 * Get all tasks created by the authenticated user
 */
export async function getUserTasks(): Promise<TaskWithStatus[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to fetch tasks");
  }

  const [{ data, error }, statuses] = await Promise.all([
    supabase
      .from("Tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getCachedStatuses(),
  ]);

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  return data.map((task) => enrichWithStatus(task, statuses));
}

/**
 * Delete a task by ID (only if it belongs to the authenticated user)
 */
export async function deleteTask(taskId: number): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to delete a task");
  }

  const { error } = await supabase
    .from("Tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }
}
