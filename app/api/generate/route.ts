import { NextRequest, NextResponse } from "next/server";
import { generatePrompt } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, style, characterName, useCharacter, referenceImages } = body;

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const result = await generatePrompt(
      description,
      style || "hyper-realism",
      characterName || "",
      useCharacter || false,
      0, // retryCount
      referenceImages
    );

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
