import { mockUsers, type AppUser } from "@/lib/mock-users";

const USERS_KEY = "pos_users";

export function readUsers(): AppUser[] {
  if (typeof window === "undefined") return [...mockUsers];

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [...mockUsers];

    const parsed = JSON.parse(raw) as AppUser[];
    if (!Array.isArray(parsed) || !parsed.length) return [...mockUsers];
    return parsed;
  } catch {
    return [...mockUsers];
  }
}

export function writeUsers(users: AppUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function updateUserById(
  currentUserId: string,
  payload: Partial<AppUser> & Pick<AppUser, "userId" | "name" | "password" | "role">
): AppUser[] {
  const users = readUsers();
  const nextUsers = users.map((user) =>
    user.userId === currentUserId ? { ...user, ...payload } : user
  );
  writeUsers(nextUsers);
  return nextUsers;
}
