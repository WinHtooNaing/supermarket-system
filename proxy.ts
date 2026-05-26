import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";
import { getDefaultRedirectPath, verifyAuthToken } from "@/lib/auth";

const SELLER_ONLY_PATHS = ["/sale"];
const ADMIN_ONLY_PATHS = ["/admin"];
const AUTH_PATHS = ["/auth"];

function matchesPath(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = verifyAuthToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const isAuthPage = matchesPath(pathname, AUTH_PATHS);
  const isSellerPage = matchesPath(pathname, SELLER_ONLY_PATHS);
  const isAdminPage = matchesPath(pathname, ADMIN_ONLY_PATHS);

  if (!session && (isSellerPage || isAdminPage)) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL(getDefaultRedirectPath(session.role), request.url));
  }

  if (session?.role === "seller" && isAdminPage) {
    return NextResponse.redirect(new URL("/sale", request.url));
  }

  if (session?.role === "admin" && isSellerPage) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/admin/:path*", "/sale/:path*"],
};
