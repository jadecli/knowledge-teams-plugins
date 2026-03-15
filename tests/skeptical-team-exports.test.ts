import { describe, it, expect } from "vitest";

describe("skeptical-codegen-team exports", () => {
  it("exports runSkepticalCodegenTeam function", async () => {
    const mod = await import("../src/teams/skeptical-codegen-team.js");
    expect(typeof mod.runSkepticalCodegenTeam).toBe("function");
  });
});
