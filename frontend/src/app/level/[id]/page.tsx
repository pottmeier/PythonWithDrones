import LevelContent from "./levelContent";

// hardcoded zum testen
const levels = [{ id: "1" }, { id: "2" }, { id: "3" },{ id: "4" },{ id: "5" }];

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
    return <div>Level nicht gefunden</div>;
  }

  return <LevelContent level={level} />;
}
