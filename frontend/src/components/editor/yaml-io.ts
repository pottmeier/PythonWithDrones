import yaml from "js-yaml";
import type { LevelData } from "@/types/level";

function yamlScalar(s: string): string {
  if (s === "") return '""';
  if (
    /^[a-zA-Z_][a-zA-Z0-9_ -]*$/.test(s) &&
    !["true", "false", "null", "yes", "no", "on", "off"].includes(
      s.toLowerCase(),
    )
  ) {
    return s;
  }
  return JSON.stringify(s);
}

function indentBlock(text: string, indent: string): string {
  return text
    .split("\n")
    .map((line) => (line === "" ? "" : indent + line))
    .join("\n");
}

// Build YAML in the same style as the hand-written Level_N.yaml files:
//   - Top-level keys separated by blank lines.
//   - `spawn` and layer rows in flow style.
//   - `description` as a literal block (|).
export function levelToYaml(level: LevelData): string {
  const sections: string[] = [];

  if (level.id !== undefined && level.id !== "") {
    sections.push(`id: ${level.id}`);
  }

  if (level.title) {
    sections.push(`title: ${yamlScalar(level.title)}`);
  }

  if (level.homepage_intro) {
    sections.push(`homepage_intro: ${JSON.stringify(level.homepage_intro)}`);
  }

  if (level.tags && level.tags.length > 0) {
    const tagLines = level.tags.map((t) => `  - ${yamlScalar(t)}`).join("\n");
    sections.push(`tags:\n${tagLines}`);
  }

  if (level.description) {
    const trimmed = level.description.replace(/\n+$/, "");
    sections.push(`description: |\n${indentBlock(trimmed, "  ")}`);
  }

  const spawn = level.spawn;
  let spawnSection = `spawn: { x: ${spawn.x}, y: ${spawn.y}, z: ${spawn.z}}`;
  if (level.orientation !== undefined) {
    spawnSection += `\norientation: ${level.orientation}`;
  }
  sections.push(spawnSection);

  if (level.solve_conditions) {
    sections.push(
      `solve_conditions:\n` +
        `  finish_block: ${level.solve_conditions.finish_block}\n` +
        `  collected_coins: ${level.solve_conditions.collected_coins}`,
    );
  }

  const layerNames = Object.keys(level.layers).sort((a, b) => {
    const ai = parseInt(a.split("_")[1]) || 0;
    const bi = parseInt(b.split("_")[1]) || 0;
    return ai - bi;
  });

  const layerLines: string[] = ["layers:"];
  for (const name of layerNames) {
    layerLines.push(`  ${name}:`);
    for (const row of level.layers[name]) {
      layerLines.push(`    - [${row.join(", ")}]`);
    }
    layerLines.push("");
  }
  // Trim trailing blank from last layer
  while (layerLines[layerLines.length - 1] === "") layerLines.pop();
  sections.push(layerLines.join("\n"));

  return sections.join("\n\n") + "\n";
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