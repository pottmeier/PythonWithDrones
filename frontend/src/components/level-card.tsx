"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle, Play } from "lucide-react";

export type LevelStatus = "locked" | "unlocked" | "completed";

type LevelCardProps = {
  id: number;
  title: string;
  description: string;
  status: LevelStatus;
  tags?: string[];
  onClick?: (id: number) => void;
};

export function LevelCard({
  id,
  title,
  description,
  status,
  tags = [],
  onClick,
}: LevelCardProps) {
  const isLocked = status === "locked";

  return (
    <Card
      className={cn(
        "pb-4",
        "relative select-none transition-all",
        isLocked
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:shadow-lg hover:bg-muted/50"
      )}
      onClick={() => {
        if (isLocked) return;
        onClick?.(id);
      }}
      role="button"
      tabIndex={isLocked ? -1 : 0}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="pt-1">
            {status === "completed" && (
              <CheckCircle className="h-6 w-6 text-green-500" />
            )}
            {status === "unlocked" && (
              <Play className="h-6 w-6 text-blue-500" />
            )}
            {status === "locked" && <Lock className="h-6 w-6 text-gray-400" />}
          </div>

          <div className="flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
