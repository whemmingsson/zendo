import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import { TasksProvider } from "../context/TasksContext";
import { useTasks } from "../hooks/useTasks";
import { withRecomputedPriorities } from "../lib/taskService";
import type { TaskWithStatus } from "../lib/taskService";
import { cn } from "../lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

type Column = {
  id: string;
  label: string;
  statusId: number | null;
};

type TaskCardData = {
  id: string;
  taskId: number;
  columnId: string;
};

const UNASSIGNED_COLUMN_ID = "unassigned";

function toTaskCardId(taskId: number): string {
  return `task-${taskId}`;
}

function toColumnId(statusId: number | null): string {
  return statusId === null ? UNASSIGNED_COLUMN_ID : `status-${statusId}`;
}

function statusIdFromColumnId(columnId: string): number | null {
  if (columnId === UNASSIGNED_COLUMN_ID) {
    return null;
  }

  return Number(columnId.replace("status-", ""));
}

function isTaskInStatus(
  task: TaskWithStatus,
  statusId: number | null,
): boolean {
  return (task.status?.id ?? null) === statusId;
}

function sortTasksByPriority(tasks: TaskWithStatus[]): TaskWithStatus[] {
  return [...tasks].sort((a, b) => {
    if (a.priority === b.priority) {
      return b.created_at.localeCompare(a.created_at);
    }
    return a.priority - b.priority;
  });
}

function reorderTasksByIdsInStatus(
  tasks: TaskWithStatus[],
  statusId: number | null,
  orderedTaskIds: number[],
): TaskWithStatus[] {
  const orderedTasksMap = new Map(
    tasks
      .filter((task) => isTaskInStatus(task, statusId))
      .map((task) => [task.id, task]),
  );
  const orderedTasks = orderedTaskIds
    .map((taskId) => orderedTasksMap.get(taskId))
    .filter((task): task is TaskWithStatus => !!task);

  let index = 0;

  return tasks.map((task) => {
    if (!isTaskInStatus(task, statusId)) {
      return task;
    }

    const nextTask = orderedTasks[index];
    index += 1;
    return nextTask ?? task;
  });
}

export const BoardPage = () => {
  return (
    <TasksProvider>
      <BoardPageContent />
    </TasksProvider>
  );
};

function BoardPageContent() {
  const {
    tasks,
    statuses,
    initialLoading,
    error,
    reorderTasks,
    moveTaskToStatus,
  } = useTasks();
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [activeTaskWidth, setActiveTaskWidth] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const columns = useMemo<Column[]>(
    () => [
      {
        id: UNASSIGNED_COLUMN_ID,
        label: "Unassigned",
        statusId: null,
      },
      ...statuses.map((status) => ({
        id: toColumnId(status.id),
        label: status.label,
        statusId: status.id,
      })),
    ],
    [statuses],
  );

  const tasksByColumnId = useMemo(() => {
    const grouped = new Map<string, TaskWithStatus[]>();

    for (const column of columns) {
      grouped.set(column.id, []);
    }

    for (const task of tasks) {
      const columnId = toColumnId(task.status?.id ?? null);
      if (!grouped.has(columnId)) {
        grouped.set(columnId, []);
      }

      grouped.get(columnId)?.push(task);
    }

    for (const [columnId, columnTasks] of grouped.entries()) {
      grouped.set(columnId, sortTasksByPriority(columnTasks));
    }

    return grouped;
  }, [columns, tasks]);

  const activeTask = useMemo(() => {
    if (activeTaskId === null) {
      return null;
    }
    return tasks.find((task) => task.id === activeTaskId) ?? null;
  }, [activeTaskId, tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const activeData = event.active.data.current as TaskCardData | undefined;
    if (!activeData || typeof activeData.taskId !== "number") {
      setActiveTaskId(null);
      setActiveTaskWidth(null);
      return;
    }

    setActiveTaskId(activeData.taskId);
    setActiveTaskWidth(event.active.rect.current.initial?.width ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTaskId(null);
    setActiveTaskWidth(null);

    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeData = active.data.current as TaskCardData | undefined;
    if (!activeData || typeof activeData.taskId !== "number") {
      return;
    }

    const activeTaskId = activeData.taskId;
    const sourceColumnId = activeData.columnId;

    let destinationColumnId: string | null = null;
    let overTaskId: number | null = null;

    const overData = over.data.current as
      | { type: "task"; columnId: string; taskId: number }
      | { type: "column"; columnId: string }
      | undefined;

    if (overData?.type === "task") {
      destinationColumnId = overData.columnId;
      overTaskId = overData.taskId;
    } else if (overData?.type === "column") {
      destinationColumnId = overData.columnId;
    }

    if (!destinationColumnId) {
      if (typeof over.id === "string" && over.id.startsWith("column-")) {
        destinationColumnId = over.id.replace("column-", "");
      } else {
        return;
      }
    }

    const sourceTasks = tasksByColumnId.get(sourceColumnId) ?? [];
    const destinationTasks = tasksByColumnId.get(destinationColumnId) ?? [];

    const sourceTaskIds = sourceTasks.map((task) => task.id);
    const destinationTaskIds = destinationTasks.map((task) => task.id);

    const sourceIndex = sourceTaskIds.indexOf(activeTaskId);
    if (sourceIndex === -1) {
      return;
    }

    const previousTasks = tasks;
    const sameColumn = sourceColumnId === destinationColumnId;

    if (sameColumn) {
      let destinationIndex = destinationTaskIds.length - 1;
      if (overTaskId !== null) {
        const overIndex = destinationTaskIds.indexOf(overTaskId);
        if (overIndex !== -1) {
          destinationIndex = overIndex;
        }
      }

      if (destinationIndex === sourceIndex) {
        return;
      }

      const reorderedIds = arrayMove(
        sourceTaskIds,
        sourceIndex,
        destinationIndex,
      );
      const nextTasks = withRecomputedPriorities(
        reorderTasksByIdsInStatus(
          tasks,
          statusIdFromColumnId(sourceColumnId),
          reorderedIds,
        ),
      );

      reorderTasks(nextTasks);
      return;
    }

    const sourceStatusId = statusIdFromColumnId(sourceColumnId);
    const destinationStatusId = statusIdFromColumnId(destinationColumnId);
    const destinationStatus =
      destinationStatusId === null
        ? null
        : (statuses.find((status) => status.id === destinationStatusId) ??
          null);

    const nextSourceIds = sourceTaskIds.filter(
      (taskId) => taskId !== activeTaskId,
    );
    const nextDestinationIds = [...destinationTaskIds];

    const insertAt =
      overTaskId === null
        ? nextDestinationIds.length
        : Math.max(nextDestinationIds.indexOf(overTaskId), 0);

    nextDestinationIds.splice(insertAt, 0, activeTaskId);

    let nextTasks = tasks.map((task) =>
      task.id === activeTaskId ? { ...task, status: destinationStatus } : task,
    );

    nextTasks = reorderTasksByIdsInStatus(
      nextTasks,
      sourceStatusId,
      nextSourceIds,
    );
    nextTasks = reorderTasksByIdsInStatus(
      nextTasks,
      destinationStatusId,
      nextDestinationIds,
    );
    nextTasks = withRecomputedPriorities(nextTasks);

    reorderTasks(nextTasks);

    const didPersist = await moveTaskToStatus(
      activeTaskId,
      destinationStatusId,
    );
    if (!didPersist) {
      reorderTasks(previousTasks);
    }
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
    setActiveTaskWidth(null);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading board...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Task Board</h1>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-start">
          {columns.map((column) => {
            const columnTasks = tasksByColumnId.get(column.id) ?? [];

            return (
              <BoardColumn key={column.id} id={column.id} label={column.label}>
                <SortableContext
                  items={columnTasks.map((task) => toTaskCardId(task.id))}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 min-h-24">
                    {columnTasks.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground text-center">
                            Drop tasks here
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      columnTasks.map((task) => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          columnId={column.id}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </BoardColumn>
            );
          })}
        </div>
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              isOverlay
              style={{ width: activeTaskWidth ?? undefined }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

type BoardColumnProps = {
  id: string;
  label: string;
  children: React.ReactNode;
};

function BoardColumn({ id, label, children }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${id}`,
    data: {
      type: "column",
      columnId: id,
    },
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "h-full",
        isOver && "ring-2 ring-primary/40 border-primary/50 bg-primary/5",
      )}
    >
      <CardHeader className="pb-0">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type SortableTaskCardProps = {
  task: TaskWithStatus;
  columnId: string;
};

function SortableTaskCard({ task, columnId }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: toTaskCardId(task.id),
    data: {
      type: "task",
      taskId: task.id,
      columnId,
    },
  });

  return (
    <div ref={setNodeRef}>
      <TaskCard
        task={task}
        className={cn(
          "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-0",
        )}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        {...attributes}
        {...listeners}
      />
    </div>
  );
}

type TaskCardProps = {
  task: TaskWithStatus;
  className?: string;
  isOverlay?: boolean;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>;

function TaskCard({
  task,
  className,
  isOverlay = false,
  style,
  ...props
}: TaskCardProps) {
  return (
    <Card
      style={style}
      className={cn(className, isOverlay && "shadow-lg ring-2 ring-primary/30")}
      {...props}
    >
      <CardContent className="pt-6">
        <h3 className="font-semibold text-sm">{task.title}</h3>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-2">
            {task.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
