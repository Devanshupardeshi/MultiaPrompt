import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed } from "@/lib/admin-auth";
import { getSettings, setSetting, listAudit } from "@/lib/api-keys";

export async function GET(req: NextRequest) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [settings, audit] = await Promise.all([getSettings(), listAudit(40)]);
  return NextResponse.json({ settings, audit });
}

export async function PATCH(req: NextRequest) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));

  const updates: Array<Promise<{ ok: boolean; error?: string }>> = [];
  if ("daily_prompt_cap" in body) {
    const v = body.daily_prompt_cap;
    if (v === null || typeof v === "number") updates.push(setSetting("daily_prompt_cap", v));
  }
  if (typeof body.maintenance_mode === "boolean") {
    updates.push(setSetting("maintenance_mode", body.maintenance_mode));
  }
  if (typeof body.default_model === "string" && body.default_model.trim()) {
    updates.push(setSetting("default_model", body.default_model.trim()));
  }

  const results = await Promise.all(updates);
  const failed = results.find((r) => !r.ok);
  if (failed) return NextResponse.json({ error: failed.error }, { status: 400 });

  return NextResponse.json({ ok: true, settings: await getSettings() });
}
