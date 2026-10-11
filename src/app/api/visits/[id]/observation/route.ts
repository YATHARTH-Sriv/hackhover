import { createObservation, getPlace, getVisit, setComparison } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { compareObservations } from "@/lib/integrations";
import { observationSchema } from "@/lib/schemas";
import { cleanTranscript } from "@/lib/transcript";
import { syncObservationMemory } from "@/lib/workflow";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const visit = getVisit(id);
    if (!visit) return Response.json({ error: "Visit not found." }, { status: 404 });
    if (visit.observation) return Response.json({ error: "This visit already has a reflection." }, { status: 409 });
    const input = observationSchema.parse(await request.json());
    const noteText = input.inputMethod === "speech" ? cleanTranscript(input.noteText) : input.noteText;
    if (noteText.length < 5) return Response.json({ error: "No spoken reflection was detected. Please record again or type one." }, { status: 400 });
    const observation = createObservation(id, noteText, input.inputMethod);
    let warning: string | null = null;
    try {
      await syncObservationMemory(observation.id, id, observation.noteText, observation.createdAt);
    } catch (error) {
      warning = error instanceof Error ? error.message : "The note is safe locally. Memory sync can be retried.";
    }
    const place = getPlace(visit.placeId)!;
    if (place.visits.length >= 2 && place.visits[1]?.observation && !place.comparison) {
      try {
        const summary = await compareObservations(place.visits[1].observation!.noteText, noteText);
        setComparison(place.id, summary);
      } catch { /* The two actual notes remain visible without an AI summary. */ }
    }
    return Response.json({ place: getPlace(visit.placeId), warning }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
