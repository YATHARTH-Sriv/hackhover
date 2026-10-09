import { getVisit } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { transcribeReflection } from "@/lib/integrations";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!getVisit(id)) return Response.json({ error: "Visit not found." }, { status: 404 });
    const data = await request.formData();
    const file = data.get("audio");
    if (!(file instanceof File) || file.size < 100 || file.size > 12_000_000) {
      return Response.json({ error: "Record a short reflection under 90 seconds." }, { status: 400 });
    }
    const transcript = await transcribeReflection(file);
    return Response.json({ transcript });
  } catch (error) {
    return errorResponse(error);
  }
}
