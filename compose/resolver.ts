import { LoadedPlugin } from "./loader.js";

export interface ResolvedPlugin {
  name: string;
  source: "upstream" | "jade" | "merged";
  /** Which upstream(s) contributed to this plugin */
  sourceIds: string[];
  skills: string[];
  commands: string[];
}

/**
 * Resolve plugins from upstream and jade extension layers.
 * Jade extensions always win in name conflicts.
 * If both upstream and jade define the same plugin name, skills/commands are merged
 * with jade entries overriding upstream entries that share a filename.
 *
 * When multiple upstreams provide the same plugin name, they are merged in order
 * (later upstreams override earlier ones), then jade overrides all.
 */
export function resolvePlugins(
  upstream: LoadedPlugin[],
  jade: LoadedPlugin[]
): ResolvedPlugin[] {
  // Group upstream plugins by name (multiple upstreams may provide same name)
  const upstreamMap = new Map<string, LoadedPlugin[]>();
  for (const p of upstream) {
    const existing = upstreamMap.get(p.name) ?? [];
    existing.push(p);
    upstreamMap.set(p.name, existing);
  }

  const jadeMap = new Map(jade.map((p) => [p.name, p]));
  const allNames = new Set([...upstreamMap.keys(), ...jadeMap.keys()]);

  const resolved: ResolvedPlugin[] = [];

  for (const name of allNames) {
    const ups = upstreamMap.get(name);
    const jd = jadeMap.get(name);

    if (jd && !ups) {
      // Jade-only plugin
      resolved.push({
        name,
        source: "jade",
        sourceIds: [jd.sourceId],
        skills: jd.skills,
        commands: jd.commands,
      });
    } else if (ups && !jd) {
      // Upstream-only plugin (merge multiple upstreams if present)
      const mergedSkills = mergeMultipleFileLists(ups.map((p) => p.skills));
      const mergedCommands = mergeMultipleFileLists(ups.map((p) => p.commands));
      resolved.push({
        name,
        source: "upstream",
        sourceIds: ups.map((p) => p.sourceId),
        skills: mergedSkills,
        commands: mergedCommands,
      });
    } else if (ups && jd) {
      // Merged: upstream base, jade overrides
      const upstreamSkills = mergeMultipleFileLists(ups.map((p) => p.skills));
      const upstreamCommands = mergeMultipleFileLists(ups.map((p) => p.commands));
      resolved.push({
        name,
        source: "merged",
        sourceIds: [...ups.map((p) => p.sourceId), jd.sourceId],
        skills: mergeFileList(upstreamSkills, jd.skills),
        commands: mergeFileList(upstreamCommands, jd.commands),
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

/**
 * Merge multiple file lists from different upstreams.
 * Later lists override earlier lists for same-name files.
 */
function mergeMultipleFileLists(lists: string[][]): string[] {
  const basename = (p: string) => p.split("/").pop() ?? p;
  const result = new Map<string, string>();

  for (const list of lists) {
    for (const f of list) {
      result.set(basename(f), f);
    }
  }

  return Array.from(result.values());
}
