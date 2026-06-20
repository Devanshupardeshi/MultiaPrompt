import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed } from "@/lib/admin-auth";
import { setKeyEnabled, updateKey, deleteKey, testKey, type UpdateKeyInput } from "@/lib/api-keys";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (body.action === "test") {
    const result = await testKey(id);
    return NextResponse.json(result); // 200 with an `ok` flag either way
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  // Enable / disable toggle
  if (typeof body.enabled === "boolean") {
    const r = await setKeyEnabled(id, body.enabled);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  }

  // Field / cap updates
  const patch: UpdateKeyInput = {};
  if (typeof body.label === "string") patch.label = body.label;
  if (typeof body.accountLabel === "string") patch.accountLabel = body.accountLabel;
  if (typeof body.dailyCap === "number") patch.dailyCap = body.dailyCap;
  if (typeof body.rpmCap === "number") patch.rpmCap = body.rpmCap;
  if (typeof body.priority === "number") patch.priority = body.priority;
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (Object.keys(patch).length > 0) {
    const r = await updateKey(id, patch);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const r = await deleteKey(id);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
