import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];
const ADMIN_PREFIX = "/admin";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie
  const session = request.cookies.get("warehouse_session");

  // Public paths: redirect to home if already logged in
  if (PUBLIC_PATHS.includes(pathname)) {
    if (session?.value) {
      try {
        const data = JSON.parse(atob(session.value));
        if (data.userId) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch {
        // Invalid session, let them see login
      }
    }
    return NextResponse.next();
  }

  // All other paths require auth
  if (!session?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const data = JSON.parse(atob(session.value));

    // Check session expiry
    if (!data.userId || !data.expiresAt || new Date(data.expiresAt) < new Date()) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("warehouse_session");
      return response;
    }

    // Admin routes require admin role
    if (pathname.startsWith(ADMIN_PREFIX) && data.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid session
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("warehouse_session");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (static files)
     * - api (API routes)
     * - favicon.ico, images, etc.
     */
    "/((?!_next|api|favicon.ico|.*\\.).*)",
  ],
};
