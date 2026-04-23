import { supabase } from "./supabase";
import type { Tables, TablesInsert } from "./database.types";
import { getCachedStatuses } from "./statusService";
import type { Status } from "./statusService";

type Task = Tables<"Tasks">;
type TaskInsert = TablesInsert<"Tasks">;

export type TaskWithStatus = Omit<Task, "status_id"> & {
  status: Status | null;
  priority: number;
};

const enrichWithStatus = (task: Task, statuses: Status[]): TaskWithStatus => {
  const { status_id, ...rest } = task;
  return {
    ...rest,
    status: statuses.find((s) => s.id === status_id) ?? null,
    priority: 0,
  };
};

const getStatusKey = (task: TaskWithStatus): string => {
  return task.status ? String(task.status.id) : "unassigned";
};

export const withRecomputedPriorities = (
  tasks: TaskWithStatus[],
): TaskWithStatus[] => {
  const statusCounters = new Map<string, number>();

  return tasks.map((task) => {
    const key = getStatusKey(task);
    const nextPriority = statusCounters.get(key) ?? 0;

    statusCounters.set(key, nextPriority + 1);

    return {
      ...task,
      priority: nextPriority,
    };
  });
};

/**
 * Create a new task for the authenticated user
 */
export const createTask = async (
  title: string,
  description?: string,
  statusId?: number,
): Promise<TaskWithStatus | null> => {
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
};

/**
 * Get all tasks created by the authenticated user
 */
export const getUserTasks = async (): Promise<TaskWithStatus[]> => {
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

  return withRecomputedPriorities(
    data.map((task) => enrichWithStatus(task, statuses)),
  );
};

/**
 * Update task status by ID (only if it belongs to the authenticated user)
 */
export const updateTaskStatus = async (
  taskId: number,
  statusId: number | null,
): Promise<TaskWithStatus> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to update task status");
  }

  const { data, error } = await supabase
    .from("Tasks")
    .update({ status_id: statusId })
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update task status: ${error.message}`);
  }

  if (!data) {
    const { data: existingTask, error: existingTaskError } = await supabase
      .from("Tasks")
      .select("id")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingTaskError) {
      throw new Error(
        `Failed to update task status: ${existingTaskError.message}`,
      );
    }

    if (!existingTask) {
      throw new Error("Failed to update task status: task not found");
    }

    throw new Error(
      "Failed to update task status: update was rejected (check Supabase UPDATE policy for Tasks)",
    );
  }

  const statuses = await getCachedStatuses();
  return enrichWithStatus(data, statuses);
};

/**
 * Delete a task by ID (only if it belongs to the authenticated user)
 */
export const deleteTask = async (taskId: number): Promise<void> => {
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
};
