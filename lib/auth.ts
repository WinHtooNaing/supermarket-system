import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import db from "@/db";
import { users } from "@/db/schema";
import {
  AUTH_COOKIE_NAME,
  POS_USERS_COOKIE,
  SESSION_SNAPSHOT_COOKIE,
} from "@/lib/auth-constants";
import {
  mockUsers,
  type AppUser,
  type AppUserRole,
} from "@/lib/mock-users";
const SESSION_MAX_AGE = 60 * 60 * 12;

export type AuthSession = {
  userId: string;
  name: string;
  role: AppUserRole;
  exp: number;
};

type SessionSnapshot = Omit<AuthSession, "exp">;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET ?? process.env.DATABASE_URL;

  if (!secret) {
    throw new Error(
      "Missing SESSION_SECRET. Add SESSION_SECRET to your environment before using auth."
    );
  }

  return secret;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function readPosUsersCookie(rawValue?: string | null) {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(decodeBase64Url(rawValue)) as AppUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function createAuthToken(session: SessionSnapshot) {
  const payload = JSON.stringify({
    ...session,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  } satisfies AuthSession);

  const encodedPayload = encodeBase64Url(payload);
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token?: string | null) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const isValid =
    expectedSignature.length === signature.length &&
    timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

  if (!isValid) return null;

  try {
    const session = JSON.parse(decodeBase64Url(encodedPayload)) as AuthSession;

    if (!session.userId || !session.name || !session.role) {
      return null;
    }

    if (session.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getServerSession() {
  const cookieStore = await cookies();
  return verifyAuthToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export async function setAuthCookies(session: SessionSnapshot) {
  const cookieStore = await cookies();
  const token = createAuthToken(session);
  const secure = process.env.NODE_ENV === "production";
  const sessionSnapshot = encodeBase64Url(JSON.stringify(session));

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  cookieStore.set(SESSION_SNAPSHOT_COOKIE, sessionSnapshot, {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(SESSION_SNAPSHOT_COOKIE);
}

export async function authenticateUser(userId: string, password: string) {
  const normalizedUserId = userId.trim();
  const normalizedPassword = password.trim();

  if (!normalizedUserId || !normalizedPassword) {
    return null;
  }

  try {
    const matches = await db
      .select({
        userId: users.userId,
        password: users.password,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(
        and(eq(users.userId, normalizedUserId), eq(users.password, normalizedPassword))
      )
      .limit(1);

    const matchedUser = matches[0];

    if (matchedUser?.userId && matchedUser.name && matchedUser.role) {
      return {
        userId: matchedUser.userId,
        name: matchedUser.name,
        role: matchedUser.role as AppUserRole,
      };
    }
  } catch {
    // During early setup, fall back to mock users if the database is unavailable.
  }

  const cookieStore = await cookies();
  const cookieUsers = readPosUsersCookie(cookieStore.get(POS_USERS_COOKIE)?.value);
  const fallbackUsers = cookieUsers.length ? cookieUsers : mockUsers;

  const mockUser = fallbackUsers.find(
    (user) => user.userId === normalizedUserId && user.password === normalizedPassword
  );

  if (!mockUser) return null;

  return {
    userId: mockUser.userId,
    name: mockUser.name,
    role: mockUser.role,
  };
}

export function getDefaultRedirectPath(role: AppUserRole) {
  return role === "seller" ? "/sale" : "/admin/dashboard";
}
