import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Archive, Check, Copy, FolderInput, Globe, MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Bookmark } from "@/types";
import { cn } from "@/utils/cn";

export function BookmarkItem({
  bookmark,
  view,
  compact,
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
  compact: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onMove: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(bookmark.url);
      setCopied(true);
      toast.success("URL copied.");
    } catch {
      toast.error("Couldn't copy the URL.");
    }
  }

  const body = (
    <>
      <BookmarkFavicon bookmark={bookmark} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{bookmark.title}</p>
          {!compact && bookmark.is_favorite ? (
            <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-label="Favorite" />
          ) : null}
        </div>
        {compact ? null : (
          <>
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
          </>
        )}
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "group relative flex gap-3 rounded-2xl border border-line bg-paper-raised shadow-card",
        compact ? "items-center p-2.5" : "p-4",
        view === "grid" && !compact && "h-full flex-col",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn("flex min-w-0 flex-1 gap-3 text-left", compact ? "items-center" : "items-start")}
      >
        {body}
      </button>
      <div className={cn("flex gap-1", compact ? "items-center" : "items-start")}>
        <button
          type="button"
          className="rounded-md p-1.5 text-ink-faint hover:bg-paper-sunken hover:text-accent"
          aria-label="Copy URL"
          onClick={() => void copyUrl()}
        >
          {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
        </button>
        <button
          type="button"
          className="rounded-md p-1.5 text-ink-faint hover:bg-paper-sunken hover:text-accent"
          aria-label={bookmark.is_favorite ? "Remove favorite" : "Add favorite"}
          onClick={onFavorite}
        >
          <Star className={cn("h-4 w-4", bookmark.is_favorite && "fill-accent text-accent")} />
        </button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="rounded-md p-1.5 text-ink-faint hover:bg-paper-sunken hover:text-ink"
              aria-label="Bookmark actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 min-w-40 rounded-xl border border-line bg-paper-raised p-1 shadow-card">
              <MenuItem icon={<Copy className="h-4 w-4" />} onSelect={() => void copyUrl()}>
                Copy URL
              </MenuItem>
              <MenuItem icon={<Pencil className="h-4 w-4" />} onSelect={onEdit}>
                Edit
              </MenuItem>
              <MenuItem icon={<FolderInput className="h-4 w-4" />} onSelect={onMove}>
                Move
              </MenuItem>
              <MenuItem icon={<Star className="h-4 w-4" />} onSelect={onFavorite}>
                {bookmark.is_favorite ? "Remove favorite" : "Add favorite"}
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

function faviconCandidates(bookmark: Bookmark): string[] {
  const urls: string[] = [];
  const add = (value: string | null | undefined) => {
    if (!value || value.includes("/logo.") || urls.includes(value)) return;
    urls.push(value);
  };
  add(bookmark.favicon_url);
  let host = bookmark.page_domain;
  if (!host) {
    try {
      host = new URL(bookmark.url).hostname;
    } catch {
      host = null;
    }
  }
  if (host) {
    add(`https://${host}/favicon.ico`);
    add(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`);
  }
  return urls;
}

function BookmarkFavicon({ bookmark }: { bookmark: Bookmark }) {
  const candidates = useMemo(
    () => faviconCandidates(bookmark),
    [bookmark.favicon_url, bookmark.page_domain, bookmark.url],
  );
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [bookmark.id, candidates]);
  const src = candidates[index];
  if (!src) {
    return <Globe className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden />;
  }
  return (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      className="h-5 w-5 shrink-0 rounded-sm"
      onError={() => setIndex((current) => current + 1)}
    />
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
