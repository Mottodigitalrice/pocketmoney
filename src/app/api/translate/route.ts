import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/openrouter";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, from } = await req.json();

    if (!text || typeof text !== "string" || !["en", "ja"].includes(from)) {
      return NextResponse.json(
        { error: "text (string) and from ('en' | 'ja') required" },
        { status: 400 }
      );
    }

    const targetLang = from === "en" ? "Japanese" : "English";
    const sourceLang = from === "en" ? "English" : "Japanese";

    const translated = await chat(
      [
        {
          role: "system",
          content: `You are a translator for a children's chore/task app. Translate the given ${sourceLang} task name into ${targetLang}. Reply with ONLY the translated text, nothing else. Keep it short and natural - this is a household chore name that children will read.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      "fast"
    );

    return NextResponse.json({ translated: translated.trim() });
  } catch (error) {
    console.error("Translate API error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
