import { createVisit, getPlace, getVisit, setVisitAudio, setVisitAudioError } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { generateCard, IntegrationError, synthesizeCard } from "@/lib/integrations";
import { createVisitSchema } from "@/lib/schemas";
import { getPreviousMemory } from "@/lib/workflow";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const place = getPlace(id);
    if (!place) return Response.json({ error: "Place not found." }, { status: 404 });
    const existing = place.visits[0];
    if (existing && !existing.observation) {
      return Response.json({ visit: existing, warning: "Finish this visit before starting another." });
    }
    const { durationMinutes } = createVisitSchema.parse(await request.json());
    const visitNumber = place.visits.length + 1;
    let previousMemory: string | null = null;
    if (visitNumber > 1) {
      previousMemory = await getPreviousMemory(id);
      if (!previousMemory) throw new IntegrationError("Backboard", "No saved observation was retrieved yet. Wait a moment and retry.");
    }
    const card = await generateCard({
      nickname: place.nickname, setting: place.setting, durationMinutes, visitNumber, previousMemory,
    });
    const visit = createVisit(id, card, previousMemory);
    let warning: string | null = null;
    try {
      const audioPath = await synthesizeCard(visit.id, card.spokenScript);
      setVisitAudio(visit.id, audioPath);
    } catch (error) {
      warning = error instanceof Error ? error.message : "Audio is unavailable. Retry later.";
      setVisitAudioError(visit.id, warning);
    }
    return Response.json({ visit: getVisit(visit.id), warning }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
