import { getVisit, setVisitAudio, setVisitAudioError } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { synthesizeCard } from "@/lib/integrations";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const visit = getVisit(id);
  if (!visit) return Response.json({ error: "Visit not found." }, { status: 404 });
  if (visit.audioReady) return Response.json({ visit });
  try {
    setVisitAudio(id, await synthesizeCard(id, visit.card.spokenScript));
    return Response.json({ visit: getVisit(id) });
  } catch (error) {
    if (error instanceof Error) setVisitAudioError(id, error.message);
    return errorResponse(error);
  }
}
