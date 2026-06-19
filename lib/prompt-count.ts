export const DAILY_PROMPT_COUNTS_TABLE = "daily_prompt_counts";
export const PROMPT_COUNT_TIME_ZONE =
  process.env.NEXT_PUBLIC_PROMPT_COUNT_TIME_ZONE || "Asia/Kolkata";

export type DailyPromptCountRow = {
  date: string;
  count: number;
  updated_at: string;
};

export function getPromptCountDateKey(date = new Date(), timeZone = PROMPT_COUNT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}
