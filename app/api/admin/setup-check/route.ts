import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { isRequestAuthed } from "@/lib/admin-auth";
import { setupCheck } from "@/lib/api-keys";

const ENV_TEMPLATE = `# --- Supabase (set once in your Vercel project env) ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# --- Admin panel ---
ADMIN_PANEL_PASSWORD=
# Optional — falls back to ADMIN_PANEL_PASSWORD if unset.
ADMIN_COOKIE_SECRET=

# --- App timezone for daily counters (optional) ---
NEXT_PUBLIC_PROMPT_COUNT_TIME_ZONE=Asia/Kolkata
`;

let cachedSql: string | null = null;
function getSetupSql(): string {
  if (cachedSql !== null) return cachedSql;
  try {
    cachedSql = readFileSync(join(process.cwd(), "supabase", "api-keys.sql"), "utf8");
  } catch {
    cachedSql = "-- Could not load supabase/api-keys.sql on the server. Run it from the repo file directly.";
  }
  return cachedSql;
}

export async function GET(req: NextRequest) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const check = await setupCheck();
  return NextResponse.json({ check, sql: getSetupSql(), envTemplate: ENV_TEMPLATE });
}
