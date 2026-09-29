import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Guard all /admin routes except /admin/login
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

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. If logged in and visiting /admin/login, redirect to /admin/frontdesk
  if (pathname === "/admin/login") {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const user = token ? await verifySessionToken(token) : null;
    if (user) {
      return NextResponse.redirect(new URL("/admin/frontdesk", req.url));
    }
  }

  return NextResponse.next();
}

export const edgeProxy = proxy;
export default proxy;
