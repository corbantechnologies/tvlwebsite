import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { isPublicApiRequest } from "@/lib/auth/apiAccess";

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1. Guard staff-only API routes. Public endpoints are listed in lib/auth/apiAccess.ts.
  if (pathname.startsWith("/api/")) {
    if (isPublicApiRequest(req.method, pathname, searchParams)) {
      return NextResponse.next();
    }
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const user = token ? await verifySessionToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
    }
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-staff-id", user.id);
    requestHeaders.set("x-staff-name", encodeURIComponent(user.name));
    requestHeaders.set("x-staff-role", user.role);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 2. Guard all /admin pages except /admin/login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const user = token ? await verifySessionToken(token) : null;

    if (!user) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Inject verified identity headers for downstream server components
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-staff-id", user.id);
    requestHeaders.set("x-staff-name", encodeURIComponent(user.name));
    requestHeaders.set("x-staff-role", user.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 3. If logged in and visiting /admin/login, redirect to /admin/frontdesk
  if (pathname === "/admin/login") {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const user = token ? await verifySessionToken(token) : null;
    if (user) {
      return NextResponse.redirect(new URL("/admin/frontdesk", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};

export default proxy;
