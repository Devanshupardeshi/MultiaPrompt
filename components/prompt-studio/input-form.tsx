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

const RESEARCH_DOMAINS = [
  { id: "brand_strategy", label: "Brand Strategy", icon: "🎯" },
  { id: "design_research", label: "Design Research", icon: "🎨" },
  { id: "content_strategy", label: "Content Strategy", icon: "✍️" },
  { id: "website_architecture", label: "Website Architecture", icon: "💻" },
  { id: "market_analysis", label: "Market Analysis", icon: "🌍" },
  { id: "full_research", label: "Full Research", icon: "📊" },
];

const TONE_PRESETS = [
  "Professional", "Casual", "Bold", "Warm", "Playful",
  "Luxury", "Technical", "Friendly", "Authoritative", "Minimal",
];

// Awwwards 3D (WebGL) mode options
const SITE_CATEGORIES = [
  { id: "immersive", label: "Immersive / Experiential" },
  { id: "portfolio", label: "Portfolio" },
  { id: "agency", label: "Agency / Studio" },
  { id: "product-launch", label: "Product Launch" },
  { id: "editorial", label: "Editorial / Storytelling" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "brand-microsite", label: "Brand Microsite" },
];

const ASSET_STRATEGIES = [
  { id: "procedural", label: "No model — procedural & shader-driven" },
  { id: "model", label: "I have a 3D model (GLB/GLTF URL)" },
  { id: "media", label: "Use my images / video as the hero" },
];

const WEBGL_FEATURES = [
  { id: "glsl-shaders", label: "GLSL Shaders" },
  { id: "particles", label: "Particle Fields" },
  { id: "physics-rapier", label: "Physics (Rapier)" },
  { id: "postprocessing", label: "Post-processing (Bloom/CA/DoF)" },
  { id: "scroll-scrubbed-3d", label: "Scroll-scrubbed 3D" },
  { id: "parallax-scroll", label: "Parallax (Scroll)" },
  { id: "parallax-pointer", label: "Parallax (Pointer)" },
  { id: "spline-import", label: "Spline Import" },
  { id: "image-distortion-reveals", label: "Image Distortion Reveals" },
];

export type GenerationMode = "standard" | "face_swap" | "mockup" | "3d_website" | "awwwards_website" | "deep_research";

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
  styleDirectives?: { label: string; directive: string }[];
  // 3D Website mode fields
  brandName?: string;
  tagline?: string;
  websiteType?: string;
  primaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  headingFont?: string;
  bodyFont?: string;
  heroMediaUrl?: string;
  additionalMediaUrls?: string[];
  websiteSections?: string[];
  glassStyle?: string;
  animationIntensity?: number;
  animationNames?: string;
  additionalDetails?: string;
  designMdContent?: string;
  // Awwwards 3D (WebGL) mode fields
  siteCategory?: string;
  signatureMoment?: string;
  webglFeatures?: string[];
  referenceSites?: string;
  assetStrategy?: string;
  model3dUrl?: string;
  // Deep Research mode fields
  businessName?: string;
  industry?: string;
  marketRegion?: string;
  services?: string;
  competitorReferences?: string;
  researchDomains?: string[];
  targetAudience?: string;
  businessGoal?: string;
  brandPositioning?: string;
  toneOfVoice?: string;
}

export interface CustomStyle {
  id: string;
  label: string;
  directive: string;
  thumbnail: string;
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

  // Custom styles extracted from reference images (persisted in localStorage)
  const [customStyles, setCustomStyles] = useState<CustomStyle[]>([]);
  const [isExtractingStyle, setIsExtractingStyle] = useState(false);
  const [styleError, setStyleError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bananavault-custom-styles");
      if (saved) setCustomStyles(JSON.parse(saved));
    } catch {
      // ignore corrupted storage
    }
  }, []);

  const persistCustomStyles = (updater: (prev: CustomStyle[]) => CustomStyle[]) => {
    setCustomStyles((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem("bananavault-custom-styles", JSON.stringify(next));
      } catch {
        // storage full or unavailable — keep in-memory only
      }
      return next;
    });
  };

  const handleStyleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setIsExtractingStyle(true);
      setStyleError(null);
      try {
        const res = await fetch("/api/extract-style", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to extract style");
        const newStyle: CustomStyle = {
          id: `custom-${Date.now()}`,
          label: data.name,
          directive: data.directive,
          thumbnail: base64,
        };
        persistCustomStyles((prev) => [...prev, newStyle]);
        setSelectedStyles((prev) => [...prev, newStyle.id]);
      } catch (err) {
        setStyleError(err instanceof Error ? err.message : "Failed to extract style");
      } finally {
        setIsExtractingStyle(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeCustomStyle = (id: string) => {
    persistCustomStyles((prev) => prev.filter((s) => s.id !== id));
    setSelectedStyles((prev) => prev.filter((s) => s !== id));
  };
  
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

  // 3D Website specific
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [websiteType, setWebsiteType] = useState("landing");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [accentColor, setAccentColor] = useState("#d4af7a");
  const [bgColor, setBgColor] = useState("#0b0b0b");
  const [headingFont, setHeadingFont] = useState("");
  const [bodyFont, setBodyFont] = useState("");
  const [heroMediaUrl, setHeroMediaUrl] = useState("");
  const [additionalMediaUrls, setAdditionalMediaUrls] = useState<string[]>(["", "", ""]);
  const [websiteSections, setWebsiteSections] = useState<string[]>(["navbar", "hero", "features", "cta", "footer"]);
  const [glassStyle, setGlassStyle] = useState("both");
  const [animationIntensity, setAnimationIntensity] = useState(80);
  const [animationNames, setAnimationNames] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [designMdContent, setDesignMdContent] = useState("");
  const [designMdFileName, setDesignMdFileName] = useState("");

  // Awwwards 3D (WebGL) specific
  const [siteCategory, setSiteCategory] = useState("immersive");
  const [signatureMoment, setSignatureMoment] = useState("");
  const [webglFeatures, setWebglFeatures] = useState<string[]>(["glsl-shaders", "scroll-scrubbed-3d", "parallax-scroll", "postprocessing"]);
  const [referenceSites, setReferenceSites] = useState("");
  const [assetStrategy, setAssetStrategy] = useState("procedural");
  const [model3dUrl, setModel3dUrl] = useState("");

  // Deep Research specific
  const [businessName, setBusinessName] = useState("");
  const [researchIndustry, setResearchIndustry] = useState("");
  const [marketRegion, setMarketRegion] = useState("");
  const [researchServices, setResearchServices] = useState("");
  const [competitorReferences, setCompetitorReferences] = useState("");
  const [researchDomains, setResearchDomains] = useState<string[]>(["full_research"]);
  const [researchTargetAudience, setResearchTargetAudience] = useState("");
  const [researchBusinessGoal, setResearchBusinessGoal] = useState("");
  const [researchBrandPositioning, setResearchBrandPositioning] = useState("");
  const [researchTone, setResearchTone] = useState("");

  // Parse DESIGN.md YAML frontmatter and auto-fill form fields
  const handleDesignMdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDesignMdFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const text = reader.result as string;
      setDesignMdContent(text);

      // Extract YAML frontmatter between --- markers
      const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) return;
      const yaml = fmMatch[1];

      // Helper: extract a top-level YAML value
      const getVal = (key: string): string => {
        const m = yaml.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?`, "m"));
        return m ? m[1].trim() : "";
      };

      // Helper: extract a nested color value like `  primary: "#ffffff"`
      const getColor = (key: string): string => {
        const m = yaml.match(new RegExp(`^\\s+${key}:\\s*["']?(#[0-9a-fA-F]{3,8})["']?`, "m"));
        return m ? m[1] : "";
      };

      // Helper: extract font family from typography section
      const getFont = (section: string): string => {
        // Find the section, then the fontFamily under it
        const sectionRegex = new RegExp(`${section}:[\\s\\S]*?fontFamily:\\s*["']?([^"'\\n]+)["']?`);
        const m = yaml.match(sectionRegex);
        return m ? m[1].split(",")[0].trim().replace(/["']/g, "") : "";
      };

      // Auto-fill brand name from `name:` field
      const name = getVal("name");
      if (name) {
        // Extract brand name from the design analysis name (e.g., "BMW M-design-analysis" -> "BMW M")
        const cleanName = name.replace(/-design-analysis$/i, "").replace(/-/g, " ").trim();
        if (cleanName) setBrandName(cleanName);
      }

      // Auto-fill description
      const desc = getVal("description");
      if (desc) setAdditionalDetails(desc);

      // Auto-fill colors
      const primary = getColor("primary");
      const canvas = getColor("canvas");
      // Look for accent-like colors (m-red, electric-blue, etc.)
      const accent = getColor("m-red") || getColor("electric-blue") || getColor("accent");

      if (primary) setPrimaryColor(primary);
      if (accent) setAccentColor(accent);
      if (canvas) setBgColor(canvas);

      // Auto-fill fonts
      const displayFont = getFont("display-xl") || getFont("display-lg");
      const bodyFontVal = getFont("body-md") || getFont("body-sm");
      if (displayFont) setHeadingFont(displayFont);
      if (bodyFontVal) setBodyFont(bodyFontVal);
    };
    reader.readAsText(file);
  };

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

  const toggleSection = (sectionId: string) => {
    setWebsiteSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleWebglFeature = (featureId: string) => {
    setWebglFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const isValid = () => {
    if (mode === "standard") return description.trim().length > 0;
    if (mode === "face_swap") return sourceFaceImage !== null && targetPoseImage !== null;
    if (mode === "mockup") return logoImage !== null && (mockupReferenceImage !== null || logoDescription.trim().length > 0);
    if (mode === "3d_website") return brandName.trim().length > 0;
    if (mode === "awwwards_website") return brandName.trim().length > 0;
    if (mode === "deep_research") return businessName.trim().length > 0;
    return false;
  };

  const handleSubmit = () => {
    if (!isValid()) return;

    const activeStyleIds = selectedStyles.length > 0 ? selectedStyles : ["photorealistic"];
    const idToLabel = new Map<string, string>([
      ...STYLE_PRESETS.map((p) => [p.id, p.label] as const),
      ...customStyles.map((c) => [c.id, c.label] as const),
    ]);
    const styleDirectives = [
      ...STYLE_PRESETS.filter((p) => activeStyleIds.includes(p.id)).map((p) => ({ label: p.label, directive: p.directive })),
      ...customStyles.filter((c) => activeStyleIds.includes(c.id)).map((c) => ({ label: c.label, directive: c.directive })),
    ];

    onGenerate({
      mode,
      description: description.trim(),
      styles: activeStyleIds.map((id) => idToLabel.get(id) ?? id),
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
      styleDirectives: styleDirectives.length > 0 ? styleDirectives : undefined,
      // 3D Website fields
      brandName: brandName.trim() || undefined,
      tagline: tagline.trim() || undefined,
      websiteType: websiteType || undefined,
      primaryColor: primaryColor || undefined,
      accentColor: accentColor || undefined,
      bgColor: bgColor || undefined,
      headingFont: headingFont.trim() || undefined,
      bodyFont: bodyFont.trim() || undefined,
      heroMediaUrl: heroMediaUrl.trim() || undefined,
      additionalMediaUrls: additionalMediaUrls.filter(u => u.trim()) || undefined,
      websiteSections: websiteSections.length > 0 ? websiteSections : undefined,
      glassStyle: glassStyle || undefined,
      animationIntensity: animationIntensity,
      animationNames: animationNames.trim() || undefined,
      additionalDetails: additionalDetails.trim() || undefined,
      designMdContent: designMdContent.trim() || undefined,
      // Awwwards 3D (WebGL) fields
      siteCategory: siteCategory || undefined,
      signatureMoment: signatureMoment.trim() || undefined,
      webglFeatures: webglFeatures.length > 0 ? webglFeatures : undefined,
      referenceSites: referenceSites.trim() || undefined,
      assetStrategy: assetStrategy || undefined,
      model3dUrl: model3dUrl.trim() || undefined,
      // Deep Research fields
      businessName: businessName.trim() || undefined,
      industry: researchIndustry.trim() || undefined,
      marketRegion: marketRegion.trim() || undefined,
      services: researchServices.trim() || undefined,
      competitorReferences: competitorReferences.trim() || undefined,
      researchDomains: researchDomains.length > 0 ? researchDomains : undefined,
      targetAudience: researchTargetAudience.trim() || undefined,
      businessGoal: researchBusinessGoal.trim() || undefined,
      brandPositioning: researchBrandPositioning.trim() || undefined,
      toneOfVoice: researchTone.trim() || undefined,
    });
  };

  return (
    <section className="px-6 py-8">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Mode Selector */}
        <div className="flex flex-wrap gap-2 mb-8 p-1 bg-white/5 rounded-lg w-max border border-white/10">
          {(["standard", "face_swap", "mockup", "3d_website", "awwwards_website", "deep_research"] as GenerationMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-xs font-body uppercase tracking-wider rounded transition-colors ${
                mode === m ? "bg-white text-black" : "text-white/50 hover:text-white"
              }`}
            >
              {m === "3d_website" ? "3D Website" : m === "awwwards_website" ? "Awwwards 3D" : m === "deep_research" ? "Deep Research" : m.replace("_", " ")}
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

          {mode === "3d_website" && (
            <div className="mb-6 space-y-6">
              {/* DESIGN.md Upload */}
              <div className="p-4 border border-dashed border-white/15 rounded-lg bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs text-white/40 font-body uppercase tracking-[0.2em] mb-1">Import DESIGN.md</label>
                    <p className="text-[11px] text-white/20 font-body">Upload a design system file to auto-fill colors, fonts, and brand details</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {designMdFileName && (
                      <span className="text-[11px] text-green-400/70 font-mono flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                        {designMdFileName}
                      </span>
                    )}
                    <label className="cursor-pointer text-[11px] text-white/40 hover:text-white/80 transition-colors font-body uppercase tracking-wider px-3 py-2 rounded border border-white/10 hover:border-white/30 bg-white/5 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      {designMdFileName ? "Replace" : "Upload .md"}
                      <input type="file" accept=".md,.markdown" onChange={handleDesignMdUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 1: Brand Name + Tagline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Brand Name (Required)</label>
                  <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g., Zenith Studios" className="input-multia w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Tagline / Hero Headline</label>
                  <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g., Design Beyond Limits" className="input-multia w-full px-4 py-3 text-sm" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Brief Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this brand/product do? e.g., A luxury watch brand..." rows={2} className="input-multia w-full px-4 py-3 text-sm resize-none custom-scrollbar" />
              </div>

              {/* Website Type */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Website Type</label>
                <div className="flex flex-wrap gap-2">
                  {["landing", "portfolio", "saas", "ecommerce", "agency", "product-showcase"].map(t => (
                    <button key={t} onClick={() => setWebsiteType(t)} className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                      websiteType === t ? "bg-white text-black border-white" : "bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white"
                    }`}>
                      {t.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Color Scheme</label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/20" />
                    <div>
                      <span className="text-[10px] text-white/30 font-body uppercase tracking-wider">Primary</span>
                      <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="block text-xs text-white/70 bg-transparent outline-none w-20 font-mono" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/20" />
                    <div>
                      <span className="text-[10px] text-white/30 font-body uppercase tracking-wider">Accent</span>
                      <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="block text-xs text-white/70 bg-transparent outline-none w-20 font-mono" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/20" />
                    <div>
                      <span className="text-[10px] text-white/30 font-body uppercase tracking-wider">Background</span>
                      <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="block text-xs text-white/70 bg-transparent outline-none w-20 font-mono" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fonts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Heading Font (Google Fonts name)</label>
                  <input type="text" value={headingFont} onChange={(e) => setHeadingFont(e.target.value)} placeholder="e.g., Playfair Display" className="input-multia w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Body Font (Google Fonts name)</label>
                  <input type="text" value={bodyFont} onChange={(e) => setBodyFont(e.target.value)} placeholder="e.g., Inter" className="input-multia w-full px-4 py-3 text-sm" />
                </div>
              </div>

              {/* Hero Media URL */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Hero Media URL (MP4 video or image link)</label>
                <input type="text" value={heroMediaUrl} onChange={(e) => setHeroMediaUrl(e.target.value)} placeholder="https://example.com/hero-video.mp4" className="input-multia w-full px-4 py-3 text-sm" />
              </div>

              {/* Additional Media URLs */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Additional Media URLs (Optional, up to 3)</label>
                <div className="space-y-2">
                  {additionalMediaUrls.map((url, i) => (
                    <input key={i} type="text" value={url} onChange={(e) => { const next = [...additionalMediaUrls]; next[i] = e.target.value; setAdditionalMediaUrls(next); }} placeholder={`Media URL ${i + 1} (image or video)`} className="input-multia w-full px-4 py-2 text-sm" />
                  ))}
                </div>
              </div>

              {/* Sections to Include */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Sections to Include</label>
                <div className="flex flex-wrap gap-2">
                  {["navbar", "hero", "features", "stats", "testimonials", "pricing", "showcase", "collection", "cta", "footer"].map(s => (
                    <button key={s} onClick={() => toggleSection(s)} className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                      websiteSections.includes(s) ? "bg-white text-black border-white" : "bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white"
                    }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glass Style */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Glass Effect Style</label>
                <div className="flex gap-2">
                  {["subtle", "strong", "both"].map(g => (
                    <button key={g} onClick={() => setGlassStyle(g)} className={`px-4 py-2 rounded text-sm transition-colors ${
                      glassStyle === g ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Intensity */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Animation Intensity: {animationIntensity}%</label>
                <input type="range" min={0} max={100} value={animationIntensity} onChange={(e) => setAnimationIntensity(Number(e.target.value))} className="w-full accent-white" />
                <div className="flex justify-between text-[10px] text-white/20 mt-1"><span>Minimal</span><span>Cinematic</span></div>
              </div>

              {/* Animation Names */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Animation Names (Optional — GSAP / Framer Motion)</label>
                <input type="text" value={animationNames} onChange={(e) => setAnimationNames(e.target.value)} placeholder="e.g., word-by-word blur, parallax scroll, staggered entrance, flip reveal" className="input-multia w-full px-4 py-3 text-sm" />
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Additional Details (Optional — anything extra)</label>
                <textarea value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)} placeholder="Add any extra context, inspiration links, specific section descriptions, brand values, etc. The AI will intelligently extract and place this information in the right layer." rows={4} className="input-multia w-full px-4 py-3 text-sm resize-none custom-scrollbar" />
              </div>

              {/* Reference Image */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Reference Screenshot (Optional)</label>
                <div className="flex items-center gap-4">
                  {referenceImages.length < 2 && (
                    <label className="flex items-center justify-center px-4 py-2 text-xs font-body uppercase tracking-wider rounded border border-white/10 cursor-pointer hover:bg-white/5">
                      <input type="file" accept="image/*" multiple onChange={handleMultipleImageUpload} className="hidden" disabled={isLoading} />
                      Upload Screenshot
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

          {mode === "awwwards_website" && (
            <div className="mb-6 space-y-6">
              {/* DESIGN.md Upload */}
              <div className="p-4 border border-dashed border-white/15 rounded-lg bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs text-white/40 font-body uppercase tracking-[0.2em] mb-1">Import DESIGN.md</label>
                    <p className="text-[11px] text-white/20 font-body">Upload a design system file to auto-fill colors, fonts, and brand details</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {designMdFileName && (
                      <span className="text-[11px] text-green-400/70 font-mono flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                        {designMdFileName}
                      </span>
                    )}
                    <label className="cursor-pointer text-[11px] text-white/40 hover:text-white/80 transition-colors font-body uppercase tracking-wider px-3 py-2 rounded border border-white/10 hover:border-white/30 bg-white/5 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      {designMdFileName ? "Replace" : "Upload .md"}
                      <input type="file" accept=".md,.markdown" onChange={handleDesignMdUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Intro note */}
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
                <p className="text-[11px] text-white/40 font-body leading-relaxed">
                  Generates one massive, copy-paste-ready build prompt for an <span className="text-white/70">Awwwards-caliber</span> site —
                  React/Next + React Three Fiber (Three.js/WebGL), GLSL shaders, Lenis smooth scroll, GSAP ScrollTrigger, Lottie & multi-layer parallax.
                  Paste the result into ChatGPT or Claude Code to build the full project.
                </p>
              </div>

              {/* Row 1: Brand Name + Tagline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Brand Name (Required)</label>
                  <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g., Zenith Studios" className="input-multia w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Tagline / Hero Headline</label>
                  <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g., Design Beyond Limits" className="input-multia w-full px-4 py-3 text-sm" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Brief Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this brand/product do? e.g., A luxury watch brand..." rows={2} className="input-multia w-full px-4 py-3 text-sm resize-none custom-scrollbar" />
              </div>

              {/* Site Category */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Site Category</label>
                <div className="flex flex-wrap gap-2">
                  {SITE_CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setSiteCategory(c.id)} className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                      siteCategory === c.id ? "bg-white text-black border-white" : "bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white"
                    }`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Signature Moment */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Signature Moment (the ONE unforgettable interaction)</label>
                <input type="text" value={signatureMoment} onChange={(e) => setSignatureMoment(e.target.value)} placeholder="e.g., a scroll-scrubbed 3D product that explodes into parts, particle hero that reforms into the logo..." className="input-multia w-full px-4 py-3 text-sm" />
              </div>

              {/* 3D Asset Strategy */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">3D Asset Strategy</label>
                <div className="flex flex-wrap gap-2">
                  {ASSET_STRATEGIES.map(s => (
                    <button key={s.id} onClick={() => setAssetStrategy(s.id)} className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                      assetStrategy === s.id ? "bg-white text-black border-white" : "bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white"
                    }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-white/20 mt-2 font-body">
                  The coding agent can write shaders & geometry but cannot create 3D models or textures. Default builds the hero from code only — always renders cleanly.
                </p>
                {assetStrategy === "model" && (
                  <input
                    type="text"
                    value={model3dUrl}
                    onChange={(e) => setModel3dUrl(e.target.value)}
                    placeholder="https://example.com/model.glb (GLB/GLTF the agent should load)"
                    className="input-multia w-full px-4 py-3 text-sm mt-3"
                  />
                )}
              </div>

              {/* Colors */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Color Scheme</label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/20" />
                    <div>
                      <span className="text-[10px] text-white/30 font-body uppercase tracking-wider">Primary</span>
                      <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="block text-xs text-white/70 bg-transparent outline-none w-20 font-mono" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/20" />
                    <div>
                      <span className="text-[10px] text-white/30 font-body uppercase tracking-wider">Accent</span>
                      <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="block text-xs text-white/70 bg-transparent outline-none w-20 font-mono" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/20" />
                    <div>
                      <span className="text-[10px] text-white/30 font-body uppercase tracking-wider">Background</span>
                      <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="block text-xs text-white/70 bg-transparent outline-none w-20 font-mono" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fonts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Heading Font (Google Fonts name)</label>
                  <input type="text" value={headingFont} onChange={(e) => setHeadingFont(e.target.value)} placeholder="e.g., Clash Display, Playfair Display" className="input-multia w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Body Font (Google Fonts name)</label>
                  <input type="text" value={bodyFont} onChange={(e) => setBodyFont(e.target.value)} placeholder="e.g., Inter, Satoshi" className="input-multia w-full px-4 py-3 text-sm" />
                </div>
              </div>

              {/* WebGL / Motion Features */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">WebGL & Motion Techniques</label>
                <div className="flex flex-wrap gap-2">
                  {WEBGL_FEATURES.map(f => (
                    <button key={f.id} onClick={() => toggleWebglFeature(f.id)} className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                      webglFeatures.includes(f.id) ? "bg-white text-black border-white" : "bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white"
                    }`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections to Include */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Sections to Include</label>
                <div className="flex flex-wrap gap-2">
                  {["navbar", "hero", "features", "stats", "testimonials", "pricing", "showcase", "collection", "cta", "footer"].map(s => (
                    <button key={s} onClick={() => toggleSection(s)} className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                      websiteSections.includes(s) ? "bg-white text-black border-white" : "bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white"
                    }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hero Media URL */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Hero Media URL (MP4 video or image link)</label>
                <input type="text" value={heroMediaUrl} onChange={(e) => setHeroMediaUrl(e.target.value)} placeholder="https://example.com/hero-video.mp4" className="input-multia w-full px-4 py-3 text-sm" />
              </div>

              {/* Additional Media URLs */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Additional Media URLs (Optional, up to 3)</label>
                <div className="space-y-2">
                  {additionalMediaUrls.map((url, i) => (
                    <input key={i} type="text" value={url} onChange={(e) => { const next = [...additionalMediaUrls]; next[i] = e.target.value; setAdditionalMediaUrls(next); }} placeholder={`Media URL ${i + 1} (image or video)`} className="input-multia w-full px-4 py-2 text-sm" />
                  ))}
                </div>
              </div>

              {/* Reference Sites */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Reference Sites / Vibes (Optional)</label>
                <input type="text" value={referenceSites} onChange={(e) => setReferenceSites(e.target.value)} placeholder="e.g., lusion.co, active-theory feel, Bruno Simon physics playground, Apple AirPods scroll..." className="input-multia w-full px-4 py-3 text-sm" />
              </div>

              {/* Animation Intensity */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Animation Intensity: {animationIntensity}%</label>
                <input type="range" min={0} max={100} value={animationIntensity} onChange={(e) => setAnimationIntensity(Number(e.target.value))} className="w-full accent-white" />
                <div className="flex justify-between text-[10px] text-white/20 mt-1"><span>Subtle</span><span>Awwwards SOTD</span></div>
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Additional Details (Optional — anything extra)</label>
                <textarea value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)} placeholder="Add any extra context, brand values, specific section ideas, copy, or technical constraints. The AI will intelligently place this across the right layers." rows={4} className="input-multia w-full px-4 py-3 text-sm resize-none custom-scrollbar" />
              </div>

              {/* Reference Screenshot */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Reference Screenshot (Optional, Max 2)</label>
                <div className="flex items-center gap-4">
                  {referenceImages.length < 2 && (
                    <label className="flex items-center justify-center px-4 py-2 text-xs font-body uppercase tracking-wider rounded border border-white/10 cursor-pointer hover:bg-white/5">
                      <input type="file" accept="image/*" multiple onChange={handleMultipleImageUpload} className="hidden" disabled={isLoading} />
                      Upload Screenshot
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

          {mode === "deep_research" && (
            <div className="mb-6 space-y-6">
              {/* Row 1: Business Name + Industry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Business Name (Required)</label>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., Bak'd, TechFlow, Zenith Studios" className="input-multia w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Industry / Category</label>
                  <input type="text" value={researchIndustry} onChange={(e) => setResearchIndustry(e.target.value)} placeholder="e.g., Bakery, SaaS, Fashion, Healthcare" className="input-multia w-full px-4 py-3 text-sm" />
                </div>
              </div>

              {/* Row 2: Market Region + Target Audience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Market Region</label>
                  <input type="text" value={marketRegion} onChange={(e) => setMarketRegion(e.target.value)} placeholder="e.g., Mumbai India, North America, Global" className="input-multia w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Target Audience (Optional)</label>
                  <input type="text" value={researchTargetAudience} onChange={(e) => setResearchTargetAudience(e.target.value)} placeholder="e.g., B2B enterprises, Gen-Z consumers, Health-conscious millennials" className="input-multia w-full px-4 py-3 text-sm" />
                </div>
              </div>

              {/* Services */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Services / Products</label>
                <textarea value={researchServices} onChange={(e) => setResearchServices(e.target.value)} placeholder="List your main services or products. e.g., Custom cakes, pastries, celebration cakes, bulk gifting, catering..." rows={3} className="input-multia w-full px-4 py-3 text-sm resize-none custom-scrollbar" />
              </div>

              {/* Competitor References */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Competitor References (Optional)</label>
                <textarea value={competitorReferences} onChange={(e) => setCompetitorReferences(e.target.value)} placeholder="Competitor websites, brand names, or references you like. e.g., Theobroma, Iyengar Bakery, www.competitor.com..." rows={2} className="input-multia w-full px-4 py-3 text-sm resize-none custom-scrollbar" />
              </div>

              {/* Research Domains */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Research Domains</label>
                <div className="flex flex-wrap gap-2">
                  {RESEARCH_DOMAINS.map(domain => (
                    <button
                      key={domain.id}
                      onClick={() => {
                        if (domain.id === "full_research") {
                          setResearchDomains(["full_research"]);
                        } else {
                          setResearchDomains(prev => {
                            const without = prev.filter(d => d !== "full_research");
                            return without.includes(domain.id)
                              ? without.filter(d => d !== domain.id)
                              : [...without, domain.id];
                          });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors border flex items-center gap-1.5 ${
                        researchDomains.includes(domain.id)
                          ? "bg-white text-black border-white"
                          : "bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white"
                      }`}
                    >
                      <span>{domain.icon}</span>
                      {domain.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-white/20 mt-2 font-body">Select specific research areas or &quot;Full Research&quot; for all sections</p>
              </div>

              {/* Business Goal */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Business Goal (Optional)</label>
                <textarea value={researchBusinessGoal} onChange={(e) => setResearchBusinessGoal(e.target.value)} placeholder="e.g., Increase walk-ins and online orders, build brand awareness, generate B2B leads..." rows={2} className="input-multia w-full px-4 py-3 text-sm resize-none custom-scrollbar" />
              </div>

              {/* Brand Positioning */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Brand Positioning (Optional)</label>
                <textarea value={researchBrandPositioning} onChange={(e) => setResearchBrandPositioning(e.target.value)} placeholder="How should the brand be perceived? e.g., Fresh, comforting, premium quality with warm neighborhood appeal..." rows={2} className="input-multia w-full px-4 py-3 text-sm resize-none custom-scrollbar" />
              </div>

              {/* Tone of Voice */}
              <div>
                <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-2">Tone of Voice (Optional)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {TONE_PRESETS.map(tone => (
                    <button
                      key={tone}
                      onClick={() => setResearchTone(prev => prev === tone ? "" : tone)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                        researchTone === tone
                          ? "bg-white text-black border-white"
                          : "bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white"
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
                <input type="text" value={researchTone} onChange={(e) => setResearchTone(e.target.value)} placeholder="Or type a custom tone..." className="input-multia w-full px-4 py-2 text-sm" />
              </div>
            </div>
          )}

          {/* Visual style picker (Multi-select) — hidden for 3D Website and Deep Research modes */}
          {mode !== "3d_website" && mode !== "awwwards_website" && mode !== "deep_research" && <div className="mb-8">
            <label className="block text-xs text-white/30 font-body uppercase tracking-[0.2em] mb-3">Styles (Select Multiple)</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => toggleStyle(style.id)}
                  title={style.directive}
                  className={`relative h-20 rounded-lg overflow-hidden border transition-all text-left ${
                    selectedStyles.includes(style.id)
                      ? "border-white ring-1 ring-white"
                      : "border-white/10 hover:border-white/40"
                  }`}
                >
                  <div className="absolute inset-0" style={{ background: style.swatch }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute bottom-1.5 left-2 right-1 text-[11px] font-body text-white/90 leading-tight">{style.label}</span>
                  {selectedStyles.includes(style.id) && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black text-[10px] flex items-center justify-center">✓</span>
                  )}
                </button>
              ))}

              {customStyles.map((style) => (
                <div key={style.id} className="relative group">
                  <button
                    onClick={() => toggleStyle(style.id)}
                    title={style.directive}
                    className={`relative w-full h-20 rounded-lg overflow-hidden border transition-all text-left ${
                      selectedStyles.includes(style.id)
                        ? "border-white ring-1 ring-white"
                        : "border-white/10 hover:border-white/40"
                    }`}
                  >
                    <img src={style.thumbnail} alt={style.label} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute bottom-1.5 left-2 right-1 text-[11px] font-body text-white/90 leading-tight">{style.label}</span>
                    {selectedStyles.includes(style.id) && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black text-[10px] flex items-center justify-center">✓</span>
                    )}
                  </button>
                  <button
                    onClick={() => removeCustomStyle(style.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-[10px] rounded-full border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center"
                    title="Delete custom style"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add custom style from a reference image */}
              <label
                className={`relative h-20 rounded-lg border border-dashed border-white/20 hover:border-white/50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors ${
                  isExtractingStyle ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStyleImageUpload}
                  className="hidden"
                  disabled={isLoading || isExtractingStyle}
                />
                <span className="text-lg text-white/40 leading-none">＋</span>
                <span className="text-[10px] text-white/40 font-body uppercase tracking-wider text-center px-1">
                  {isExtractingStyle ? "Analyzing..." : "From Image"}
                </span>
              </label>
            </div>
            {styleError && <p className="text-xs text-red-400 mt-2 font-body">{styleError}</p>}
          </div>}

          {/* Target image model selector — hidden for 3D Website and Deep Research modes */}
          {mode !== "3d_website" && mode !== "awwwards_website" && mode !== "deep_research" && <div className="mb-8">
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
          </div>}

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
