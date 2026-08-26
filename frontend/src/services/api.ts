import type { ApiError } from "@/types";

async function parseError(response: Response, path: string): Promise<ApiError> {
  let message = "Something went wrong.";
  let duplicate;
  try {
    const body = await response.json();
    const detail = body.detail;
    if (typeof detail === "string") {
      message = detail;
    } else if (detail?.message) {
      message = detail.message;
      duplicate = detail.existing;
    } else if (Array.isArray(detail) && detail[0]?.msg) {
      message = detail[0].msg;
    }
  } catch {
    if (response.status >= 500) message = "Server unavailable.";
  }
  const authForm = path.includes("/api/auth/login") || path.includes("/api/auth/register");
  if (response.status === 401 && !authForm) message = "Session expired.";
  return { status: response.status, message, duplicate };
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });
  if (response.status === 401 && !path.includes("/api/auth/")) {
    const refreshed = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      const retry = await fetch(path, { ...init, headers, credentials: "include" });
      if (!retry.ok) throw await parseError(retry, path);
      if (retry.status === 204) return undefined as T;
      return (await retry.json()) as T;
    }
  }
  if (!response.ok) throw await parseError(response, path);
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html") || contentType.includes("text/plain")) {
    return (await response.text()) as T;
  }
  return (await response.json()) as T;
}
