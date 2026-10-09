import { getPlace } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const place = getPlace(id);
  return place ? Response.json({ place }) : Response.json({ error: "Place not found." }, { status: 404 });
}
