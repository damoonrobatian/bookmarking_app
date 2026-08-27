import { apiFetch } from "@/services/api";
import type { ImportReport, Tag } from "@/types";

export function listTags() {
  return apiFetch<Tag[]>("/api/tags");
}

export function createTag(name: string) {
  return apiFetch<Tag>("/api/tags", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function importBookmarks(file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<ImportReport>("/api/import/bookmarks", { method: "POST", body });
}

export async function exportBookmarks() {
  const response = await fetch("/api/export/bookmarks", { credentials: "include" });
  if (!response.ok) throw new Error("Unable To Export Bookmarks.");
  return response.blob();
}
