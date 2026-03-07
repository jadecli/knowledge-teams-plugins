import { LoadedPlugin } from "./loader.js";

export interface ResolvedPlugin {
  name: string;
  source: "upstream" | "jade" | "merged";
  skills: string[];
  commands: string[];
}

/**
 * Resolve plugins from upstream and jade extension layers.
 * Jade extensions always win in name conflicts.
 * If both upstream and jade define the same plugin name, skills/commands are merged
 * with jade entries overriding upstream entries that share a filename.
 */
export function resolvePlugins(
  upstream: LoadedPlugin[],
  jade: LoadedPlugin[]
): ResolvedPlugin[] {
  const upstreamMap = new Map(upstream.map((p) => [p.name, p]));
  const jadeMap = new Map(jade.map((p) => [p.name, p]));
  const allNames = new Set([...upstreamMap.keys(), ...jadeMap.keys()]);

  const resolved: ResolvedPlugin[] = [];

  for (const name of allNames) {
    const up = upstreamMap.get(name);
    const jd = jadeMap.get(name);

    if (jd && !up) {
      // Jade-only plugin (e.g., jade-orchestrator)
      resolved.push({
        name,
        source: "jade",
        skills: jd.skills,
        commands: jd.commands,
      });
    } else if (up && !jd) {
      // Upstream-only plugin (passthrough)
      resolved.push({
        name,
        source: "upstream",
        skills: up.skills,
        commands: up.commands,
      });
    } else if (up && jd) {
      // Merged: jade overrides upstream for same-name files
      resolved.push({
        name,
        source: "merged",
        skills: mergeFileList(up.skills, jd.skills),
        commands: mergeFileList(up.commands, jd.commands),
      });
    }
  }

  return resolved;
}

/**
 * Merge two file lists. If both contain a file with the same basename,
 * the jade version (from the second list) wins.
 */
function mergeFileList(upstream: string[], jade: string[]): string[] {
  const basename = (p: string) => p.split("/").pop() ?? p;
  const result = new Map<string, string>();

  for (const f of upstream) result.set(basename(f), f);
  for (const f of jade) result.set(basename(f), f); // jade overwrites

  return Array.from(result.values());
}
