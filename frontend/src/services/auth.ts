import { apiFetch } from "@/services/api";
import type { User } from "@/types";

export function register(payload: {
  email: string;
  password: string;
  display_name: string;
}) {
  return apiFetch<User>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: { email: string; password: string; remember_me?: boolean }) {
  return apiFetch<User>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ remember_me: false, ...payload }),
  });
}

export function logout() {
  return apiFetch<void>("/api/auth/logout", { method: "POST" });
}

export function me() {
  return apiFetch<User>("/api/auth/me");
}
