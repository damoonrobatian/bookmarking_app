import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/features/tags/TagInput";
import { useDebounce } from "@/hooks/useDebounce";
import { createBookmark, previewBookmark } from "@/services/bookmarks";
import { listFolders } from "@/services/folders";
import { listTags } from "@/services/tags";
import type { ApiError, Bookmark } from "@/types";

export function BookmarkFormDialog({
  open,
  onOpenChange,
  bookmark,
  onSubmit,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark?: Bookmark | null;
  title: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<unknown>;
}) {
  const [url, setUrl] = useState(bookmark?.url ?? "");
  const [bookmarkTitle, setBookmarkTitle] = useState(bookmark?.title ?? "");
  const [description, setDescription] = useState(bookmark?.description ?? "");
  const [notes, setNotes] = useState(bookmark?.notes ?? "");
  const [folderId, setFolderId] = useState(bookmark?.folder_id ?? "");
  const [tags, setTags] = useState(bookmark?.tags.map((tag) => tag.name) ?? []);
  const [favorite, setFavorite] = useState(bookmark?.is_favorite ?? false);
  const [error, setError] = useState<ApiError | null>(null);
  const [titleTouched, setTitleTouched] = useState(Boolean(bookmark));
  const debouncedUrl = useDebounce(url, 500);
  const folders = useQuery({ queryKey: ["folders"], queryFn: listFolders, enabled: open });
  const tagList = useQuery({ queryKey: ["tags"], queryFn: listTags, enabled: open });
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setUrl(bookmark?.url ?? "");
    setBookmarkTitle(bookmark?.title ?? "");
    setDescription(bookmark?.description ?? "");
    setNotes(bookmark?.notes ?? "");
    setFolderId(bookmark?.folder_id ?? "");
    setTags(bookmark?.tags.map((tag) => tag.name) ?? []);
    setFavorite(bookmark?.is_favorite ?? false);
    setError(null);
    setTitleTouched(Boolean(bookmark));
  }, [open, bookmark]);

  useEffect(() => {
    if (!open || bookmark || !debouncedUrl.startsWith("http")) return;
    let cancelled = false;
    previewBookmark(debouncedUrl)
      .then((preview) => {
        if (cancelled) return;
        if (!titleTouched && preview.title) setBookmarkTitle(preview.title);
        if (!description && preview.description) setDescription(preview.description);
      })
      .catch(() => {
        if (!cancelled) setError({ status: 0, message: "Unable to retrieve page information." });
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedUrl, open, bookmark, titleTouched, description]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit({
        url,
        title: bookmarkTitle || undefined,
        description: description || null,
        notes: notes || null,
        folder_id: folderId || null,
        tags,
        is_favorite: favorite,
        fetch_metadata: !bookmark,
      });
      onOpenChange(false);
    } catch (caught) {
      setError(caught as ApiError);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Save a page to your library. Title and favicon can be filled in automatically."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="bookmark-url">URL</Label>
          <Input
            id="bookmark-url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bookmark-title">Title</Label>
          <Input
            id="bookmark-title"
            value={bookmarkTitle}
            onChange={(event) => {
              setTitleTouched(true);
              setBookmarkTitle(event.target.value);
            }}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bookmark-folder">Folder</Label>
            <select
              id="bookmark-folder"
              className="h-10 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm"
              value={folderId}
              onChange={(event) => setFolderId(event.target.value)}
            >
              <option value="">No folder</option>
              {(Array.isArray(folders.data) ? folders.data : []).map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
          <label className="mt-7 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={favorite}
              onChange={(event) => setFavorite(event.target.checked)}
            />
            Favorite
          </label>
        </div>
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <TagInput value={tags} onChange={setTags} suggestions={tagList.data ?? []} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bookmark-description">Description</Label>
          <Textarea
            id="bookmark-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What this page is about"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bookmark-notes">Notes</Label>
          <Textarea
            id="bookmark-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Your private notes"
          />
        </div>
        {error ? (
          <div role="alert" className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-hover">
            <p>{error.message}</p>
            {error.duplicate ? (
              <button
                type="button"
                className="mt-1 font-medium underline"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/app?highlight=${error.duplicate?.id}`);
                }}
              >
                Open the existing bookmark
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Save bookmark</Button>
        </div>
      </form>
    </Modal>
  );
}

export function AddBookmarkDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
  return (
    <BookmarkFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add bookmark"
      onSubmit={(payload) => mutation.mutateAsync(payload)}
    />
  );
}
