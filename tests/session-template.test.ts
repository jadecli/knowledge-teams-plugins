import { describe, it, expect } from "vitest";
import {
  formatStructuredInput,
  parseStructuredOutput,
} from "../src/jade/agent-sdk/session-template.js";
import type {
  StructuredInput,
  SessionTemplateConfig,
} from "../src/jade/agent-sdk/session-template.js";

describe("formatStructuredInput", () => {
  it("wraps task in XML input tags", () => {
    const input: StructuredInput = { task: "Review this code" };
    const xml = formatStructuredInput(input);
    expect(xml).toContain("<input>");
    expect(xml).toContain("<task>Review this code</task>");
    expect(xml).toContain("</input>");
  });

  it("escapes XML special characters in task", () => {
    const input: StructuredInput = { task: "Check <script> & \"quotes\"" };
    const xml = formatStructuredInput(input);
    expect(xml).toContain("&lt;script&gt;");
    expect(xml).toContain("&amp;");
    expect(xml).not.toContain("<script>");
  });

  it("includes context sources with escaped attribute names", () => {
    const input: StructuredInput = {
      task: "Analyze",
      context: [{ name: 'file "a".ts', content: "const x = 1;" }],
    };
    const xml = formatStructuredInput(input);
    expect(xml).toContain("<context>");
    expect(xml).toContain('name="file &quot;a&quot;.ts"');
    expect(xml).toContain("const x = 1;");
  });

  it("includes multiple context sources", () => {
    const input: StructuredInput = {
      task: "Review",
      context: [
        { name: "a.ts", content: "aaa" },
        { name: "b.ts", content: "bbb" },
      ],
    };
    const xml = formatStructuredInput(input);
    expect(xml).toContain('name="a.ts"');
    expect(xml).toContain('name="b.ts"');
  });

  it("includes output format when provided", () => {
    const input: StructuredInput = {
      task: "Test",
      outputFormat: "JSON with <findings> tag",
    };
    const xml = formatStructuredInput(input);
    expect(xml).toContain("<output-format>");
    expect(xml).toContain("&lt;findings&gt;");
  });

  it("includes constraints as rules", () => {
    const input: StructuredInput = {
      task: "Test",
      constraints: ["No false positives", "Focus on OWASP"],
    };
    const xml = formatStructuredInput(input);
    expect(xml).toContain("<constraints>");
    expect(xml).toContain("<rule>No false positives</rule>");
    expect(xml).toContain("<rule>Focus on OWASP</rule>");
  });

  it("omits optional sections when not provided", () => {
    const input: StructuredInput = { task: "Simple task" };
    const xml = formatStructuredInput(input);
    expect(xml).not.toContain("<context>");
    expect(xml).not.toContain("<output-format>");
    expect(xml).not.toContain("<constraints>");
  });
});

describe("parseStructuredOutput", () => {
  it("extracts XML tag sections from raw text", () => {
    const raw = "<findings>Found 2 issues</findings><severity>high</severity>";
    const result = parseStructuredOutput(raw, 1);
    expect(result.sections["findings"]).toBe("Found 2 issues");
    expect(result.sections["severity"]).toBe("high");
  });

  it("trims whitespace from extracted sections", () => {
    const raw = "<result>\n  Some output\n</result>";
    const result = parseStructuredOutput(raw, 3);
    expect(result.sections["result"]).toBe("Some output");
  });

  it("detects completion via <status>complete</status>", () => {
    const raw = "Done. <status>complete</status>";
    const result = parseStructuredOutput(raw, 2);
    expect(result.complete).toBe(true);
  });

  it("detects completion via <result> section", () => {
    const raw = "<result>All tasks done</result>";
    const result = parseStructuredOutput(raw, 5);
    expect(result.complete).toBe(true);
  });

  it("detects completion via <promise tag", () => {
    const raw = '<promise type="deliver">Next steps</promise>';
    const result = parseStructuredOutput(raw, 1);
    expect(result.complete).toBe(true);
  });

  it("returns incomplete when no completion markers present", () => {
    const raw = "Still working on it...";
    const result = parseStructuredOutput(raw, 1);
    expect(result.complete).toBe(false);
  });

  it("preserves raw text and turn count", () => {
    const raw = "Hello world";
    const result = parseStructuredOutput(raw, 7);
    expect(result.raw).toBe("Hello world");
    expect(result.turn).toBe(7);
  });

  it("handles hyphenated tag names", () => {
    const raw = "<code-review>LGTM</code-review>";
    const result = parseStructuredOutput(raw, 1);
    expect(result.sections["code-review"]).toBe("LGTM");
  });

  it("returns empty sections for plain text", () => {
    const raw = "No XML here, just plain text.";
    const result = parseStructuredOutput(raw, 1);
    expect(Object.keys(result.sections)).toHaveLength(0);
  });

  it("handles multiline content within tags", () => {
    const raw = "<findings>\n  - Issue 1\n  - Issue 2\n</findings>";
    const result = parseStructuredOutput(raw, 1);
    expect(result.sections["findings"]).toBe("- Issue 1\n  - Issue 2");
  });
});

describe("SessionTemplateConfig types", () => {
  it("accepts valid effort levels", () => {
    const configs: SessionTemplateConfig[] = [
      { effort: "low" },
      { effort: "medium" },
      { effort: "high" },
      { effort: "max" },
    ];
    // Type-checking test — if this compiles, the types are correct
    expect(configs).toHaveLength(4);
  });

  it("accepts valid thinking modes", () => {
    const configs: SessionTemplateConfig[] = [
      { thinking: "adaptive" },
      { thinking: "enabled", thinkingBudgetTokens: 5000 },
      { thinking: "disabled" },
    ];
    expect(configs).toHaveLength(3);
  });

  it("defaults are optional", () => {
    const config: SessionTemplateConfig = {};
    expect(config.model).toBeUndefined();
    expect(config.maxTurns).toBeUndefined();
  });
});
