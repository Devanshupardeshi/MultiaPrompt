// Gemini API integration with round-robin key rotation
// Keys are read from environment variables GEMINI_API_KEY_1 through GEMINI_API_KEY_5

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

const BANANAVAULT_SYSTEM_PROMPT = `You are the BananaVault Prompt Engine — a professional JSON prompt generator for AI image generation. 

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

## Rules:
1. ALWAYS output valid JSON. Nothing else.
2. Fill EVERY field with detailed, specific values — never leave generic placeholders.
3. The "prompt" field should be a rich, dense paragraph (200+ words) describing every visual detail.
4. The "negative_prompt" should include 10-20 specific items to avoid.
5. Adapt your output to the selected style preset.
6. If a character name is provided, add detailed identity anchoring in the subject fields.
7. Be cinematographically specific: mention focal lengths (85mm, 35mm), apertures (f/1.8, f/5.6), ISO values.
8. Include realistic skin textures, material descriptions, and environmental details.
9. DO NOT wrap in markdown code blocks. Output raw JSON only.`;

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
          contents: [
            {
              role: "user",
              parts: [{ text: `Enhance this idea for an image prompt: ${description}` }],
            },
          ],
          systemInstruction: {
            parts: [{ text: ENHANCE_SYSTEM_PROMPT }],
          },
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

    if (!text) {
      throw new Error("No content in Gemini enhance response");
    }

    return text.trim();
  } catch (error) {
    if (retryCount < maxRetries && error instanceof Error && error.message.includes("429")) {
      return enhanceDescription(description, retryCount + 1);
    }
    throw error;
  }
}

export async function generatePrompt(
  description: string,
  style: string,
  characterName: string,
  useCharacter: boolean,
  retryCount = 0,
  referenceImage?: string
): Promise<string> {
  const maxRetries = 5;
  const apiKey = getNextKey();

  const userMessage = `Style preset: ${style}
${useCharacter && characterName ? `Character name for consistency: ${characterName}` : "No character consistency needed."}

User's description:
${description}

${referenceImage ? "A reference image has been provided. Please analyze it carefully and incorporate its visual elements, lighting, composition, and subject details into the prompt output." : ""}
Generate the complete BananaVault JSON prompt now.`;

  const parts: any[] = [{ text: userMessage }];

  if (referenceImage) {
    const matches = referenceImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      parts.push({
        inlineData: {
          mimeType: matches[1],
          data: matches[2]
        }
      });
    }
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: parts,
            },
          ],
          systemInstruction: {
            parts: [{ text: BANANAVAULT_SYSTEM_PROMPT }],
          },
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (response.status === 429 && retryCount < maxRetries) {
      // Rate limited — try next key
      console.log(`Rate limited on key index ${currentKeyIndex - 1}, rotating...`);
      return generatePrompt(description, style, characterName, useCharacter, retryCount + 1, referenceImage);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No content in Gemini response");
    }

    // Clean potential markdown wrappers
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    }
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    // Validate it's proper JSON
    JSON.parse(cleaned);

    return cleaned;
  } catch (error) {
    if (retryCount < maxRetries && error instanceof Error && error.message.includes("429")) {
      return generatePrompt(description, style, characterName, useCharacter, retryCount + 1, referenceImage);
    }
    throw error;
  }
}
