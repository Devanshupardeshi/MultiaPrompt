import { NextRequest, NextResponse } from "next/server";
import { extractStyle } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string" || !image.startsWith("data:")) {
      return NextResponse.json(
        { error: "A base64 image data URL is required" },
        { status: 400 }
      );
    }

    const result = await extractStyle(image);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Extract style API error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to extract style";

    if (message.includes("No Gemini API keys")) {
      return NextResponse.json(
        { error: "API keys not configured. Add your Gemini keys to .env.local" },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
