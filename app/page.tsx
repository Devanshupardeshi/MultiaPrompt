"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/prompt-studio/header";
import { Hero } from "@/components/prompt-studio/hero";
import { InputForm } from "@/components/prompt-studio/input-form";
import { OutputDisplay } from "@/components/prompt-studio/output-display";
import { Footer } from "@/components/prompt-studio/footer";

export default function Home() {
  const [generatedJson, setGeneratedJson] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<{
    description: string;
    style: string;
    characterName: string;
    useCharacter: boolean;
    referenceImage?: string;
  } | null>(null);

  const handleGenerate = useCallback(
    async (data: {
      description: string;
      style: string;
      characterName: string;
      useCharacter: boolean;
      referenceImage?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      setGeneratedJson(null);
      setLastInput(data);

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
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
      <Header />

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
        hasReferenceImage={!!lastInput?.referenceImage}
      />

      <Footer />
    </main>
  );
}
