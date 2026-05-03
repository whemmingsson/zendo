import { useEffect, useState } from "react";
import { useTasks } from "../../hooks/useTasks";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export default function CreateTaskForm() {
  const {
    statuses,
    tags,
    creatingTask,
    updatingTask,
    taskToEdit,
    error,
    createTaskItem,
    updateTaskItem,
    cancelEditTask,
  } = useTasks();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const isEditMode = !!taskToEdit;
  const isSubmitting = creatingTask || updatingTask;

  useEffect(() => {
    if (!taskToEdit) {
      setTitle("");
      setDescription("");
      setStatusId("");
      setSelectedTagIds([]);
      return;
    }

    setTitle(taskToEdit.title);
    setDescription(taskToEdit.description ?? "");
    setStatusId(taskToEdit.status ? String(taskToEdit.status.id) : "");
    setSelectedTagIds(taskToEdit.tags.map((tag) => tag.id));
  }, [taskToEdit]);

  const toggleTagSelection = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input = {
      title,
      description,
      statusId: statusId ? Number(statusId) : undefined,
      tagIds: selectedTagIds,
    };

    const didSucceed = taskToEdit
      ? await updateTaskItem(taskToEdit.id, input)
      : await createTaskItem(input);

    if (didSucceed) {
      setTitle("");
      setDescription("");
      setStatusId("");
      setSelectedTagIds([]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Task" : "Create a New Task"}</CardTitle>
        <CardDescription>
          {isEditMode
            ? "Update task details and save your changes"
            : "Add a task to get started"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          {statuses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusId}
                onValueChange={setStatusId}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select a status (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 text-sm rounded-md border px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => toggleTagSelection(tag.id)}
                      disabled={isSubmitting}
                    />
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full border"
                      style={{ backgroundColor: tag.color ?? "transparent" }}
                    />
                    <span className="truncate">{tag.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save Task"
                  : "Create Task"}
            </Button>
            {isEditMode && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={cancelEditTask}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
