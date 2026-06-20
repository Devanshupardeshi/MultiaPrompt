import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  createSessionToken,
  isAdminConfigured,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE,
} from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin password is not configured. Set ADMIN_PANEL_PASSWORD in your environment." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  if (!(await verifyPassword(body?.password))) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
