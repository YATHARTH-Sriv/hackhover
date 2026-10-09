import { listPlaces } from "@/lib/db";
import { HomeClient } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HomeClient initialPlaces={listPlaces()} />;
}
