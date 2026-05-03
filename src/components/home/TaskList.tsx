import { useTasks } from "../../hooks/useTasks";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

export default function TaskList() {
  const { tasks, deletingId, requestDeleteTask } = useTasks();
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Tasks</h2>
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No tasks yet. Create one to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-4">
                      {task.status && (
                        <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                          {task.status.label}
                        </span>
                      )}
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className={
                                tag.color
                                  ? "text-xs font-medium px-2 py-0.5 rounded-full"
                                  : "text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                              }
                              style={
                                tag.color
                                  ? {
                                      backgroundColor: tag.color,
                                      color: "#ffffff",
                                    }
                                  : undefined
                              }
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(task.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === task.id}
                    onClick={() => requestDeleteTask(task)}
                  >
                    {deletingId === task.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
