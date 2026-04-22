import { useEffect, useState } from "react";
import { createTask, deleteTask, getUserTasks } from "../lib/taskService";
import type { TaskWithStatus } from "../lib/taskService";
import { getCachedStatuses } from "../lib/statusService";
import type { Status } from "../lib/statusService";

export function useTasks() {
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [creatingTask, setCreatingTask] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const [userTasks, allStatuses] = await Promise.all([
          getUserTasks(),
          getCachedStatuses(),
        ]);
        setTasks(userTasks);
        setStatuses(allStatuses);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setInitialLoading(false);
      }
    };

    loadTasks();
  }, []);

  const createTaskItem = async (input: {
    title: string;
    description?: string;
    statusId?: number;
  }): Promise<boolean> => {
    setError(null);

    if (!input.title.trim()) {
      setError("Title is required");
      return false;
    }

    setCreatingTask(true);
    try {
      const newTask = await createTask(
        input.title,
        input.description,
        input.statusId,
      );

      if (newTask) {
        setTasks((prev) => [newTask, ...prev]);
      }

      return !!newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
      return false;
    } finally {
      setCreatingTask(false);
    }
  };

  const requestDeleteTask = (task: TaskWithStatus) => {
    setTaskToDelete(task);
  };

  const cancelDeleteTask = () => {
    setTaskToDelete(null);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    setDeletingId(taskToDelete.id);
    setTaskToDelete(null);

    try {
      await deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setDeletingId(null);
    }
  };

  return {
    tasks,
    statuses,
    creatingTask,
    deletingId,
    taskToDelete,
    error,
    initialLoading,
    createTaskItem,
    requestDeleteTask,
    cancelDeleteTask,
    confirmDeleteTask,
  };
}
