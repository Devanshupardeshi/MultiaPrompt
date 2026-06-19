"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/prompt-studio/header";
import { Hero } from "@/components/prompt-studio/hero";
import { InputForm } from "@/components/prompt-studio/input-form";
import { OutputDisplay } from "@/components/prompt-studio/output-display";
import { Footer } from "@/components/prompt-studio/footer";
import { useDailyPromptCount } from "@/lib/use-daily-prompt-count";

import { GenerationMode, GeneratePayload } from "@/lib/shared-types";

export default function Home() {
  const [generatedJson, setGeneratedJson] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<GeneratePayload | null>(null);
  const { count: dailyPromptCount } = useDailyPromptCount();

  const handleGenerate = useCallback(
    async (payload: GeneratePayload) => {
      setIsLoading(true);
      setError(null);
      setGeneratedJson(null);
      setLastInput(payload);

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to generate prompt");
        }

        setGeneratedJson(result.json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
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
