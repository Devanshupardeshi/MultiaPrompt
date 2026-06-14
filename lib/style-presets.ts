// Curated visual style library.
// Each preset carries a precise aesthetic directive that is injected into the
// generation request, so styles are applied as exact lighting/grading/lens
// instructions instead of single-word hints.

export interface StylePreset {
  id: string;
  label: string;
  /** CSS background used as the thumbnail swatch in the visual picker. */
  swatch: string;
  /** Dense aesthetic directive: lighting, color grading, camera character, texture, mood. */
  directive: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "minimalist",
    label: "Minimalist",
    swatch: "linear-gradient(135deg, #f5f5f4 0%, #d6d3d1 100%)",
    directive:
      "Clean minimalist aesthetic: vast negative space, restrained monochromatic or duotone palette, a single clearly isolated subject, soft even diffused lighting with gentle shadows, matte surfaces, precise geometric composition, zero clutter, gallery-like calm.",
  },
  {
    id: "luxury",
    label: "Luxury",
    swatch: "linear-gradient(135deg, #1a1206 0%, #8a6d1f 55%, #d4af37 100%)",
    directive:
      "High-end luxury aesthetic: rich deep tones with gold, champagne, and obsidian accents, polished reflective materials such as marble, brushed metal, and silk, dramatic low-key lighting with controlled speculars, shallow depth of field with an 85mm f/1.4 character, immaculate styling, editorial fashion-magazine refinement.",
  },
  {
    id: "corporate",
    label: "Corporate",
    swatch: "linear-gradient(135deg, #dbeafe 0%, #3b82f6 55%, #1e3a5f 100%)",
    directive:
      "Polished corporate aesthetic: bright clean high-key lighting, neutral blue-grey palette, modern glass-and-steel office environments, confident professional subjects, crisp 35mm f/4 clarity, balanced composition, optimistic trustworthy tone, premium commercial polish without sterility.",
  },
  {
    id: "modern",
    label: "Modern",
    swatch: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 50%, #f97316 100%)",
    directive:
      "Contemporary modern aesthetic: bold simple shapes, saturated accent colors against neutral bases, clean lines and flat planes, soft directional daylight, asymmetric yet balanced composition, fresh editorial energy, smooth uncluttered surfaces.",
  },
  {
    id: "premium",
    label: "Premium",
    swatch: "linear-gradient(135deg, #0f0f10 0%, #3f3f46 55%, #a1a1aa 100%)",
    directive:
      "Premium product aesthetic: studio-grade three-point lighting on a soft gradient backdrop, deep contrast with controlled highlights, immaculate material rendering across matte, gloss, and metal, centered hero composition, subtle reflections on a seamless surface, advertising-campaign polish.",
  },
  {
    id: "futuristic",
    label: "Futuristic",
    swatch: "linear-gradient(135deg, #0a0a1f 0%, #312e81 55%, #06b6d4 100%)",
    directive:
      "Futuristic aesthetic: sleek metallic and glass surfaces, cool cyan-magenta-violet accent lighting, neon rim light and holographic glows, dark atmospheric environments with volumetric haze, hard sci-fi industrial design language, ultra-clean precision.",
  },
  {
    id: "vintage",
    label: "Vintage",
    swatch: "linear-gradient(135deg, #d9c8a9 0%, #b08d57 55%, #6b4f2a 100%)",
    directive:
      "Vintage film aesthetic: warm faded color grading with lifted blacks and muted highlights, Kodachrome and Portra-like tones, visible organic film grain, soft halation around highlights, period-appropriate styling and props, nostalgic golden cast, slight vignetting.",
  },
  {
    id: "industrial",
    label: "Industrial",
    swatch: "linear-gradient(135deg, #292524 0%, #57534e 55%, #78716c 100%)",
    directive:
      "Industrial aesthetic: raw concrete, weathered steel, exposed brick and rivets, moody desaturated palette with rust and graphite tones, hard directional light through factory windows, gritty textures with realistic wear, strong geometric structure.",
  },
  {
    id: "streetwear",
    label: "Streetwear",
    swatch: "linear-gradient(135deg, #18181b 0%, #dc2626 55%, #facc15 100%)",
    directive:
      "Streetwear editorial aesthetic: urban environments with concrete, chain-link, and neon signage, bold confident poses, on-camera flash or harsh sunlight with hard shadows, punchy saturated grade with crushed blacks, 35mm documentary energy, authentic street-culture styling.",
  },
  {
    id: "tech",
    label: "Tech",
    swatch: "linear-gradient(135deg, #020617 0%, #0f766e 55%, #22d3ee 100%)",
    directive:
      "Tech product aesthetic: dark gradient backdrops with precise blue and teal accent lighting, immaculate device surfaces with micro-texture detail, floating hero compositions, thin light streaks and subtle glow, keynote-presentation polish, extreme edge sharpness.",
  },
  {
    id: "elegant",
    label: "Elegant",
    swatch: "linear-gradient(135deg, #fdf2f8 0%, #e7c6cf 55%, #9f8a8f 100%)",
    directive:
      "Elegant aesthetic: soft romantic lighting with gentle falloff, refined neutral palette of ivory, blush, and taupe, graceful flowing lines and fabrics, shallow dreamy depth of field, delicate detail rendering, quiet sophistication, timeless editorial composition.",
  },
  {
    id: "glassmorphism",
    label: "Glassmorphism",
    swatch: "linear-gradient(135deg, #c7d2fe 0%, #a5f3fc 50%, #f0abfc 100%)",
    directive:
      "Glassmorphism aesthetic: translucent frosted-glass surfaces with visible blur and refraction, layered depth, soft pastel gradients backlighting the glass, delicate specular highlights along edges, airy weightless composition, clean futuristic minimalism.",
  },
  {
    id: "3d-render",
    label: "3D Render",
    swatch: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #c4b5fd 100%)",
    directive:
      "High-end 3D render aesthetic: physically-based materials with accurate roughness and subsurface scattering, global illumination with soft ambient occlusion, flawless geometry, production-renderer lighting quality, studio HDRI reflections, pristine surfaces with crisp anti-aliased edges.",
  },
  {
    id: "photorealistic",
    label: "Photorealistic",
    swatch: "linear-gradient(135deg, #78716c 0%, #a8a29e 55%, #e7e5e4 100%)",
    directive:
      "True-to-life photographic realism: accurate natural lighting and white balance, realistic skin with visible pores and natural imperfections, physically correct materials and reflections, documentary color fidelity, subtle sensor grain, real-world optics with believable depth of field, zero stylization or artificial gloss.",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    swatch: "linear-gradient(135deg, #0c1821 0%, #134e4a 55%, #b45309 100%)",
    directive:
      "Cinematic film aesthetic: anamorphic widescreen framing sensibility, teal-orange or moody monochrome grade, dramatic motivated key light with deep shadows, atmospheric haze and practical lights rendered as bokeh, 35mm film texture, blockbuster production value, emotive storytelling composition.",
  },
];
