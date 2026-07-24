import { notFound } from "next/navigation";
import LevelContent from "./levelContent";

// hardcoded zum testen
const levels = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }, { id: "6" }, { id: "7" },{ id: "8" },{ id: "9" }, { id:"10"}, { id:"11" }, { id:"12" }, { id: "13" }];

// Any id not returned by generateStaticParams 404s instead of Next trying to
// render it on demand. Required to get the not-found page for e.g. /level/99
// under `output: export` — without it the dev server throws a 500.
export const dynamicParams = false;

export async function generateStaticParams() {
  return levels.map((level) => ({
    id: level.id,
  }));
}

type LevelPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LevelPage({ params }: LevelPageProps) {
  const { id } = await params;

  const level = levels.find((l) => l.id === id);

  if (!level) {
    notFound();
  }

  return <LevelContent level={level} />;
}
