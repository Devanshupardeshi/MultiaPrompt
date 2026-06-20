import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

// Guards the admin panel + its API (Next 16 "proxy" convention, formerly middleware).
// The login page and login/logout endpoints stay public so you can actually sign in.
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await verifySessionToken(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}
