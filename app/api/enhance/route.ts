import { NextRequest, NextResponse } from "next/server";
import { enhanceDescription } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const enhanced = await enhanceDescription(description.trim());

    return NextResponse.json({ enhanced });
  } catch (error) {
    console.error("Enhance API error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to enhance description";

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
