import { NextRequest, NextResponse } from "next/server";
import { chat, chatStream, ModelKey } from "@/lib/openrouter";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, model = "fast", stream = false } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array required" },
        { status: 400 }
      );
    }

    if (stream) {
      // Return streaming response
      const streamResponse = await chatStream(messages, model as ModelKey);

      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          for await (const chunk of streamResponse) {
            const text = chunk.choices[0]?.delta?.content || "";
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } else {
      // Return complete response
      const content = await chat(messages, model as ModelKey);
      return NextResponse.json({ content });
    }
  } catch (error) {
    console.error("AI API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
