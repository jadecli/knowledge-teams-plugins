import { describe, it, expect } from "vitest";
import { loadUpstreamRef, scanPluginDir } from "../compose/loader.js";
import { resolvePlugins } from "../compose/resolver.js";
import { generateManifest } from "../compose/manifest.js";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..");

describe("compose/loader", () => {
  it("loads upstream-ref.json", () => {
    const ref = loadUpstreamRef(ROOT);
    expect(ref.repo).toBe("jadecli/knowledge-work-plugins");
    expect(ref.commit).toBe("477c893b");
    expect(ref.syncedAt).toBe("2026-03-06");
  });

  it("scans jade extensions directory", () => {
    const plugins = scanPluginDir(join(ROOT, "extensions"), "jade");
    const names = plugins.map((p) => p.name).sort();
    expect(names).toContain("jade-orchestrator");
    expect(names).toContain("product-management");
    expect(names).toContain("engineering");
    expect(names).toContain("enterprise-lifecycle");
    expect(names).toContain("data-engineering");
  });

  it("jade-orchestrator has skills and commands", () => {
    const plugins = scanPluginDir(join(ROOT, "extensions"), "jade");
    const orch = plugins.find((p) => p.name === "jade-orchestrator");
    expect(orch).toBeDefined();
    expect(orch!.skills.length).toBe(3);
    expect(orch!.commands.length).toBe(3);
    expect(orch!.manifest).not.toBeNull();
    expect(orch!.manifest!.name).toBe("jade-orchestrator");
  });
});

describe("compose/resolver", () => {
  it("jade-only plugins pass through", () => {
    const jade = [
      {
        source: "jade" as const,
        name: "jade-orchestrator",
        basePath: "/fake",
        manifest: null,
        skills: ["a.md", "b.md"],
        commands: ["c.md"],
      },
    ];
    const resolved = resolvePlugins([], jade);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].source).toBe("jade");
    expect(resolved[0].skills).toEqual(["a.md", "b.md"]);
  });

  it("upstream-only plugins pass through", () => {
    const upstream = [
      {
        source: "upstream" as const,
        name: "engineering",
        basePath: "/fake",
        manifest: null,
        skills: ["x.md"],
        commands: [],
      },
    ];
    const resolved = resolvePlugins(upstream, []);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].source).toBe("upstream");
  });

  it("jade overrides upstream for same-name plugins", () => {
    const upstream = [
      {
        source: "upstream" as const,
        name: "engineering",
        basePath: "/upstream/engineering",
        manifest: null,
        skills: ["/upstream/engineering/skills/patterns.md"],
        commands: [],
      },
    ];
    const jade = [
      {
        source: "jade" as const,
        name: "engineering",
        basePath: "/jade/engineering",
        manifest: null,
        skills: ["/jade/engineering/skills/patterns.md", "/jade/engineering/skills/extra.md"],
        commands: [],
      },
    ];
    const resolved = resolvePlugins(upstream, jade);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].source).toBe("merged");
    // jade version of patterns.md wins, plus extra.md
    expect(resolved[0].skills).toHaveLength(2);
    expect(resolved[0].skills).toContain("/jade/engineering/skills/patterns.md");
    expect(resolved[0].skills).toContain("/jade/engineering/skills/extra.md");
  });
});

describe("compose/manifest", () => {
  it("generates manifest from resolved plugins", () => {
    const resolved = [
      { name: "engineering", source: "merged" as const, skills: ["a.md", "b.md"], commands: [] },
      { name: "jade-orchestrator", source: "jade" as const, skills: ["c.md"], commands: ["d.md", "e.md"] },
    ];
    const manifest = generateManifest(resolved);
    expect(manifest.plugins).toHaveLength(2);
    expect(manifest.totalSkills).toBe(3);
    expect(manifest.totalCommands).toBe(2);
    expect(manifest.generatedAt).toBeTruthy();
  });
});
