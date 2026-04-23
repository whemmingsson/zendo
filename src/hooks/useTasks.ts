import { useTasksContext } from "../context/TasksContext";

export function useTasks() {
  return useTasksContext();
}
