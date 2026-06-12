import { NextRequest, NextResponse } from "next/server";
import { generatePrompt } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = body;

    // Basic validation based on mode
    if (payload.mode === "standard" && (!payload.description || !payload.description.trim())) {
      return NextResponse.json({ error: "Description is required for standard mode" }, { status: 400 });
    }
    if (payload.mode === "face_swap" && (!payload.sourceFaceImage || !payload.targetPoseImage)) {
      return NextResponse.json({ error: "Source Face and Target Pose images are required for face swap mode" }, { status: 400 });
    }
    if (payload.mode === "mockup" && (!payload.logoImage)) {
      return NextResponse.json({ error: "Logo image is required for mockup mode" }, { status: 400 });
    }

    const result = await generatePrompt(payload);

    return NextResponse.json({ json: result });
  } catch (error) {
    console.error("Generate API error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate prompt";

    // Check if it's a config error
    if (message.includes("No Gemini API keys")) {
      return NextResponse.json(
        { error: "API keys not configured. Add your Gemini keys to .env.local" },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
