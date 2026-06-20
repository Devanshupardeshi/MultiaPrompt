"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Header } from "@/components/prompt-studio/header";
import { Hero } from "@/components/prompt-studio/hero";
import { InputForm } from "@/components/prompt-studio/input-form";
import { OutputDisplay } from "@/components/prompt-studio/output-display";
import { Footer } from "@/components/prompt-studio/footer";
import { useDailyPromptCount } from "@/lib/use-daily-prompt-count";

import { GeneratePayload } from "@/lib/shared-types";

// Never auto-wait longer than this for the pool to free up (longer waits ⇒ a daily
// reset, which we surface as a message instead of holding the spinner).
const POOL_WAIT_CAP_MS = 120_000;

export default function Home() {
  const [generatedJson, setGeneratedJson] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<GeneratePayload | null>(null);
  const [queuedUntil, setQueuedUntil] = useState<number | null>(null);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const { count: dailyPromptCount } = useDailyPromptCount();

  const retryTimer = useRef<number | null>(null);
  const runRef = useRef<(payload: GeneratePayload) => void>(() => {});

  useEffect(() => {
    return () => {
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
    };
  }, []);

  const runGenerate = useCallback(async (payload: GeneratePayload) => {
    setIsLoading(true);
    setError(null);
    setGeneratedJson(null);
    setQueuedUntil(null);
    setQueueMessage(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setGeneratedJson(result.json);
        setIsLoading(false);
        return;
      }

      // Pool drained — queue with a live countdown and auto-retry when a key frees up.
      if (result.poolBusy) {
        const retryAfterMs: number | null =
          typeof result.retryAfterMs === "number" ? result.retryAfterMs : null;

        if (retryAfterMs !== null && retryAfterMs <= POOL_WAIT_CAP_MS) {
          const waitMs = Math.max(1500, retryAfterMs + 1500);
          setQueuedUntil(Date.now() + waitMs);
          setQueueMessage("Waiting for a free key…");
          // keep isLoading true so the queue UI stays visible
          retryTimer.current = window.setTimeout(() => runRef.current(payload), waitMs);
          return;
        }

        // Long wait ⇒ daily exhaustion. Stop and show when capacity returns.
        const when = result.soonestRecoveryAt
          ? new Date(result.soonestRecoveryAt).toLocaleString()
          : null;
        setError(
          when
            ? `All keys have hit their daily limit. Capacity returns around ${when}. Please try again later.`
            : result.error || "All keys are busy right now. Please try again shortly."
        );
        setIsLoading(false);
        return;
      }

      setError(result.error || "Failed to generate prompt");
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    runRef.current = runGenerate;
  }, [runGenerate]);

  const handleGenerate = useCallback(
    (payload: GeneratePayload) => {
      if (retryTimer.current) {
        window.clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
      setLastInput(payload);
      runGenerate(payload);
    },
    [runGenerate]
  );

  const handleRegenerate = useCallback(() => {
    if (lastInput) {
      handleGenerate(lastInput);
    }
  }, [lastInput, handleGenerate]);

  return (
    <main className="relative min-h-screen noise-overlay">
      <Header dailyPromptCount={dailyPromptCount} />

      <Hero />

      {/* Divider */}
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="h-px bg-white/5" />
      </div>

      <InputForm onGenerate={handleGenerate} isLoading={isLoading} />

      {/* Divider */}
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="h-px bg-white/5" />
      </div>

      <OutputDisplay
        json={generatedJson}
        isLoading={isLoading}
        error={error}
        onRegenerate={handleRegenerate}
        mode={lastInput?.mode}
        queuedUntil={queuedUntil}
        queueMessage={queueMessage}
        hasImage={
          !!(
            (lastInput?.referenceImages && lastInput.referenceImages.length > 0) ||
            lastInput?.sourceFaceImage ||
            lastInput?.targetPoseImage ||
            lastInput?.logoImage ||
            lastInput?.mockupReferenceImage ||
            lastInput?.productImage
          )
        }
      />

      <Footer />
    </main>
  );
}
