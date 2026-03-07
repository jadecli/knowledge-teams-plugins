import { ResolvedPlugin } from "./resolver.js";

export interface ComposedManifest {
  generatedAt: string;
  plugins: Array<{
    name: string;
    source: string;
    skillCount: number;
    commandCount: number;
  }>;
  totalSkills: number;
  totalCommands: number;
}

/**
 * Generate a composed manifest from resolved plugins.
 * This is used at build time to produce a single manifest.json.
 */
export function generateManifest(resolved: ResolvedPlugin[]): ComposedManifest {
  const plugins = resolved.map((p) => ({
    name: p.name,
    source: p.source,
    skillCount: p.skills.length,
    commandCount: p.commands.length,
  }));

  return {
    generatedAt: new Date().toISOString(),
    plugins,
    totalSkills: plugins.reduce((sum, p) => sum + p.skillCount, 0),
    totalCommands: plugins.reduce((sum, p) => sum + p.commandCount, 0),
  };
}
