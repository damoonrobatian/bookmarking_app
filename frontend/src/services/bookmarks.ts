import { apiFetch } from "@/services/api";
import type { Bookmark, BookmarkFilters, BookmarkPreview, Paginated } from "@/types";

export function listBookmarks(filters: BookmarkFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return apiFetch<Paginated<Bookmark>>(`/api/bookmarks${query ? `?${query}` : ""}`);
}

export function createBookmark(payload: Record<string, unknown>) {
  return apiFetch<Bookmark>("/api/bookmarks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBookmark(id: string, payload: Record<string, unknown>) {
  return apiFetch<Bookmark>(`/api/bookmarks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteBookmark(id: string) {
  return apiFetch<void>(`/api/bookmarks/${id}`, { method: "DELETE" });
}

export function visitBookmark(id: string) {
  return apiFetch<Bookmark>(`/api/bookmarks/${id}/visit`, { method: "POST" });
}

export function archiveBookmark(id: string) {
  return apiFetch<Bookmark>(`/api/bookmarks/${id}/archive`, { method: "POST" });
}

export function restoreBookmark(id: string) {
  return apiFetch<Bookmark>(`/api/bookmarks/${id}/restore`, { method: "POST" });
}

export function previewBookmark(url: string) {
  return apiFetch<BookmarkPreview>("/api/bookmarks/preview", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}
