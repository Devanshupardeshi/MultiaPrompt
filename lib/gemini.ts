// Gemini API integration with round-robin key rotation
// Keys are read from environment variables GEMINI_API_KEY_1 through GEMINI_API_KEY_5

import { GeneratePayload } from "@/components/prompt-studio/input-form";

let currentKeyIndex = 0;

function getApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && key.trim()) {
      keys.push(key.trim());
    }
  }
  return keys;
}

function getNextKey(): string {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("No Gemini API keys configured. Add GEMINI_API_KEY_1 through GEMINI_API_KEY_5 to .env.local");
  }
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
}

function getSystemPrompt(payload: GeneratePayload): string {
  const basePrompt = `You are the BananaVault Prompt Engine — a professional JSON prompt generator for AI image generation. 

When the user describes what they want, you MUST output ONLY a valid JSON object following the BananaVault schema below. No explanation, no markdown, no code fences — just raw JSON.

## BananaVault JSON Schema

{
  "prompt": "A dense, ultra-descriptive narrative merging subject, outfit, environment, and camera details. Use highly specific language to force realism.",
  
  "negative_prompt": "Comma-separated list of things to avoid",
  
  "settings": {
    "resolution": "e.g., 1024x1792",
    "style": "e.g., photorealistic, documentary realism",
    "lighting": "e.g., natural golden hour",
    "camera_angle": "e.g., eye-level, slight high angle",
    "depth_of_field": "e.g., shallow depth of field, f/2.0",
    "quality": "e.g., high detail, unretouched skin"
  },

  "task": "High-level goal description",
  "character_reference": "Character name if provided, otherwise null",
  
  "output": {
    "type": "single_image or multi-panel",
    "layout": "1x1 or 2x2_grid etc",
    "aspect_ratio": "3:4, 16:9, etc",
    "resolution": "ultra_high or medium",
    "camera_style": "smartphone_front_camera, professional_dslr, etc"
  },

  "image_quality_simulation": {
    "sharpness": "tack_sharp, slightly_soft_edges, etc",
    "noise": "clean_digital, visible_film_grain, unfiltered_sensor_grain",
    "compression_artifacts": false,
    "dynamic_range": "hdr_capable or limited",
    "white_balance": "neutral, slightly_warm, cool_fluorescent",
    "lens_imperfections": ["subtle chromatic aberration", "minor vignetting"]
  },

  "subject": {
    "identity": "Description of the person/subject",
    "biometric_fingerprint": "Technical bone structure details",
    "facial_geometries": "Nose/eye/lip geometry details",
    "anchored_flaws": "Unique imperfections like moles, scars",
    "appearance": {
      "gender_or_type": "male, female, etc",
      "age_or_condition": "estimated age or stage",
      "ethnicity_or_origin": "ethnic background",
      "skin_texture": "realistic, visible pores, natural imperfections",
      "hair": "detailed hair description",
      "makeup": "minimal, natural, etc",
      "expression": "candid smile, serious gaze, etc"
    },
    "outfit": {
      "type": "casual, formal, sporty, etc",
      "top": "specific top description",
      "bottom": "specific bottom description",
      "colors": "color palette"
    }
  },

  "environment": {
    "location": "where the scene takes place",
    "background": "what is behind the subject",
    "lighting": {
      "type": "natural, artificial, mixed",
      "quality": "harsh, soft, uneven, dramatic"
    }
  },

  "explicit_restrictions": {
    "no_professional_retouching": true,
    "no_studio_lighting": false,
    "no_ai_beauty_filters": true,
    "no_high_end_camera_look": false
  }
}

## Global Realism Requirements (MANDATORY FOR ALL MODES):
- Ultra-realistic output
- Commercial-grade quality
- Accurate lighting and shadows
- Physically realistic materials
- High-detail textures
- Correct reflections
- Proper depth of field
- Real-world proportions
- Professional photography standards
- High-resolution presentation
- AVOID: Cartoon appearance, AI artifacts, distorted hands/faces, incorrect logo placement, unrealistic materials, hallucinated brand elements.

## Rules:
1. ALWAYS output valid JSON. Nothing else.
2. Fill EVERY field with detailed, specific values — never leave generic placeholders.
3. The "prompt" field should be a rich, dense paragraph (200+ words) describing every visual detail.
4. The "negative_prompt" should include 10-20 specific items to avoid.
5. Be cinematographically specific: mention focal lengths (85mm, 35mm), apertures (f/1.8, f/5.6), ISO values.
6. Include realistic skin textures, material descriptions, and environmental details.
7. DO NOT wrap in markdown code blocks. Output raw JSON only.`;

  return basePrompt;
}

const ENHANCE_SYSTEM_PROMPT = `You are a professional prompt engineer specializing in AI image generation.
Your task is to take a simple, short user idea and expand it into a rich, detailed, and highly descriptive paragraph.
Add cinematography details, lighting setup, textures, camera angles, and atmosphere.
Do not wrap your output in quotes. Return a single plain text paragraph (2-4 sentences max).`;

export async function enhanceDescription(description: string, retryCount = 0): Promise<string> {
  const maxRetries = 5;
  const apiKey = getNextKey();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `Enhance this idea for an image prompt: ${description}` }] }],
          systemInstruction: { parts: [{ text: ENHANCE_SYSTEM_PROMPT }] },
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 1024,
            responseMimeType: "text/plain",
          },
        }),
      }
    );

    if (response.status === 429 && retryCount < maxRetries) {
      console.log(`Rate limited on enhance, key index ${currentKeyIndex - 1}, rotating...`);
      return enhanceDescription(description, retryCount + 1);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("No content in Gemini enhance response");
    return text.trim();
  } catch (error) {
    if (retryCount < maxRetries && error instanceof Error && error.message.includes("429")) {
      return enhanceDescription(description, retryCount + 1);
    }
    throw error;
  }
}

export async function generatePrompt(payload: GeneratePayload, retryCount = 0): Promise<string> {
  const maxRetries = 5;
  const apiKey = getNextKey();

  let userMessage = `Selected Styles to Blend: ${payload.styles.join(", ")}\n`;

  const parts: any[] = [];

  const addImagePart = (base64String: string) => {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      parts.push({
        inlineData: {
          mimeType: matches[1],
          data: matches[2]
        }
      });
    }
  };

  if (payload.mode === "standard") {
    userMessage += `${payload.useCharacter && payload.characterName ? `Character name for consistency: ${payload.characterName}\n` : ""}`;

    if (payload.referenceImages && payload.referenceImages.length > 0) {
      userMessage += `[IMPORTANT: Reference image(s) are attached.
Analyze the attached reference image(s) and determine the primary focus of each:
- If an image primarily features a prominent face/portrait, treat it as a FACE REFERENCE. You MUST describe the character to exactly match that face's likeness.
- If an image primarily features a pose, landscape, or aesthetic scene, treat it as a STYLE/POSE REFERENCE. Extract its lighting, mood, color grading, pose, and camera style, but DO NOT copy the specific subjects.
Apply these aesthetics and character details to the user's description below.]\n`;
      payload.referenceImages.forEach(img => addImagePart(img));
    }

    userMessage += `\nUser's description (THIS IS THE PRIMARY SUBJECT/ACTION):\n${payload.description}\n`;
  } else if (payload.mode === "face_swap") {
    userMessage += `\n[MODE: FACE SWAP]
INSTRUCTIONS:
- Source Identity = Uploaded Face Image (First attached image).
- Target Pose = Uploaded Reference Image (Second attached image).
- Task = Replace the face/person in the target image with the exact person from the source image while preserving pose, camera angle, body position, lighting, and composition.
- NEVER generate a different face.
- NEVER alter age, gender, facial structure, skin tone, hairstyle, or identity unless explicitly requested.
- Face swap accuracy should be prioritized over artistic interpretation.
`;
    if (payload.description) {
      userMessage += `\nAdditional user instructions: ${payload.description}\n`;
    }

    if (payload.sourceFaceImage) addImagePart(payload.sourceFaceImage);
    if (payload.targetPoseImage) addImagePart(payload.targetPoseImage);

  } else if (payload.mode === "mockup") {
    userMessage += `\n[MODE: MOCKUP GENERATION]
INSTRUCTIONS:
- Use the uploaded logo/design exactly. Do not redesign the logo or modify brand elements.
- Generate ultra-realistic commercial-quality mockups.
`;
    if (payload.logoImage) {
      userMessage += `- First attached image: Logo/Design. Priority 1.\n`;
      addImagePart(payload.logoImage);
    }

    if (payload.mockupReferenceImage) {
      userMessage += `- Second attached image: Mockup Reference. Recreate this reference mockup style as accurately as possible (materials, environment, camera angle). Priority 2.\n`;
      addImagePart(payload.mockupReferenceImage);
    } else if (payload.logoDescription) {
      userMessage += `- Logo description provided: "${payload.logoDescription}". Select the most relevant presentation style (e.g. Packaging, Business cards, Apparel) based on this description.\n`;
    }

    if (payload.mockupCount && payload.mockupCount > 1) {
      userMessage += `\n- The user requested ${payload.mockupCount} mockups. You MUST design the prompt to generate a single image that is a COLLAGE or GRID layout showing ${payload.mockupCount} different variations/angles of the mockup in the same image.
- Set output.type to "multi-panel" and output.layout to describe the grid (e.g., "2x2_grid", "1x3_grid").
- In the "prompt" field, explicitly start by asking for a "Split-screen grid layout showing ${payload.mockupCount} different mockup variations...".\n`;
    }
  }

  userMessage += `\nGenerate the complete BananaVault JSON prompt now.`;
  parts.unshift({ text: userMessage });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: parts }],
          systemInstruction: { parts: [{ text: getSystemPrompt(payload) }] },
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192, // Increased for array generation
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (response.status === 429 && retryCount < maxRetries) {
      console.log(`Rate limited on key index ${currentKeyIndex - 1}, rotating...`);
      return generatePrompt(payload, retryCount + 1);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No content in Gemini response");
    }

    // Clean potential markdown wrappers
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
    if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    // Validate it's proper JSON
    JSON.parse(cleaned);

    return cleaned;
  } catch (error) {
    if (retryCount < maxRetries && error instanceof Error && error.message.includes("429")) {
      return generatePrompt(payload, retryCount + 1);
    }
    throw error;
  }
}
