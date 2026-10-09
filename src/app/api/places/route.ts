import { createPlace, getPlace, listPlaces } from "@/lib/db";
import { createBackboardAssistant } from "@/lib/integrations";
import { errorResponse } from "@/lib/http";
import { createPlaceSchema } from "@/lib/schemas";
import { setAssistantId } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ places: listPlaces() });
}

export async function POST(request: Request) {
  try {
    const input = createPlaceSchema.parse(await request.json());
    const place = createPlace(input.nickname, input.setting);
    let warning: string | null = null;
    if (process.env.BACKBOARD_API_KEY) {
      try {
        const assistantId = await createBackboardAssistant(place.nickname);
        setAssistantId(place.id, assistantId);
      } catch (error) {
        warning = error instanceof Error ? error.message : "Backboard setup needs a retry.";
      }
    } else {
      warning = "Backboard is not configured yet. Add its API key before the second visit.";
    }
    return Response.json({ place: getPlace(place.id), warning }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
