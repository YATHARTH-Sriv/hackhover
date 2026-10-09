import { addBackboardMemory, createBackboardAssistant, searchBackboardMemory } from "./integrations";
import { getPendingObservations, getPlaceRow, getVisit, setAssistantId, setObservationMemory } from "./db";

export async function ensureAssistant(placeId: string): Promise<string> {
  const place = getPlaceRow(placeId);
  if (!place) throw new Error("Place not found");
  if (place.assistant_id) return place.assistant_id;
  const assistantId = await createBackboardAssistant(place.nickname);
  setAssistantId(placeId, assistantId);
  return assistantId;
}

export async function syncObservationMemory(observationId: string, visitId: string, noteText: string, createdAt: string): Promise<string> {
  const visit = getVisit(visitId);
  if (!visit) throw new Error("Visit not found");
  const assistantId = await ensureAssistant(visit.placeId);
  const memoryId = await addBackboardMemory(assistantId, visit.ordinal, noteText, createdAt);
  setObservationMemory(observationId, memoryId);
  return memoryId;
}

export async function getPreviousMemory(placeId: string): Promise<string> {
  const assistantId = await ensureAssistant(placeId);
  for (const observation of getPendingObservations(placeId)) {
    await syncObservationMemory(observation.id, observation.visitId, observation.noteText, observation.createdAt);
  }
  const place = getPlaceRow(placeId)!;
  let memory = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    memory = await searchBackboardMemory(assistantId, place.nickname);
    if (memory) return memory;
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 800));
  }
  return memory;
}
