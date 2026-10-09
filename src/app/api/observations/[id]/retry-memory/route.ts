import { getObservation } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { syncObservationMemory } from "@/lib/workflow";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const observation = getObservation(id);
  if (!observation) return Response.json({ error: "Reflection not found." }, { status: 404 });
  if (observation.memoryStatus === "synced") return Response.json({ observation });
  try {
    await syncObservationMemory(id, observation.visitId, observation.noteText, observation.createdAt);
    return Response.json({ observation: getObservation(id) });
  } catch (error) {
    return errorResponse(error);
  }
}
