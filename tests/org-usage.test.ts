import { describe, it, expect } from "vitest";
import type { OrgUsageResponse } from "../db/org-usage.js";

const SAMPLE_RESPONSE: OrgUsageResponse = {
  org_id: "org-test-123",
  period_start: "2026-03-01T00:00:00Z",
  period_end: "2026-03-11T00:00:00Z",
  usage: [
    {
      model: "claude-opus-4-6",
      input_tokens: 150000,
      output_tokens: 50000,
      cache_read_input_tokens: 30000,
      cache_creation_input_tokens: 10000,
    },
    {
      model: "claude-sonnet-4-6",
      input_tokens: 80000,
      output_tokens: 25000,
    },
  ],
};

describe("db/org-usage — response shape", () => {
  it("sample response has expected fields", () => {
    expect(SAMPLE_RESPONSE.org_id).toBe("org-test-123");
    expect(SAMPLE_RESPONSE.usage).toHaveLength(2);
  });

  it("usage buckets have model and token counts", () => {
    const opus = SAMPLE_RESPONSE.usage[0];
    expect(opus.model).toBe("claude-opus-4-6");
    expect(opus.input_tokens).toBe(150000);
    expect(opus.output_tokens).toBe(50000);
    expect(opus.cache_read_input_tokens).toBe(30000);
  });

  it("optional cache fields can be undefined", () => {
    const sonnet = SAMPLE_RESPONSE.usage[1];
    expect(sonnet.cache_read_input_tokens).toBeUndefined();
    expect(sonnet.cache_creation_input_tokens).toBeUndefined();
  });
});
