import { useEffect, useState } from "react";
import type { Folder } from "@/types";

export const FOLDER_SORT_KEY = "neshanak.folderSort";
const FOLDER_SORT_EVENT = "neshanak-folder-sort";

export type FolderSort = "name" | "created_at";

export function isFolderSort(value: string | null): value is FolderSort {
  return value === "name" || value === "created_at";
}

export function folderSortFromStorage(): FolderSort {
  try {
    const value = localStorage.getItem(FOLDER_SORT_KEY);
    if (isFolderSort(value)) return value;
  } catch {
    /* private mode */
  }
  return "created_at";
}

export function compareFolders(a: Folder, b: Folder, sort: FolderSort): number {
  const byName = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  if (sort === "name") return byName;
  return b.created_at.localeCompare(a.created_at) || byName;
}

export function sortedFolders<T extends Folder>(folders: T[], sort: FolderSort): T[] {
  return [...folders].sort((a, b) => compareFolders(a, b, sort));
}

export function useFolderSort(): [FolderSort, (next: FolderSort) => void] {
  const [sort, setSort] = useState<FolderSort>(folderSortFromStorage);

  useEffect(() => {
    const sync = () => setSort(folderSortFromStorage());
    window.addEventListener(FOLDER_SORT_EVENT, sync);
    return () => window.removeEventListener(FOLDER_SORT_EVENT, sync);
  }, []);

  function update(next: FolderSort) {
    try {
      localStorage.setItem(FOLDER_SORT_KEY, next);
    } catch {
      /* private mode */
    }
    setSort(next);
    window.dispatchEvent(new Event(FOLDER_SORT_EVENT));
  }

  return [sort, update];
}
