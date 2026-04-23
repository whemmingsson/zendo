import { useTasks } from "../hooks/useTasks";
import { TasksProvider } from "../context/TasksContext";
import CreateTaskForm from "../components/home/CreateTaskForm";
import TaskList from "../components/home/TaskList";
import ConfirmDeleteTaskDialog from "../components/home/ConfirmDeleteTaskDialog";

export default function HomePage() {
  return (
    <TasksProvider>
      <HomePageContent />
    </TasksProvider>
  );
}

function HomePageContent() {
  const { initialLoading } = useTasks();

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
        <CreateTaskForm />
        <TaskList />
      </div>

      <ConfirmDeleteTaskDialog />
    </div>
  );
}
