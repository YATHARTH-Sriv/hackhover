import { notFound } from "next/navigation";
import { getPlace } from "@/lib/db";
import { PlaceExperience } from "@/components/PlaceExperience";

export const dynamic = "force-dynamic";

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const place = getPlace(id);
  if (!place) notFound();
  return <PlaceExperience initialPlace={place} />;
}
