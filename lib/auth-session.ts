import type { AppUserRole } from "@/lib/mock-users";
import { SESSION_SNAPSHOT_COOKIE } from "@/lib/auth-constants";

export const SESSION_UPDATED_EVENT = "pos-session-updated";

export type SessionUser = {
  userId: string;
  name: string;
  role: AppUserRole;
};

function decodeSnapshotCookie(value: string) {
  try {
    const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
    const paddedValue = normalizedValue.padEnd(
      normalizedValue.length + ((4 - (normalizedValue.length % 4)) % 4),
      "="
    );

    return JSON.parse(atob(paddedValue)) as SessionUser;
  } catch {
    return null;
  }
}

function readSessionCookie() {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split("; ");
  const rawCookie = cookies.find((cookie) => cookie.startsWith(`${SESSION_SNAPSHOT_COOKIE}=`));
  const cookieValue = rawCookie?.split("=").slice(1).join("=");

  if (!cookieValue) return null;
  return decodeSnapshotCookie(cookieValue);
}

export function readSession(): SessionUser | null {
  return readSessionCookie();
}

export function writeSession(user: SessionUser) {
  if (typeof document === "undefined") return;

  const value = btoa(JSON.stringify(user))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  document.cookie = `${SESSION_SNAPSHOT_COOKIE}=${value}; Path=/; SameSite=Lax`;
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

export function clearSession() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_SNAPSHOT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}
