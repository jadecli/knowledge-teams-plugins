import { describe, it, expect } from "vitest";
import { validateInput } from "../webmcp/shared/validate.js";
import { z } from "zod";

describe("validateInput edge cases", () => {
  it("handles non-ZodError exceptions", () => {
    const badSchema = {
      parse: () => {
        throw new TypeError("not a zod error");
      },
    } as unknown as z.ZodType<unknown>;

    const result = validateInput(badSchema, {});
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(["Unknown validation error"]);
  });

  it("returns data on success", () => {
    const schema = z.object({ x: z.number() });
    const result = validateInput(schema, { x: 42 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ x: 42 });
    expect(result.errors).toBeUndefined();
  });

  it("reports nested path errors", () => {
    const schema = z.object({
      nested: z.object({
        value: z.string(),
      }),
    });
    const result = validateInput(schema, { nested: { value: 123 } });
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.includes("nested.value"))).toBe(true);
  });
});
