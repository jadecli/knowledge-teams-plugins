import { describe, it, expect } from "vitest";
import { loadUpstreamRef, loadUpstreamRefs, scanPluginDir } from "../compose/loader.js";
import { resolvePlugins } from "../compose/resolver.js";
import { generateManifest } from "../compose/manifest.js";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..");

describe("compose/loader", () => {
  it("loads upstream-ref.json (legacy)", () => {
    const ref = loadUpstreamRef(ROOT);
    expect(ref.repo).toBe("jadecli/knowledge-work-plugins");
    expect(ref.commit).toBe("477c893b");
    expect(ref.syncedAt).toBe("2026-03-06");
  });

  it("loads upstream-refs.json (multi-upstream)", () => {
    const refs = loadUpstreamRefs(ROOT);
    expect(refs.upstreams["knowledge-work-plugins"]).toBeDefined();
    expect(refs.upstreams["knowledge-work-plugins"].repo).toBe("jadecli/knowledge-work-plugins");
    expect(refs.upstreams["financial-services-plugins"]).toBeDefined();
    expect(refs.upstreams["claude-code"]).toBeDefined();
    expect(refs.mcpServers["github"]).toBeDefined();
    expect(refs.mcpServers["neon"]).toBeDefined();
    expect(refs.sdks["anthropic"]).toBeDefined();
    expect(refs.cloudProviders["aws-bedrock"]).toBeDefined();
  });

  it("scans jade extensions directory", () => {
    const plugins = scanPluginDir(join(ROOT, "extensions"), "jade", "jade-extensions");
    const names = plugins.map((p) => p.name).sort();
    expect(names).toContain("jade-orchestrator");
    expect(names).toContain("product-management");
    expect(names).toContain("engineering");
    expect(names).toContain("enterprise-lifecycle");
  });

  it("jade-orchestrator has skills and commands", () => {
    const plugins = scanPluginDir(join(ROOT, "extensions"), "jade", "jade-extensions");
    const orch = plugins.find((p) => p.name === "jade-orchestrator");
    expect(orch).toBeDefined();
    expect(orch!.skills.length).toBe(3);
    expect(orch!.commands.length).toBe(3);
    expect(orch!.manifest).not.toBeNull();
    expect(orch!.manifest!.name).toBe("jade-orchestrator");
    expect(orch!.sourceId).toBe("jade-extensions");
  });

  it("scans jade plugins directory with sourceId", () => {
    const plugins = scanPluginDir(join(ROOT, "plugins"), "jade", "jade-plugins");
    const names = plugins.map((p) => p.name);
    expect(names).toContain("jade-cofounder");
    expect(names).toContain("jade-vp-admin");
    // All should have sourceId set
    for (const p of plugins) {
      expect(p.sourceId).toBe("jade-plugins");
    }
  });
});

describe("compose/resolver", () => {
  it("jade-only plugins pass through", () => {
    const jade = [
      {
        source: "jade" as const,
        sourceId: "jade-extensions",
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
    expect(resolved[0].sourceIds).toEqual(["jade-extensions"]);
    expect(resolved[0].skills).toEqual(["a.md", "b.md"]);
  });

  it("upstream-only plugins pass through", () => {
    const upstream = [
      {
        source: "upstream" as const,
        sourceId: "knowledge-work-plugins",
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
    expect(resolved[0].sourceIds).toEqual(["knowledge-work-plugins"]);
  });

  it("jade overrides upstream for same-name plugins", () => {
    const upstream = [
      {
        source: "upstream" as const,
        sourceId: "knowledge-work-plugins",
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
        sourceId: "jade-extensions",
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
    expect(resolved[0].sourceIds).toEqual(["knowledge-work-plugins", "jade-extensions"]);
    // jade version of patterns.md wins, plus extra.md
    expect(resolved[0].skills).toHaveLength(2);
    expect(resolved[0].skills).toContain("/jade/engineering/skills/patterns.md");
    expect(resolved[0].skills).toContain("/jade/engineering/skills/extra.md");
  });

  it("merges multiple upstreams for same-name plugin", () => {
    const upstream = [
      {
        source: "upstream" as const,
        sourceId: "knowledge-work-plugins",
        name: "finance",
        basePath: "/kwp/finance",
        manifest: null,
        skills: ["/kwp/finance/skills/basics.md"],
        commands: [],
      },
      {
        source: "upstream" as const,
        sourceId: "financial-services-plugins",
        name: "finance",
        basePath: "/fsp/finance",
        manifest: null,
        skills: ["/fsp/finance/skills/basics.md", "/fsp/finance/skills/compliance.md"],
        commands: [],
      },
    ];
    const resolved = resolvePlugins(upstream, []);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].source).toBe("upstream");
    expect(resolved[0].sourceIds).toEqual(["knowledge-work-plugins", "financial-services-plugins"]);
    // financial-services-plugins wins for basics.md, adds compliance.md
    expect(resolved[0].skills).toHaveLength(2);
    expect(resolved[0].skills).toContain("/fsp/finance/skills/basics.md");
    expect(resolved[0].skills).toContain("/fsp/finance/skills/compliance.md");
  });
});

describe("compose/manifest", () => {
  it("generates manifest from resolved plugins", () => {
    const resolved = [
      { name: "engineering", source: "merged" as const, sourceIds: ["kwp", "jade"], skills: ["a.md", "b.md"], commands: [] },
      { name: "jade-orchestrator", source: "jade" as const, sourceIds: ["jade"], skills: ["c.md"], commands: ["d.md", "e.md"] },
    ];
    const manifest = generateManifest(resolved);
    expect(manifest.plugins).toHaveLength(2);
    expect(manifest.totalSkills).toBe(3);
    expect(manifest.totalCommands).toBe(2);
    expect(manifest.generatedAt).toBeTruthy();
  });
});
