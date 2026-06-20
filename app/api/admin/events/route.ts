import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed } from "@/lib/admin-auth";
import { listEvents, errorCountsSince } from "@/lib/api-keys";
import { PROMPT_COUNT_TIME_ZONE } from "@/lib/prompt-count";

// Start of "today" in the app's configured timezone, as a UTC ISO string.
function startOfDayIso(timeZone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offsetMs = asUTC - now.getTime();
  const startTzAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), 0, 0, 0);
  return new Date(startTzAsUtc - offsetMs).toISOString();
}

export async function GET(req: NextRequest) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 300);
  const userFacingOnly = url.searchParams.get("userFacing") === "1";
  const since = startOfDayIso(PROMPT_COUNT_TIME_ZONE);

  const [events, counts] = await Promise.all([
    listEvents({ limit, userFacingOnly }),
    errorCountsSince(since),
  ]);

  return NextResponse.json({ events, counts, since });
}
