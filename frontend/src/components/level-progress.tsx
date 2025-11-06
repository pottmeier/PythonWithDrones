import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface LevelProgressProps {
  currentLevel: number;
  setCurrentLevel: (value: number) => void;
  levelCount: number;
}

export function LevelProgress({
  currentLevel,
  setCurrentLevel,
  levelCount,
}: LevelProgressProps) {
  const progressValue = (currentLevel / levelCount) * 100;

  return (
    <div className="h-18 flex items-center justify-between border-t px-4">
      <Button
        className="text-md cursor-pointer ml-4"
        onClick={() => setCurrentLevel(currentLevel - 1)}
        disabled={currentLevel <= 0}
      >
        Previous
      </Button>

      <div className="hidden md:flex relative flex-1 mx-20 h-6 items-center">
        <Progress
          value={progressValue}
          className="h-2 rounded-full bg-white dark:bg-gray-600"
        />

        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-2 bg-gray-100 dark:bg-gray-900 text-lg font-medium">
          {Math.round(progressValue)}%
        </span>
      </div>

      <Button
        className="text-md cursor-pointer mr-4"
        onClick={() => setCurrentLevel(currentLevel + 1)}
        disabled={currentLevel >= levelCount}
      >
        Next
      </Button>
    </div>
  );
}
