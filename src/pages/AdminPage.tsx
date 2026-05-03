import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  createTag,
  deleteTag,
  getTagUsageCount,
  getTags,
  isCurrentUserAdmin,
  type Tag,
  updateTag,
} from "../lib/tagsService";

type TagUsageMap = Record<number, number>;

const DEFAULT_COLOR = "#2563eb";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tags, setTags] = useState<Tag[]>([]);
  const [usageByTagId, setUsageByTagId] = useState<TagUsageMap>({});

  const [creating, setCreating] = useState(false);
  const [createLabel, setCreateLabel] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createUseColor, setCreateUseColor] = useState(false);
  const [createColor, setCreateColor] = useState(DEFAULT_COLOR);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editUseColor, setEditUseColor] = useState(false);
  const [editColor, setEditColor] = useState(DEFAULT_COLOR);

  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTags = async () => {
    const allTags = await getTags();
    setTags(allTags);

    const usageEntries = await Promise.all(
      allTags.map(
        async (tag) => [tag.id, await getTagUsageCount(tag.id)] as const,
      ),
    );

    setUsageByTagId(Object.fromEntries(usageEntries));
  };

  useEffect(() => {
    const loadAdminState = async () => {
      setLoading(true);
      setError(null);

      try {
        const admin = await isCurrentUserAdmin();
        setIsAdmin(admin);

        if (!admin) {
          return;
        }

        await loadTags();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load admin page",
        );
      } finally {
        setLoading(false);
      }
    };

    loadAdminState();
  }, []);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!createLabel.trim()) {
      setError("Tag label is required");
      return;
    }

    setCreating(true);

    try {
      await createTag({
        label: createLabel.trim(),
        description: createDescription,
        color: createUseColor ? createColor : "",
      });

      setCreateLabel("");
      setCreateDescription("");
      setCreateUseColor(false);
      setCreateColor(DEFAULT_COLOR);

      await loadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (tag: Tag) => {
    setEditingId(tag.id);
    setEditLabel(tag.label);
    setEditDescription(tag.description ?? "");
    setEditUseColor(!!tag.color);
    setEditColor(tag.color ?? DEFAULT_COLOR);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditLabel("");
    setEditDescription("");
    setEditUseColor(false);
    setEditColor(DEFAULT_COLOR);
  };

  const handleUpdateTag = async (tagId: number) => {
    setError(null);

    if (!editLabel.trim()) {
      setError("Tag label is required");
      return;
    }

    try {
      await updateTag(tagId, {
        label: editLabel.trim(),
        description: editDescription,
        color: editUseColor ? editColor : "",
      });

      cancelEditing();
      await loadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tag");
    }
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) {
      return;
    }

    setError(null);
    setDeleting(true);

    try {
      await deleteTag(tagToDelete.id);
      setTagToDelete(null);
      await loadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tag");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading admin page...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You do not have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin: Tag Management</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-tag-label">Label</Label>
                  <Input
                    id="new-tag-label"
                    value={createLabel}
                    onChange={(e) => setCreateLabel(e.target.value)}
                    placeholder="Tag label"
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-tag-description">Description</Label>
                  <Input
                    id="new-tag-description"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Optional description"
                    disabled={creating}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={createUseColor}
                    onChange={(e) => setCreateUseColor(e.target.checked)}
                    disabled={creating}
                  />
                  Use custom color
                </label>
                {createUseColor && (
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={createColor}
                      onChange={(e) => setCreateColor(e.target.value)}
                      disabled={creating}
                      className="h-10 w-20 p-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      {createColor}
                    </span>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create tag"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags found.</p>
            ) : (
              <div className="space-y-3">
                {tags.map((tag) => {
                  const usage = usageByTagId[tag.id] ?? 0;
                  const isEditing = editingId === tag.id;

                  return (
                    <div
                      key={tag.id}
                      className="rounded-md border p-3 space-y-3"
                    >
                      {!isEditing ? (
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 rounded-full border"
                                style={{
                                  backgroundColor: tag.color ?? "transparent",
                                }}
                              />
                              <p className="font-medium">{tag.label}</p>
                            </div>
                            {tag.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {tag.description}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-muted-foreground">
                              Used by {usage} task{usage === 1 ? "" : "s"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(tag)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setTagToDelete(tag)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Label</Label>
                              <Input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Input
                                value={editDescription}
                                onChange={(e) =>
                                  setEditDescription(e.target.value)
                                }
                                placeholder="Optional description"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={editUseColor}
                                onChange={(e) =>
                                  setEditUseColor(e.target.checked)
                                }
                              />
                              Use custom color
                            </label>
                            {editUseColor && (
                              <div className="flex items-center gap-3">
                                <Input
                                  type="color"
                                  value={editColor}
                                  onChange={(e) => setEditColor(e.target.value)}
                                  className="h-10 w-20 p-1"
                                />
                                <span className="text-sm text-muted-foreground">
                                  {editColor}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateTag(tag.id)}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditing}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!tagToDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setTagToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{tagToDelete?.label}"? This will
              also remove the tag from{" "}
              {tagToDelete ? (usageByTagId[tagToDelete.id] ?? 0) : 0} task
              {tagToDelete && (usageByTagId[tagToDelete.id] ?? 0) === 1
                ? ""
                : "s"}
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTagToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
