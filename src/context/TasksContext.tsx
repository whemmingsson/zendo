import { createContext, useContext, useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  getUserTasks,
  updateTaskStatus,
  withRecomputedPriorities,
} from "../lib/taskService";
import type { TaskWithStatus } from "../lib/taskService";
import { getCachedStatuses } from "../lib/statusService";
import type { Status } from "../lib/statusService";

type CreateTaskInput = {
  title: string;
  description?: string;
  statusId?: number;
};

type TasksContextValue = {
  tasks: TaskWithStatus[];
  statuses: Status[];
  creatingTask: boolean;
  deletingId: number | null;
  taskToDelete: TaskWithStatus | null;
  error: string | null;
  initialLoading: boolean;
  createTaskItem: (input: CreateTaskInput) => Promise<boolean>;
  requestDeleteTask: (task: TaskWithStatus) => void;
  cancelDeleteTask: () => void;
  confirmDeleteTask: () => Promise<void>;
  reorderTasks: (nextTasks: TaskWithStatus[]) => void;
  moveTaskToStatus: (
    taskId: number,
    statusId: number | null,
  ) => Promise<boolean>;
};

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

type TasksProviderProps = {
  children: React.ReactNode;
};

export function TasksProvider({ children }: TasksProviderProps) {
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

        setTasks(withRecomputedPriorities(userTasks));
        setStatuses(allStatuses);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setInitialLoading(false);
      }
    };

    loadTasks();
  }, []);

  const createTaskItem = async (input: CreateTaskInput): Promise<boolean> => {
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
        setTasks((prev) => withRecomputedPriorities([newTask, ...prev]));
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
      setTasks((prev) =>
        withRecomputedPriorities(prev.filter((t) => t.id !== taskToDelete.id)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setDeletingId(null);
    }
  };

  const reorderTasks = (nextTasks: TaskWithStatus[]) => {
    setTasks(withRecomputedPriorities(nextTasks));
  };

  const moveTaskToStatus = async (
    taskId: number,
    statusId: number | null,
  ): Promise<boolean> => {
    setError(null);

    try {
      const updatedTask = await updateTaskStatus(taskId, statusId);
      setTasks((prev) =>
        withRecomputedPriorities(
          prev.map((task) =>
            task.id === taskId ? { ...task, status: updatedTask.status } : task,
          ),
        ),
      );
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update task status",
      );
      return false;
    }
  };

  return (
    <TasksContext.Provider
      value={{
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
        reorderTasks,
        moveTaskToStatus,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasksContext() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasksContext must be used inside a TasksProvider");
  }
  return context;
}
