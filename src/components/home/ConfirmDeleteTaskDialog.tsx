import { useTasks } from "../../hooks/useTasks";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export default function ConfirmDeleteTaskDialog() {
  const { taskToDelete, cancelDeleteTask, confirmDeleteTask } = useTasks();

  return (
    <Dialog
      open={!!taskToDelete}
      onOpenChange={(open) => !open && cancelDeleteTask()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete task</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              "{taskToDelete?.title}"
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={cancelDeleteTask}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDeleteTask}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
