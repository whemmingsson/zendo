import type { TaskWithStatus } from "../../lib/taskService";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

type ConfirmDeleteTaskDialogProps = {
  task: TaskWithStatus | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteTaskDialog({
  task,
  onCancel,
  onConfirm,
}: ConfirmDeleteTaskDialogProps) {
  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete task</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">"{task?.title}"</span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
