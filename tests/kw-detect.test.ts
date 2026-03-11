import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolve } from "path";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { execSync } from "child_process";
import {
  detectKW,
  detectKWFromCwd,
  getAllSeats,
  getSeatByKwId,
  deriveEffort,
  parseStoFrontmatter,
  extractRepoSlug,
  resetConfigCache,
} from "../src/jade/kw/index.js";

const SEATS_PATH = resolve(__dirname, "../src/jade/kw/seats.json");
const S_TEAM_DIR = resolve(__dirname, "../s-team");

beforeEach(() => {
  resetConfigCache();
});

describe("detectKW", () => {
  it("returns CTO seat for knowledge-teams-plugins", () => {
    const result = detectKW("jadecli/knowledge-teams-plugins", SEATS_PATH, S_TEAM_DIR);
    expect(result.kwId).toBe("KW-02");
    expect(result.plugin).toBe("jade-vp-engineering");
    expect(result.title).toBe("CTO");
    expect(result.model).toBe("claude-opus-4-6");
    expect(result.effort).toBe("high");
    expect(result.budgetToolCalls).toBe(50);
    expect(result.fitnessFunction).toBe(
      "p95 deploy-to-production latency under 15 minutes"
    );
    expect(result.mapped).toBe(true);
  });

  it("returns CEO seat for jade-cofounder", () => {
    const result = detectKW("jadecli/jade-cofounder", SEATS_PATH, S_TEAM_DIR);
    expect(result.kwId).toBe("KW-01");
    expect(result.plugin).toBe("jade-cofounder");
    expect(result.title).toBe("CEO");
    expect(result.model).toBe("claude-opus-4-6");
    expect(result.effort).toBe("high");
    expect(result.budgetToolCalls).toBe(60);
    expect(result.fitnessFunction).toBe(
      "quarterly OP1 goal attainment rate above 80%"
    );
    expect(result.mapped).toBe(true);
  });

  it("returns CPO2/Productivity for dotfiles-claude", () => {
    const result = detectKW("jadecli-labs/dotfiles-claude", SEATS_PATH, S_TEAM_DIR);
    expect(result.kwId).toBe("KW-13");
    expect(result.plugin).toBe("jade-vp-productivity");
    expect(result.title).toBe("CPO2");
    expect(result.mapped).toBe(true);
  });

  it("returns CRO2/Research for llms-txt-feed", () => {
    const result = detectKW("jadecli-labs/llms-txt-feed", SEATS_PATH, S_TEAM_DIR);
    expect(result.kwId).toBe("KW-12");
    expect(result.plugin).toBe("jade-vp-research");
    expect(result.title).toBe("CRO2");
    expect(result.model).toBe("claude-opus-4-6");
    expect(result.effort).toBe("high");
    expect(result.budgetToolCalls).toBe(50);
    expect(result.mapped).toBe(true);
  });

  it("returns KW-00 defaults for unmapped repos", () => {
    const result = detectKW("unknown-org/unknown-repo", SEATS_PATH, S_TEAM_DIR);
    expect(result.kwId).toBe("KW-00");
    expect(result.plugin).toBe("jade-vp-engineering");
    expect(result.title).toBe("Unmapped");
    expect(result.model).toBe("claude-sonnet-4-6");
    expect(result.budgetToolCalls).toBe(30);
    expect(result.effort).toBe("medium");
    expect(result.fitnessFunction).toBeNull();
    expect(result.mapped).toBe(false);
  });

  it("returns KW-00 defaults for empty string", () => {
    const result = detectKW("", SEATS_PATH, S_TEAM_DIR);
    expect(result.kwId).toBe("KW-00");
    expect(result.mapped).toBe(false);
  });
});

describe("getAllSeats", () => {
  it("returns exactly 14 seats", () => {
    const seats = getAllSeats(SEATS_PATH);
    expect(seats).toHaveLength(14);
  });

  it("seats have sequential KW IDs from KW-01 to KW-14", () => {
    const seats = getAllSeats(SEATS_PATH);
    for (let i = 0; i < 14; i++) {
      expect(seats[i].kwId).toBe(`KW-${String(i + 1).padStart(2, "0")}`);
    }
  });
});

describe("getSeatByKwId", () => {
  it("returns jade-cofounder for KW-01", () => {
    const seat = getSeatByKwId("KW-01", SEATS_PATH);
    expect(seat).toBeDefined();
    expect(seat!.plugin).toBe("jade-cofounder");
    expect(seat!.title).toBe("CEO");
  });

  it("returns undefined for non-existent KW-99", () => {
    const seat = getSeatByKwId("KW-99", SEATS_PATH);
    expect(seat).toBeUndefined();
  });
});

describe("deriveEffort", () => {
  it("maps opus to high", () => {
    expect(deriveEffort("claude-opus-4-6")).toBe("high");
  });

  it("maps sonnet to medium", () => {
    expect(deriveEffort("claude-sonnet-4-6")).toBe("medium");
  });

  it("maps haiku to low", () => {
    expect(deriveEffort("claude-haiku-4-5")).toBe("low");
  });

  it("defaults unknown models to medium", () => {
    expect(deriveEffort("some-unknown-model")).toBe("medium");
  });
});

describe("parseStoFrontmatter", () => {
  it("parses cto.md frontmatter correctly", () => {
    const sto = parseStoFrontmatter("cto", S_TEAM_DIR);
    expect(sto).not.toBeNull();
    expect(sto!.role).toBe("Chief Technology Officer");
    expect(sto!.model).toBe("claude-opus-4-6");
    expect(sto!.safetyResearch).toBe("alignment-faking-extensions");
    expect(sto!.fitnessFunction).toBe(
      "p95 deploy-to-production latency under 15 minutes"
    );
    expect(sto!.budgetToolCalls).toBe(50);
  });

  it("parses cfo.md frontmatter correctly", () => {
    const sto = parseStoFrontmatter("cfo", S_TEAM_DIR);
    expect(sto).not.toBeNull();
    expect(sto!.model).toBe("claude-sonnet-4-6");
    expect(sto!.budgetToolCalls).toBe(30);
  });

  it("returns null for non-existent STO file", () => {
    const sto = parseStoFrontmatter("nonexistent", S_TEAM_DIR);
    expect(sto).toBeNull();
  });
});

describe("parseStoFrontmatter — new STO files", () => {
  it("parses ceo.md frontmatter correctly", () => {
    const sto = parseStoFrontmatter("ceo", S_TEAM_DIR);
    expect(sto).not.toBeNull();
    expect(sto!.role).toBe("Chief Executive Officer");
    expect(sto!.model).toBe("claude-opus-4-6");
    expect(sto!.safetyResearch).toBe("sycophancy-to-subterfuge");
    expect(sto!.budgetToolCalls).toBe(60);
  });

  it("parses cmo.md frontmatter correctly", () => {
    const sto = parseStoFrontmatter("cmo", S_TEAM_DIR);
    expect(sto).not.toBeNull();
    expect(sto!.role).toBe("Chief Marketing Officer");
    expect(sto!.model).toBe("claude-sonnet-4-6");
    expect(sto!.budgetToolCalls).toBe(35);
  });

  it("parses cso2.md frontmatter correctly", () => {
    const sto = parseStoFrontmatter("cso2", S_TEAM_DIR);
    expect(sto).not.toBeNull();
    expect(sto!.role).toBe("Chief Search Officer");
    expect(sto!.model).toBe("claude-sonnet-4-6");
    expect(sto!.budgetToolCalls).toBe(40);
  });

  it("parses cro2.md frontmatter correctly", () => {
    const sto = parseStoFrontmatter("cro2", S_TEAM_DIR);
    expect(sto).not.toBeNull();
    expect(sto!.role).toBe("Chief Research Officer");
    expect(sto!.model).toBe("claude-opus-4-6");
    expect(sto!.budgetToolCalls).toBe(50);
  });
});

describe("extractRepoSlug", () => {
  it("extracts slug from SSH URL", () => {
    expect(
      extractRepoSlug("git@github.com:jadecli/knowledge-teams-plugins.git")
    ).toBe("jadecli/knowledge-teams-plugins");
  });

  it("extracts slug from SSH URL without .git", () => {
    expect(
      extractRepoSlug("git@github.com:jadecli/knowledge-teams-plugins")
    ).toBe("jadecli/knowledge-teams-plugins");
  });

  it("extracts slug from HTTPS URL", () => {
    expect(
      extractRepoSlug(
        "https://github.com/jadecli/knowledge-teams-plugins.git"
      )
    ).toBe("jadecli/knowledge-teams-plugins");
  });

  it("extracts slug from HTTPS URL without .git", () => {
    expect(
      extractRepoSlug("https://github.com/jadecli/knowledge-teams-plugins")
    ).toBe("jadecli/knowledge-teams-plugins");
  });

  it("returns null for unrecognized URL format", () => {
    expect(extractRepoSlug("not-a-url")).toBeNull();
  });
});

describe("detectKWFromCwd — integration", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(resolve(tmpdir(), "kw-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detects KW-02 from a git repo with jadecli/knowledge-teams-plugins remote", () => {
    execSync("git init", { cwd: tmpDir, stdio: "pipe" });
    execSync(
      "git remote add origin git@github.com:jadecli/knowledge-teams-plugins.git",
      { cwd: tmpDir, stdio: "pipe" }
    );
    const result = detectKWFromCwd(tmpDir, SEATS_PATH, S_TEAM_DIR);
    expect(result.kwId).toBe("KW-02");
    expect(result.plugin).toBe("jade-vp-engineering");
    expect(result.mapped).toBe(true);
  });

  it("detects KW-01 from a git repo with jade-cofounder HTTPS remote", () => {
    execSync("git init", { cwd: tmpDir, stdio: "pipe" });
    execSync(
      "git remote add origin https://github.com/jadecli/jade-cofounder.git",
      { cwd: tmpDir, stdio: "pipe" }
    );
    const result = detectKWFromCwd(tmpDir, SEATS_PATH, S_TEAM_DIR);
    expect(result.kwId).toBe("KW-01");
    expect(result.plugin).toBe("jade-cofounder");
    expect(result.mapped).toBe(true);
  });

  it("returns KW-00 defaults for a git repo with unmapped remote", () => {
    execSync("git init", { cwd: tmpDir, stdio: "pipe" });
    execSync(
      "git remote add origin git@github.com:some-org/some-repo.git",
      { cwd: tmpDir, stdio: "pipe" }
    );
    const result = detectKWFromCwd(tmpDir, SEATS_PATH, S_TEAM_DIR);
    expect(result.kwId).toBe("KW-00");
    expect(result.mapped).toBe(false);
  });

  it("returns KW-00 defaults for a directory without git", () => {
    const noGitDir = mkdtempSync(resolve(tmpdir(), "kw-nogit-"));
    try {
      const result = detectKWFromCwd(noGitDir, SEATS_PATH, S_TEAM_DIR);
      expect(result.kwId).toBe("KW-00");
      expect(result.mapped).toBe(false);
    } finally {
      rmSync(noGitDir, { recursive: true, force: true });
    }
  });
});
