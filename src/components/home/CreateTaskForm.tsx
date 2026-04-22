import { useState } from "react";
import type { Status } from "../../lib/statusService";
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

type CreateTaskFormProps = {
  statuses: Status[];
  loading: boolean;
  error: string | null;
  onCreateTask: (input: {
    title: string;
    description?: string;
    statusId?: number;
  }) => Promise<boolean>;
};

export default function CreateTaskForm({
  statuses,
  loading,
  error,
  onCreateTask,
}: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const didCreate = await onCreateTask({
      title,
      description,
      statusId: statusId ? Number(statusId) : undefined,
    });

    if (didCreate) {
      setTitle("");
      setDescription("");
      setStatusId("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Task</CardTitle>
        <CardDescription>Add a task to get started</CardDescription>
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
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          {statuses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusId}
                onValueChange={setStatusId}
                disabled={loading}
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
