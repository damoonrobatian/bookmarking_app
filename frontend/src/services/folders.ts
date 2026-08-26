import { apiFetch } from "@/services/api";
import type { Folder } from "@/types";

export function listFolders() {
  return apiFetch<Folder[]>("/api/folders");
}

export function createFolder(payload: { name: string; parent_id?: string | null }) {
  return apiFetch<Folder>("/api/folders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateFolder(id: string, payload: { name?: string; position?: number }) {
  return apiFetch<Folder>(`/api/folders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteFolder(id: string) {
  return apiFetch<void>(`/api/folders/${id}`, { method: "DELETE" });
}

export function moveFolder(id: string, parent_id: string | null) {
  return apiFetch<Folder>(`/api/folders/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ parent_id }),
  });
}
