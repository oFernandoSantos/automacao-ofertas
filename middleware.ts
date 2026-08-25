import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

const publicPaths = ["/login", "/api/auth/login", "/go"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/automation")) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("admin_session")?.value;

  if (!sessionCookie || !(await verifySessionToken(sessionCookie))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
