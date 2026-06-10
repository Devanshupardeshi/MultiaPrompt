"use client";

import { useState } from "react";

const STYLE_PRESETS = [
  { id: "hyper-realism", label: "Hyper-Realism" },
  { id: "fashion-editorial", label: "Fashion Editorial" },
  { id: "cinematic-scifi", label: "Cinematic Sci-Fi" },
  { id: "anime", label: "Anime" },
  { id: "concept-art", label: "Concept Art" },
  { id: "street-photography", label: "Street Photo" },
  { id: "fine-art-bw", label: "Fine Art B&W" },
  { id: "macro", label: "Nature Macro" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "selfie-ugc", label: "Selfie UGC" },
];

interface InputFormProps {
  onGenerate: (data: {
    description: string;
    style: string;
    characterName: string;
    useCharacter: boolean;
  }) => void;
  isLoading: boolean;
}

export function InputForm({ onGenerate, isLoading }: InputFormProps) {
  const [description, setDescription] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("hyper-realism");
  const [useCharacter, setUseCharacter] = useState(false);
  const [characterName, setCharacterName] = useState("");

  const handleSubmit = () => {
    if (!description.trim()) return;
    onGenerate({
      description: description.trim(),
      style: selectedStyle,
      characterName: characterName.trim(),
      useCharacter,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <section className="px-6 py-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Main input area */}
        <div className="relative">
          {/* Description textarea */}
          <div className="mb-6">
            <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">
              Describe what you want to create
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="A portrait of a young woman in a sunlit café in Paris, golden hour light streaming through vintage windows, candid documentary style, natural imperfections, wearing a linen blazer..."
              rows={5}
              className="input-multia w-full px-5 py-4 text-[15px] leading-relaxed resize-none custom-scrollbar"
              id="prompt-description"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-[11px] text-white/20 font-body">
                ⌘+Enter to generate
              </span>
              <span className="text-[11px] text-white/20 font-body">
                {description.length} chars
              </span>
            </div>
          </div>

          {/* Style presets */}
          <div className="mb-6">
            <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">
              Style
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`style-pill ${
                    selectedStyle === style.id ? "active" : ""
                  }`}
                  id={`style-${style.id}`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Character consistency toggle */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <label className="text-xs text-white/30 font-body uppercase tracking-[0.2em]">
                Character Consistency
              </label>
              <button
                onClick={() => setUseCharacter(!useCharacter)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                  useCharacter ? "bg-white" : "bg-white/10"
                }`}
                id="character-toggle"
                aria-label="Toggle character consistency"
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${
                    useCharacter
                      ? "left-[22px] bg-[#121212]"
                      : "left-0.5 bg-white/40"
                  }`}
                />
              </button>
            </div>

            {useCharacter && (
              <div className="overflow-hidden transition-all duration-300">
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Character name (e.g., ELENA)"
                  className="input-multia w-full max-w-xs px-4 py-2.5 text-sm"
                  id="character-name"
                />
                <p className="text-[11px] text-white/20 font-body mt-2">
                  The generated prompt will include identity anchoring for consistent character features across multiple generations.
                </p>
              </div>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={handleSubmit}
            disabled={!description.trim() || isLoading}
            className={`btn-multia w-full sm:w-auto ${
              !description.trim() || isLoading
                ? "opacity-30 cursor-not-allowed"
                : ""
            }`}
            id="generate-button"
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    opacity="0.25"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              "Generate Prompt"
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
