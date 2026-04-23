import type { AppUserRole } from "@/lib/mock-users";

export const SESSION_KEY = "pos_session";
export const SESSION_UPDATED_EVENT = "pos-session-updated";

export type SessionUser = {
  userId: string;
  name: string;
  role: AppUserRole;
};

export function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function writeSession(user: SessionUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}
