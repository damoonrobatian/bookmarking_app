import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/features/tags/TagInput";
import { errorMessage } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { createBookmark, previewBookmark } from "@/services/bookmarks";
import { createFolder, listFolders } from "@/services/folders";
import { listTags } from "@/services/tags";
import type { ApiError, Bookmark } from "@/types";
import { sortedFolders, useFolderSort } from "@/utils/folderSort";
import { displayTitle, looksLikeKeywordList } from "@/utils/title";

export function BookmarkFormDialog({
  open,
  onOpenChange,
  bookmark,
  onSubmit,
  title,
  initialUrl = "",
  initialTitle = "",
  variant = "dialog",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark?: Bookmark | null;
  title: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<unknown>;
  initialUrl?: string;
  initialTitle?: string;
  variant?: "dialog" | "page";
}) {
  const [url, setUrl] = useState(bookmark?.url ?? initialUrl);
  const [bookmarkTitle, setBookmarkTitle] = useState(displayTitle(bookmark?.title ?? initialTitle));
  const [description, setDescription] = useState(bookmark?.description ?? "");
  const [notes, setNotes] = useState(bookmark?.notes ?? "");
  const [folderId, setFolderId] = useState(bookmark?.folder_id ?? "");
  const [tags, setTags] = useState(bookmark?.tags.map((tag) => tag.name) ?? []);
  const [favorite, setFavorite] = useState(bookmark?.is_favorite ?? false);
  const [error, setError] = useState<ApiError | null>(null);
  const [titleTouched, setTitleTouched] = useState(Boolean(bookmark));
  const [tagsTouched, setTagsTouched] = useState(Boolean(bookmark));
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);
  const debouncedUrl = useDebounce(url, 500);
  const queryClient = useQueryClient();
  const folders = useQuery({ queryKey: ["folders"], queryFn: listFolders, enabled: open });
  const [folderSort] = useFolderSort();
  const tagList = useQuery({ queryKey: ["tags"], queryFn: listTags, enabled: open });
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setUrl(bookmark?.url ?? initialUrl);
    setBookmarkTitle(displayTitle(bookmark?.title ?? initialTitle));
    setDescription(bookmark?.description ?? "");
    setNotes(bookmark?.notes ?? "");
    setFolderId(bookmark?.folder_id ?? "");
    setTags(bookmark?.tags.map((tag) => tag.name) ?? []);
    setFavorite(bookmark?.is_favorite ?? false);
    setError(null);
    setTitleTouched(Boolean(bookmark));
    setTagsTouched(Boolean(bookmark));
    setCreatingFolder(false);
    setNewFolderName("");
    setFolderError(null);
  }, [open, bookmark, initialUrl, initialTitle]);

  useEffect(() => {
    if (!open || bookmark || !debouncedUrl.startsWith("http")) return;
    let cancelled = false;
    previewBookmark(debouncedUrl)
      .then((preview) => {
        if (cancelled) return;
        if (!titleTouched && preview.title) {
          setBookmarkTitle((current) => {
            if (!current.trim() || looksLikeKeywordList(current)) {
              return displayTitle(preview.title ?? "");
            }
            return current;
          });
        }
        if (!description && preview.description) setDescription(preview.description);
        if (!tagsTouched && preview.suggested_tags?.length) setTags(preview.suggested_tags);
      })
      .catch(() => {
        /* Preview is best-effort; URL and title already in the form are enough to save. */
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedUrl, open, bookmark, titleTouched, description, tagsTouched]);

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    setFolderError(null);
    try {
      const folder = await createFolder({ name });
      queryClient.setQueryData(["folders"], (current: unknown) => {
        const list = Array.isArray(current) ? current : [];
        if (list.some((item: { id: string }) => item.id === folder.id)) return list;
        return [...list, folder];
      });
      await queryClient.invalidateQueries({ queryKey: ["folders"] });
      setFolderId(folder.id);
      setNewFolderName("");
      setCreatingFolder(false);
    } catch (caught) {
      setFolderError(errorMessage(caught, "Unable to create folder."));
    }
  }

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

  const form = (
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
              <option value="">No Folder</option>
              {sortedFolders(Array.isArray(folders.data) ? folders.data : [], folderSort).map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            {creatingFolder ? (
              <div className="flex gap-2">
                <Input
                  aria-label="New folder name"
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  placeholder="Folder name"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleCreateFolder();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => void handleCreateFolder()}>
                  Add
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="text-sm font-medium text-accent hover:underline"
                onClick={() => setCreatingFolder(true)}
              >
                New folder
              </button>
            )}
            {folderError ? <p className="text-sm text-red-700">{folderError}</p> : null}
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
          <TagInput value={tags} onChange={(next) => { setTagsTouched(true); setTags(next); }} suggestions={tagList.data ?? []} />
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
  );

  if (variant === "page") {
    return form;
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Save a page to your library. Title and favicon can be filled in automatically."
      className="max-w-xl"
    >
      {form}
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
      title="Add Bookmark"
      onSubmit={(payload) => mutation.mutateAsync(payload)}
    />
  );
}
