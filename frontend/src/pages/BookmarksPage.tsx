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
      emptyTitle={search ? "No Bookmarks Match Your Search." : "You Haven't Saved Any Bookmarks Yet."}
      emptyDescription={
        search
          ? "Try A Different Title, URL, Note, Or Tag."
          : "Add Your First Bookmark To Start Building Your Collection."
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
      emptyTitle="No Favorites Yet."
      emptyDescription="Star A Bookmark To Keep It Close At Hand."
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
      emptyTitle="Nothing Here Yet."
      emptyDescription="New And Revisited Pages Will Appear In This List."
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
      emptyTitle="The Archive Is Empty."
      emptyDescription="Archived Bookmarks Are Hidden From Your Regular Folders Until You Restore Them."
      filters={{ archived: true, search: params.get("q") ?? undefined }}
    />
  );
}

export function FolderPage() {
  const { id } = useParams();
  const folders = useQuery({ queryKey: ["folders"], queryFn: listFolders });
  const folder = folders.data?.find((item) => item.id === id);
  const [params] = useSearchParams();
  return (
    <BookmarkCollection
      title={folder?.name ?? "Folder"}
      emptyTitle="This Folder Is Empty."
      emptyDescription="Move A Bookmark Here Or Add A New One."
      filters={{ folder_id: id, archived: false, search: params.get("q") ?? undefined }}
    />
  );
}
