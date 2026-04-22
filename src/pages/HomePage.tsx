import { useTasks } from "../hooks/useTasks";
import CreateTaskForm from "../components/home/CreateTaskForm";
import TaskList from "../components/home/TaskList";
import ConfirmDeleteTaskDialog from "../components/home/ConfirmDeleteTaskDialog";

export default function HomePage() {
  const {
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
  } = useTasks();

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <CreateTaskForm
          statuses={statuses}
          loading={creatingTask}
          error={error}
          onCreateTask={createTaskItem}
        />

        <TaskList
          tasks={tasks}
          deletingId={deletingId}
          onRequestDeleteTask={requestDeleteTask}
        />
      </div>

      <ConfirmDeleteTaskDialog
        task={taskToDelete}
        onCancel={cancelDeleteTask}
        onConfirm={confirmDeleteTask}
      />
    </div>
  );
}
