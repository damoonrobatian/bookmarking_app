import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { BookmarkCollection } from "@/features/bookmarks/BookmarkCollection";
import { listFolders } from "@/services/folders";

export function BookmarksPage() {
  const [params] = useSearchParams();
  const search = params.get("q") ?? undefined;
  const tag = params.get("tag") ?? undefined;
  return (
    <BookmarkCollection
      title={tag ? `Tag · ${tag}` : search ? "Search" : "All Bookmarks"}
      emptyTitle={search ? "No bookmarks match your search." : "You haven't saved any bookmarks yet."}
      emptyDescription={
        search
          ? "Try a different title, URL, note, or tag."
          : "Add your first bookmark to start building your collection."
      }
      filters={{ search, tag, archived: false }}
    />
  );
}

export function FavoritesPage() {
  const [params] = useSearchParams();
  return (
    <BookmarkCollection
      title="Favorites"
      emptyTitle="No favorites yet."
      emptyDescription="Star a bookmark to keep it close at hand."
      filters={{ favorite: true, archived: false, search: params.get("q") ?? undefined }}
    />
  );
}

export function RecentPage() {
  const [params] = useSearchParams();
  const view = params.get("view") === "visited" ? "visited" : "added";
  return (
    <BookmarkCollection
      title={view === "visited" ? "Recently Visited" : "Recently Added"}
      emptyTitle="Nothing here yet."
      emptyDescription="New and revisited pages will appear in this list."
      filters={{
        archived: false,
        search: params.get("q") ?? undefined,
        recent: view,
        sort: view === "visited" ? "last_visited_at" : "created_at",
      }}
    />
  );
}

export function ArchivePage() {
  const [params] = useSearchParams();
  return (
    <BookmarkCollection
      title="Archive"
      emptyTitle="The archive is empty."
      emptyDescription="Archived bookmarks are hidden from your regular folders until you restore them."
      filters={{ archived: true, search: params.get("q") ?? undefined }}
    />
  );
}

export function FolderPage() {
  const { id } = useParams();
  const folders = useQuery({ queryKey: ["folders"], queryFn: listFolders });
  const folder = folders.data?.find((item) => item.id === id);
  const [params] = useSearchParams();
  const tag = params.get("tag") ?? undefined;
  return (
    <BookmarkCollection
      title={tag ? `${folder?.name ?? "Folder"} · ${tag}` : folder?.name ?? "Folder"}
      emptyTitle="This folder is empty."
      emptyDescription="Move a bookmark here or add a new one."
      filters={{ folder_id: id, tag, archived: false, search: params.get("q") ?? undefined }}
    />
  );
}
