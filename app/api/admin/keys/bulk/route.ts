import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed } from "@/lib/admin-auth";
import { addKeysBulk } from "@/lib/api-keys";

export async function POST(req: NextRequest) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const text = typeof body.keys === "string" ? body.keys : "";
  if (!text.trim()) {
    return NextResponse.json({ error: "Paste at least one key" }, { status: 400 });
  }
  const result = await addKeysBulk(text, {
    accountLabel: typeof body.accountLabel === "string" ? body.accountLabel : undefined,
    dailyCap: typeof body.dailyCap === "number" ? body.dailyCap : undefined,
    rpmCap: typeof body.rpmCap === "number" ? body.rpmCap : undefined,
  });
  return NextResponse.json(result);
}
