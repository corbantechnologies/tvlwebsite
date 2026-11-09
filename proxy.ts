import { NextRequest, NextResponse } from "next/server";
import { resolveStaffSession, COOKIE_NAME } from "@/lib/auth/session";
import { isPublicApiRequest } from "@/lib/auth/apiAccess";
import { canCallApi, canViewPage, homePageFor } from "@/lib/auth/roles";

// What a staff member on a temporary password may still call.
const ALLOWED_BEFORE_PASSWORD_CHANGE = /^\/api\/auth\/(change-password|session)$/;

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1. Guard staff-only API routes. Public endpoints are listed in lib/auth/apiAccess.ts.
  if (pathname.startsWith("/api/")) {
    if (isPublicApiRequest(req.method, pathname, searchParams)) {
      return NextResponse.next();
    }
    const user = await resolveStaffSession(req.cookies.get(COOKIE_NAME)?.value);
    if (!user) {
      return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
    }
    if (user.mustChangePassword && !ALLOWED_BEFORE_PASSWORD_CHANGE.test(pathname)) {
      return NextResponse.json({ error: "Choose a new password first (My account)." }, { status: 403 });
    }
    if (!canCallApi(user.role, req.method, pathname)) {
      return NextResponse.json({ error: "Your staff role does not allow this action." }, { status: 403 });
    }
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-staff-id", user.id);
    requestHeaders.set("x-staff-name", encodeURIComponent(user.name));
    requestHeaders.set("x-staff-role", user.role);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 2. Guard all /admin pages except /admin/login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const user = await resolveStaffSession(req.cookies.get(COOKIE_NAME)?.value);

    if (!user) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(COOKIE_NAME); // expired, deactivated or signed out by a password change
      return res;
    }

    // A temporary password (new account or admin reset) must be replaced before anything else.
    if (user.mustChangePassword && pathname !== "/admin/account") {
      return NextResponse.redirect(new URL("/admin/account", req.url));
    }

    if (pathname !== "/admin" && !canViewPage(user.role, pathname)) {
      const home = homePageFor(user.role);
      if (home !== pathname) return NextResponse.redirect(new URL(home, req.url));
    }

    // Inject verified identity headers for downstream server components
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-staff-id", user.id);
    requestHeaders.set("x-staff-name", encodeURIComponent(user.name));
    requestHeaders.set("x-staff-role", user.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 3. If logged in and visiting /admin/login, go to the user's home page,
  //    unless they opened a password reset link (that must still work while signed in).
  if (pathname === "/admin/login" && !searchParams.has("reset")) {
    const user = await resolveStaffSession(req.cookies.get(COOKIE_NAME)?.value);
    if (user) {
      return NextResponse.redirect(new URL(user.mustChangePassword ? "/admin/account" : homePageFor(user.role), req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};

export default proxy;
