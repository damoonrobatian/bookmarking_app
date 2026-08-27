import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Archive, MoreHorizontal, Pencil, Star, Trash2, FolderInput } from "lucide-react";
import type { ReactNode } from "react";
import type { Bookmark } from "@/types";
import { cn } from "@/utils/cn";

export function BookmarkItem({
  bookmark,
  view,
  onOpen,
  onEdit,
  onMove,
  onFavorite,
  onArchive,
  onRestore,
  onDelete,
}: {
  bookmark: Bookmark;
  view: "list" | "grid";
  onOpen: () => void;
  onEdit: () => void;
  onMove: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const body = (
    <>
      <img
        src={bookmark.favicon_url || "/favicon.svg"}
        alt=""
        className="h-5 w-5 rounded-sm"
        onError={(event) => {
          event.currentTarget.src = "/favicon.svg";
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{bookmark.title}</p>
          {bookmark.is_favorite ? (
            <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-label="Favorite" />
          ) : null}
        </div>
        <p className="truncate text-xs text-ink-muted">
          {bookmark.page_domain ?? bookmark.url}
          {bookmark.folder ? ` · ${bookmark.folder.name}` : ""}
        </p>
        {bookmark.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{bookmark.description}</p>
        ) : null}
        {bookmark.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {bookmark.tags.map((tag) => (
              <span key={tag.id} className="rounded-full bg-paper-sunken px-2 py-0.5 text-[11px] text-ink-muted">
                {tag.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "group relative flex gap-3 rounded-2xl border border-line bg-paper-raised p-4 shadow-card",
        view === "grid" && "h-full flex-col",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        {body}
      </button>
      <div className="flex items-start gap-1">
        <button
          type="button"
          className="rounded-md p-1.5 text-ink-faint hover:bg-paper-sunken hover:text-accent"
          aria-label={bookmark.is_favorite ? "Remove Favorite" : "Add Favorite"}
          onClick={onFavorite}
        >
          <Star className={cn("h-4 w-4", bookmark.is_favorite && "fill-accent text-accent")} />
        </button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="rounded-md p-1.5 text-ink-faint hover:bg-paper-sunken hover:text-ink"
              aria-label="Bookmark Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 min-w-40 rounded-xl border border-line bg-paper-raised p-1 shadow-card">
              <MenuItem icon={<Pencil className="h-4 w-4" />} onSelect={onEdit}>
                Edit
              </MenuItem>
              <MenuItem icon={<FolderInput className="h-4 w-4" />} onSelect={onMove}>
                Move
              </MenuItem>
              <MenuItem icon={<Star className="h-4 w-4" />} onSelect={onFavorite}>
                {bookmark.is_favorite ? "Remove Favorite" : "Add Favorite"}
              </MenuItem>
              {bookmark.is_archived ? (
                <MenuItem icon={<Archive className="h-4 w-4" />} onSelect={onRestore}>
                  Restore
                </MenuItem>
              ) : (
                <MenuItem icon={<Archive className="h-4 w-4" />} onSelect={onArchive}>
                  Archive
                </MenuItem>
              )}
              <MenuItem icon={<Trash2 className="h-4 w-4" />} onSelect={onDelete} danger>
                Delete
              </MenuItem>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </article>
  );
}

function MenuItem({
  children,
  icon,
  onSelect,
  danger,
}: {
  children: string;
  icon: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}) {
  return (
    <DropdownMenu.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none hover:bg-paper-sunken",
        danger && "text-red-700",
      )}
      onSelect={onSelect}
    >
      {icon}
      {children}
    </DropdownMenu.Item>
  );
}
