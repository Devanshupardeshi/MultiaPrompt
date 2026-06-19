import { DailyPromptCountRow, getPromptCountDateKey } from "@/lib/prompt-count";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function incrementDailyPromptCount(): Promise<DailyPromptCountRow | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    console.warn("Supabase prompt counter is not configured. Skipping increment.");
    return null;
  }

  const { data, error } = await supabase
    .rpc("increment_daily_prompt_count", {
      target_date: getPromptCountDateKey(),
    })
    .single();

  if (error) {
    console.error("Failed to increment Supabase prompt counter:", error);
    return null;
  }

  return data as DailyPromptCountRow;
}
