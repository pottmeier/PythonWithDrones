import yaml from "js-yaml";
import type { LevelData } from "@/types/level";

export function levelToYaml(level: LevelData): string {
  return yaml.dump(level, {
    lineWidth: 200,
    noRefs: true,
  });
}

export function yamlToLevel(text: string): LevelData {
  const parsed = yaml.load(text) as LevelData;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid YAML: expected an object");
  }
  if (!parsed.layers || typeof parsed.layers !== "object") {
    throw new Error("Invalid level: missing 'layers'");
  }
  if (!parsed.spawn || typeof parsed.spawn !== "object") {
    throw new Error("Invalid level: missing 'spawn'");
  }
  if (!parsed.solve_conditions) {
    parsed.solve_conditions = { finish_block: true, collected_coins: 0 };
  }
  return parsed;
}

export function downloadYaml(level: LevelData, filename: string) {
  const text = levelToYaml(level);
  const blob = new Blob([text], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".yaml") ? filename : `${filename}.yaml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function readYamlFile(file: File): Promise<LevelData> {
  const text = await file.text();
  return yamlToLevel(text);
}
