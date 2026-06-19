"use client";

import { useEffect, useState } from "react";
import {
  DAILY_PROMPT_COUNTS_TABLE,
  DailyPromptCountRow,
  getPromptCountDateKey,
} from "@/lib/prompt-count";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PromptCountStatus = "loading" | "ready" | "unconfigured" | "error";

export function useDailyPromptCount() {
  const [dateKey, setDateKey] = useState(() => getPromptCountDateKey());
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<PromptCountStatus>("loading");

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nextDateKey = getPromptCountDateKey();
      setDateKey((current) => (current === nextDateKey ? current : nextDateKey));
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setCount(null);
      setStatus("unconfigured");
      return;
    }

    let active = true;
    setStatus("loading");

    const loadTodayCount = async () => {
      const { data, error } = await supabase
        .from(DAILY_PROMPT_COUNTS_TABLE)
        .select("date,count,updated_at")
        .eq("date", dateKey)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Failed to load daily prompt count:", error);
        setCount(null);
        setStatus("error");
        return;
      }

      setCount(data?.count ?? 0);
      setStatus("ready");
    };

    loadTodayCount();

    const channel = supabase
      .channel(`daily-prompt-count-${dateKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: DAILY_PROMPT_COUNTS_TABLE,
          filter: `date=eq.${dateKey}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setCount(0);
            setStatus("ready");
            return;
          }

          const row = payload.new as DailyPromptCountRow;
          if (row?.date === dateKey && typeof row.count === "number") {
            setCount(row.count);
            setStatus("ready");
          }
        }
      )
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === "CHANNEL_ERROR") {
          setStatus("error");
        }
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [dateKey]);

  return { count, status, dateKey };
}
