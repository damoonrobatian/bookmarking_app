import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, List } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkFormDialog } from "@/features/bookmarks/BookmarkFormDialog";
import { BookmarkItem } from "@/features/bookmarks/BookmarkItem";
import { MoveBookmarkDialog } from "@/features/bookmarks/MoveBookmarkDialog";
import {
  archiveBookmark,
  deleteBookmark,
  listBookmarks,
  restoreBookmark,
  updateBookmark,
  visitBookmark,
} from "@/services/bookmarks";
import type { Bookmark, BookmarkFilters } from "@/types";
import { Button } from "@/components/ui/button";

const VIEW_KEY = "neshanak.view";

export function BookmarkCollection({
  title,
  emptyTitle,
  emptyDescription,
  filters,
}: {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  filters: BookmarkFilters;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const sort = (searchParams.get("sort") as BookmarkFilters["sort"]) ?? filters.sort ?? "created_at";
  const [view, setView] = useState<"list" | "grid">(
    () => (localStorage.getItem(VIEW_KEY) as "list" | "grid") || "list",
  );
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [moving, setMoving] = useState<Bookmark | null>(null);
  const [deleting, setDeleting] = useState<Bookmark | null>(null);
  const queryClient = useQueryClient();
  const queryFilters = { ...filters, page, page_size: 50, sort, order: "desc" as const };
  const bookmarks = useQuery({
    queryKey: ["bookmarks", queryFilters],
    queryFn: () => listBookmarks(queryFilters),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
  const favorite = useMutation({
    mutationFn: (bookmark: Bookmark) =>
      updateBookmark(bookmark.id, { is_favorite: !bookmark.is_favorite }),
    onSuccess: invalidate,
  });
  const archive = useMutation({ mutationFn: archiveBookmark, onSuccess: invalidate });
  const restore = useMutation({ mutationFn: restoreBookmark, onSuccess: invalidate });
  const remove = useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () => {
      invalidate();
      setDeleting(null);
    },
  });
  const saveEdit = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateBookmark(id, payload),
    onSuccess: invalidate,
  });

  const items = bookmarks.data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((bookmarks.data?.total ?? 0) / 50));
  const layoutClass = useMemo(
    () => (view === "grid" ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"),
    [view],
  );

  function changeView(next: "list" | "grid") {
    setView(next);
    localStorage.setItem(VIEW_KEY, next);
  }

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {bookmarks.data ? `${bookmarks.data.total} Saved` : "Loading Your Library"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="sort">
            Sort
          </label>
          <select
            id="sort"
            className="h-9 rounded-lg border border-line bg-paper-raised px-2 text-sm"
            value={sort}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams);
              next.set("sort", event.target.value);
              next.set("page", "1");
              setSearchParams(next);
            }}
          >
            <option value="created_at">Recently Added</option>
            <option value="last_visited_at">Recently Visited</option>
            <option value="title">Title</option>
            <option value="visit_count">Most Visited</option>
          </select>
          <div className="flex rounded-lg border border-line bg-paper-raised p-0.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label="List View"
              aria-pressed={view === "list"}
              onClick={() => changeView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Grid View"
              aria-pressed={view === "grid"}
              onClick={() => changeView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {bookmarks.isLoading ? (
        <div className={layoutClass}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : bookmarks.isError ? (
        <p role="alert" className="rounded-2xl border border-line bg-paper-raised p-8 text-ink-muted">
          Unable To Load Bookmarks. The Server May Be Unavailable.
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper-raised px-6 py-16 text-center">
          <h2 className="font-serif text-2xl">{emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-muted">{emptyDescription}</p>
        </div>
      ) : (
        <div className={layoutClass}>
          {items.map((bookmark) => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              view={view}
              onOpen={() => {
                window.open(bookmark.url, "_blank", "noopener,noreferrer");
                void visitBookmark(bookmark.id).then(invalidate);
              }}
              onEdit={() => setEditing(bookmark)}
              onMove={() => setMoving(bookmark)}
              onFavorite={() => favorite.mutate(bookmark)}
              onArchive={() => archive.mutate(bookmark.id)}
              onRestore={() => restore.mutate(bookmark.id)}
              onDelete={() => setDeleting(bookmark)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(page - 1));
              setSearchParams(next);
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-ink-muted">
            Page {page} Of {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(page + 1));
              setSearchParams(next);
            }}
          >
            Next
          </Button>
        </div>
      ) : null}

      <BookmarkFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        bookmark={editing}
        title="Edit Bookmark"
        onSubmit={(payload) => saveEdit.mutateAsync({ id: editing!.id, payload })}
      />
      <MoveBookmarkDialog bookmark={moving} onClose={() => setMoving(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete Bookmark?"
        description="This Permanently Removes The Bookmark From Your Library. Consider Archiving It Instead If You Might Need It Later."
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </section>
  );
}
