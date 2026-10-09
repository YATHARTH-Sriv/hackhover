import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const model = process.env.OLLAMA_MODEL ?? "gemma3:4b";
  let ollamaReady = false;
  try {
    const base = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
    const response = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(1500), cache: "no-store" });
    if (response.ok) {
      const result = (await response.json()) as { models?: Array<{ name?: string }> };
      ollamaReady = (result.models ?? []).some((entry) => entry.name === model);
    }
  } catch { /* Service not running yet. */ }
  return NextResponse.json({
    ollamaReady,
    backboardConfigured: Boolean(process.env.BACKBOARD_API_KEY),
    elevenlabsConfigured: Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID),
    model,
  });
}
