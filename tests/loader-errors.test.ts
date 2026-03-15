import { describe, it, expect } from "vitest";
import { loadUpstreamRef, scanPluginDir, loadAll } from "../compose/loader.js";
import { join } from "path";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";

const ROOT = join(import.meta.dirname, "..");

describe("compose/loader error paths", () => {
  it("loadUpstreamRef throws on missing file", () => {
    expect(() => loadUpstreamRef("/nonexistent")).toThrow(
      "upstream-ref.json not found"
    );
  });

  it("loadUpstreamRef throws on invalid JSON", () => {
    const tmp = mkdtempSync(join(tmpdir(), "loader-test-"));
    writeFileSync(join(tmp, "upstream-ref.json"), "not json");
    try {
      expect(() => loadUpstreamRef(tmp)).toThrow();
    } finally {
      rmSync(tmp, { recursive: true });
    }
  });

  it("loadUpstreamRef throws on missing required fields", () => {
    const tmp = mkdtempSync(join(tmpdir(), "loader-test-"));
    writeFileSync(join(tmp, "upstream-ref.json"), '{"repo": "x"}');
    try {
      expect(() => loadUpstreamRef(tmp)).toThrow();
    } finally {
      rmSync(tmp, { recursive: true });
    }
  });

  it("scanPluginDir returns [] for nonexistent directory", () => {
    expect(scanPluginDir("/nonexistent-dir-12345", "jade")).toEqual([]);
  });

  it("scanPluginDir skips non-directory entries", () => {
    const tmp = mkdtempSync(join(tmpdir(), "loader-test-"));
    writeFileSync(join(tmp, "not-a-dir.txt"), "hello");
    try {
      const result = scanPluginDir(tmp, "jade");
      expect(result).toEqual([]);
    } finally {
      rmSync(tmp, { recursive: true });
    }
  });

  it("scanPluginDir handles plugin dir without plugin.json", () => {
    const tmp = mkdtempSync(join(tmpdir(), "loader-test-"));
    mkdirSync(join(tmp, "my-plugin"));
    try {
      const result = scanPluginDir(tmp, "jade");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("my-plugin");
      expect(result[0].manifest).toBeNull();
      expect(result[0].skills).toEqual([]);
      expect(result[0].commands).toEqual([]);
    } finally {
      rmSync(tmp, { recursive: true });
    }
  });

  it("scanPluginDir parses valid plugin.json with Zod", () => {
    const tmp = mkdtempSync(join(tmpdir(), "loader-test-"));
    const pluginDir = join(tmp, "test-plugin");
    mkdirSync(pluginDir);
    writeFileSync(
      join(pluginDir, "plugin.json"),
      JSON.stringify({ name: "test-plugin", version: "1.0.0" })
    );
    try {
      const result = scanPluginDir(tmp, "upstream");
      expect(result).toHaveLength(1);
      expect(result[0].manifest).toEqual({
        name: "test-plugin",
        version: "1.0.0",
      });
      expect(result[0].source).toBe("upstream");
    } finally {
      rmSync(tmp, { recursive: true });
    }
  });

  it("scanPluginDir skips invalid plugin.json gracefully", () => {
    const tmp = mkdtempSync(join(tmpdir(), "loader-test-"));
    const pluginDir = join(tmp, "bad-plugin");
    mkdirSync(pluginDir);
    writeFileSync(join(pluginDir, "plugin.json"), "not json");
    try {
      const result = scanPluginDir(tmp, "jade");
      expect(result).toHaveLength(1);
      expect(result[0].manifest).toBeNull();
    } finally {
      rmSync(tmp, { recursive: true });
    }
  });

  it("scanPluginDir collects markdown files from skills/ and commands/", () => {
    const tmp = mkdtempSync(join(tmpdir(), "loader-test-"));
    const pluginDir = join(tmp, "md-plugin");
    mkdirSync(pluginDir);
    mkdirSync(join(pluginDir, "skills"));
    mkdirSync(join(pluginDir, "commands"));
    writeFileSync(join(pluginDir, "skills", "s1.md"), "# Skill 1");
    writeFileSync(join(pluginDir, "skills", "s2.md"), "# Skill 2");
    writeFileSync(join(pluginDir, "skills", "ignore.txt"), "not md");
    writeFileSync(join(pluginDir, "commands", "c1.md"), "# Cmd 1");
    try {
      const result = scanPluginDir(tmp, "jade");
      expect(result).toHaveLength(1);
      expect(result[0].skills).toHaveLength(2);
      expect(result[0].commands).toHaveLength(1);
    } finally {
      rmSync(tmp, { recursive: true });
    }
  });
});

describe("compose/loader loadAll", () => {
  it("loads upstream ref and scans jade extensions", () => {
    const result = loadAll(ROOT);
    expect(result.upstreamRef.repo).toBe("jadecli/knowledge-work-plugins");
    expect(result.upstreamRef.commit).toBe("477c893b");
    // Upstream dir doesn't exist in this repo, so upstream is empty
    expect(result.upstream).toEqual([]);
    // Jade extensions should be found
    expect(result.jade.length).toBeGreaterThan(0);
  });
});
