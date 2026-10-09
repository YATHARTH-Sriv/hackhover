import { readFile } from "node:fs/promises";
import { getVisitAudioPath } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const audioPath = getVisitAudioPath(id);
  if (!audioPath) return Response.json({ error: "Audio is not ready." }, { status: 404 });
  try {
    const file = await readFile(audioPath);
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return Response.json({ error: "Audio file is missing. Retry generation." }, { status: 404 });
  }
}
