import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed } from "@/lib/admin-auth";
import { listKeys, poolSummary, addKey, dailyStats } from "@/lib/api-keys";

export async function GET(req: NextRequest) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [keys, summary, stats] = await Promise.all([listKeys(), poolSummary(), dailyStats(7)]);
  return NextResponse.json({ keys, summary, stats });
}

export async function POST(req: NextRequest) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  if (!body?.key || typeof body.key !== "string" || !body.key.trim()) {
    return NextResponse.json({ error: "A Gemini API key is required" }, { status: 400 });
  }
  const result = await addKey({
    key: body.key,
    label: typeof body.label === "string" ? body.label : undefined,
    accountLabel: typeof body.accountLabel === "string" ? body.accountLabel : undefined,
    dailyCap: typeof body.dailyCap === "number" ? body.dailyCap : undefined,
    rpmCap: typeof body.rpmCap === "number" ? body.rpmCap : undefined,
    priority: typeof body.priority === "number" ? body.priority : undefined,
    notes: typeof body.notes === "string" ? body.notes : undefined,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, duplicate: result.duplicate },
      { status: result.duplicate ? 409 : 400 }
    );
  }
  return NextResponse.json({ ok: true, id: result.id });
}
