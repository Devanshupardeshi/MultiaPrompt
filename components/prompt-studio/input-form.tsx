"use client";

import React, { useState, useEffect } from "react";
import { STYLE_PRESETS } from "@/lib/style-presets";

const MOCKUP_TYPES = [
  { id: "business-card", label: "Business Card" },
  { id: "letterhead", label: "Letterhead" },
  { id: "envelope", label: "Envelope" },
  { id: "email-signature", label: "Email Signature" },
  { id: "id-badge", label: "ID Badge" },
  { id: "paper-bag", label: "Paper Bag" },
  { id: "packaging-box", label: "Packaging Box" },
  { id: "apparel", label: "Apparel (T-Shirt/Hoodie)" },
  { id: "mug", label: "Coffee Mug" },
  { id: "smartphone", label: "Smartphone Screen" },
  { id: "laptop", label: "Laptop Screen" },
  { id: "billboard", label: "Billboard / OOH" },
];

export type GenerationMode = "standard" | "face_swap" | "mockup";

export interface GeneratePayload {
  mode: GenerationMode;
  description: string;
  styles: string[];
  characterName: string;
  useCharacter: boolean;
  referenceImages?: string[];
  sourceFaceImage?: string;
  targetPoseImage?: string;
  logoImage?: string;
  mockupReferenceImage?: string;
  logoDescription?: string;
  mockupCount?: number;
  mockupTypes?: string[];
  targetModel?: "nano-banana-pro" | "gpt-image";
}

interface InputFormProps {
  onGenerate: (data: GeneratePayload) => void;
  isLoading: boolean;
}

export function InputForm({ onGenerate, isLoading }: InputFormProps) {
  const [mode, setMode] = useState<GenerationMode>("standard");
  const [description, setDescription] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["photorealistic"]);
  const [targetModel, setTargetModel] = useState<"nano-banana-pro" | "gpt-image">("nano-banana-pro");
  
  // Standard specific
  const [useCharacter, setUseCharacter] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  
  // Face Swap specific
  const [sourceFaceImage, setSourceFaceImage] = useState<string | null>(null);
  const [targetPoseImage, setTargetPoseImage] = useState<string | null>(null);
  
  // Mockup specific
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [mockupReferenceImage, setMockupReferenceImage] = useState<string | null>(null);
  const [logoDescription, setLogoDescription] = useState("");
  const [mockupCount, setMockupCount] = useState<number>(1);
  const [selectedMockupTypes, setSelectedMockupTypes] = useState<string[]>([]);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  // File handling helpers
  const handleSingleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remainingSlots = 2 - referenceImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImages((prev) => {
          if (prev.length >= 2) return prev;
          return [...prev, reader.result as string];
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeReferenceImage = (indexToRemove: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev => 
      prev.includes(styleId) 
        ? prev.filter(s => s !== styleId)
        : [...prev, styleId]
    );
  };

  const toggleMockupType = (typeId: string) => {
    setSelectedMockupTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(s => s !== typeId)
        : [...prev, typeId]
    );
  };

  const handleEnhance = async () => {
    if (!description.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setEnhanceError(null);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to enhance description");
      setDescription(data.enhanced);
    } catch (err) {
      setEnhanceError(err instanceof Error ? err.message : "Failed to enhance description.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const isValid = () => {
    if (mode === "standard") return description.trim().length > 0;
    if (mode === "face_swap") return sourceFaceImage !== null && targetPoseImage !== null;
    if (mode === "mockup") return logoImage !== null && (mockupReferenceImage !== null || logoDescription.trim().length > 0);
    return false;
  };

  const handleSubmit = () => {
    if (!isValid()) return;
    onGenerate({
      mode,
      description: description.trim(),
      styles: selectedStyles.length > 0 ? selectedStyles : ["photorealistic"],
      characterName: characterName.trim(),
      useCharacter,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      sourceFaceImage: sourceFaceImage || undefined,
      targetPoseImage: targetPoseImage || undefined,
      logoImage: logoImage || undefined,
      mockupReferenceImage: mockupReferenceImage || undefined,
      logoDescription: logoDescription || undefined,
      mockupCount,
      mockupTypes: selectedMockupTypes.length > 0 ? selectedMockupTypes : undefined,
      targetModel,
    });
  };

  return (
    <section className="px-6 py-8">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Mode Selector */}
        <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-lg w-max border border-white/10">
          {(["standard", "face_swap", "mockup"] as GenerationMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-xs font-body uppercase tracking-wider rounded transition-colors ${
                mode === m ? "bg-white text-black" : "text-white/50 hover:text-white"
              }`}
            >
              {m.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Inputs based on mode */}
        <div className="relative">
          
          {mode === "standard" && (
            <div className="mb-6">
              <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">
                Describe what you want to create
              </label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isEnhancing}
                  placeholder="A portrait of a young woman in a sunlit café..."
                  rows={4}
                  className="input-multia w-full px-5 py-4 pb-12 text-[15px] leading-relaxed resize-none custom-scrollbar disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={isEnhancing || !description.trim() || isLoading}
                  className={`absolute bottom-3 right-3 text-[11px] font-body uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                    isEnhancing || !description.trim() || isLoading
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : "bg-white/10 hover:bg-white/20 text-white/80"
                  }`}
                >
                  {isEnhancing ? "Enhancing..." : "Magic Enhance"}
                </button>
              </div>

              {/* Character consistency toggle */}
              <div className="mt-6 mb-6">
                <div className="flex items-center gap-4 mb-3">
                  <label className="text-xs text-white/30 font-body uppercase tracking-[0.2em]">Character Consistency</label>
                  <button onClick={() => setUseCharacter(!useCharacter)} className={`relative w-10 h-5 rounded-full ${useCharacter ? "bg-white" : "bg-white/10"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${useCharacter ? "left-[22px] bg-[#121212]" : "left-0.5 bg-white/40"}`} />
                  </button>
                </div>
                {useCharacter && (
                  <input type="text" value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder="Character name (e.g., ELENA)" className="input-multia w-full max-w-xs px-4 py-2 text-sm" />
                )}
              </div>

              {/* Reference Image Upload */}
              <div className="mt-4">
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Reference Images (Optional, Max 2)</label>
                <div className="flex items-center gap-4">
                  {referenceImages.length < 2 && (
                    <label className="flex items-center justify-center px-4 py-2 text-xs font-body uppercase tracking-wider rounded border border-white/10 cursor-pointer hover:bg-white/5">
                      <input type="file" accept="image/*" multiple onChange={handleMultipleImageUpload} className="hidden" disabled={isLoading} />
                      Upload Image
                    </label>
                  )}
                  {referenceImages.length > 0 && (
                    <div className="flex gap-2">
                      {referenceImages.map((img, i) => (
                        <div key={i} className="relative group">
                          <img src={img} alt="Ref" className="h-10 w-10 object-cover rounded border border-white/20" />
                          <button onClick={() => removeReferenceImage(i)} className="absolute -top-2 -right-2 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 border border-white/20">❌</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {mode === "face_swap" && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">Source Face Image (Required)</label>
                <div className="relative h-40 border-2 border-dashed border-white/10 rounded-lg hover:bg-white/5 transition-colors overflow-hidden">
                  {sourceFaceImage ? (
                    <>
                      <img src={sourceFaceImage} alt="Source Face" className="w-full h-full object-cover" />
                      <button onClick={(e) => { e.preventDefault(); setSourceFaceImage(null); }} className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white rounded-full w-8 h-8 flex items-center justify-center border border-white/20 z-10">✕</button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                      <input type="file" accept="image/*" onChange={(e) => handleSingleImageUpload(e, setSourceFaceImage)} className="hidden" disabled={isLoading} />
                      <span className="text-sm text-white/50 font-body uppercase tracking-wider">Upload Face</span>
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">Target Pose Image (Required)</label>
                <div className="relative h-40 border-2 border-dashed border-white/10 rounded-lg hover:bg-white/5 transition-colors overflow-hidden">
                  {targetPoseImage ? (
                    <>
                      <img src={targetPoseImage} alt="Target Pose" className="w-full h-full object-cover" />
                      <button onClick={(e) => { e.preventDefault(); setTargetPoseImage(null); }} className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white rounded-full w-8 h-8 flex items-center justify-center border border-white/20 z-10">✕</button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                      <input type="file" accept="image/*" onChange={(e) => handleSingleImageUpload(e, setTargetPoseImage)} className="hidden" disabled={isLoading} />
                      <span className="text-sm text-white/50 font-body uppercase tracking-wider">Upload Pose</span>
                    </label>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">Additional Instructions (Optional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Make the lighting more dramatic..." rows={2} className="input-multia w-full px-4 py-3 text-sm resize-none custom-scrollbar" />
              </div>
            </div>
          )}

          {mode === "mockup" && (
            <div className="mb-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">Logo/Design Image (Required)</label>
                  <div className="relative h-40 border-2 border-dashed border-white/10 rounded-lg hover:bg-white/5 transition-colors overflow-hidden">
                    {logoImage ? (
                      <>
                        <img src={logoImage} alt="Logo" className="w-full h-full object-contain p-2" />
                        <button onClick={(e) => { e.preventDefault(); setLogoImage(null); }} className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white rounded-full w-8 h-8 flex items-center justify-center border border-white/20 z-10">✕</button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                        <input type="file" accept="image/*" onChange={(e) => handleSingleImageUpload(e, setLogoImage)} className="hidden" disabled={isLoading} />
                        <span className="text-sm text-white/50 font-body uppercase tracking-wider">Upload Logo</span>
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">Mockup Reference (Optional)</label>
                  <div className="relative h-40 border-2 border-dashed border-white/10 rounded-lg hover:bg-white/5 transition-colors overflow-hidden">
                    {mockupReferenceImage ? (
                      <>
                        <img src={mockupReferenceImage} alt="Reference" className="w-full h-full object-cover" />
                        <button onClick={(e) => { e.preventDefault(); setMockupReferenceImage(null); }} className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white rounded-full w-8 h-8 flex items-center justify-center border border-white/20 z-10">✕</button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                        <input type="file" accept="image/*" onChange={(e) => handleSingleImageUpload(e, setMockupReferenceImage)} className="hidden" disabled={isLoading} />
                        <span className="text-sm text-white/50 font-body uppercase tracking-wider">Upload Reference</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">
                  {mockupReferenceImage ? "Additional Instructions / Design Context (Optional)" : "What is your logo/design about? (Required if no reference)"}
                </label>
                <input type="text" value={logoDescription} onChange={(e) => setLogoDescription(e.target.value)} placeholder="e.g., Luxury coffee brand, modern SaaS company..." className="input-multia w-full px-4 py-3 text-sm" />
              </div>

              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">Mockup Types (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {MOCKUP_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => toggleMockupType(type.id)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                        selectedMockupTypes.includes(type.id)
                          ? "bg-white text-black border-white"
                          : "bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">Mockup Count</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(num => (
                    <button key={num} onClick={() => setMockupCount(num)} className={`px-4 py-2 rounded text-sm transition-colors ${mockupCount === num ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20"}`}>
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Style presets (Multi-select) */}
          <div className="mb-8">
            <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">Styles (Select Multiple)</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => toggleStyle(style.id)}
                  className={`style-pill ${selectedStyles.includes(style.id) ? "active" : ""}`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target image model selector */}
          <div className="mb-8">
            <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">Target Image Model</label>
            <div className="flex gap-2">
              {([["nano-banana-pro", "Nano Banana Pro"], ["gpt-image", "GPT Image"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTargetModel(id)}
                  className={`px-4 py-2 rounded text-sm transition-colors ${targetModel === id ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleSubmit}
            disabled={!isValid() || isLoading}
            className={`btn-multia w-full sm:w-auto ${!isValid() || isLoading ? "opacity-30 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Generating..." : "Generate Prompt"}
          </button>

        </div>
      </div>
    </section>
  );
}
