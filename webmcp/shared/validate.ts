import { ZodType, ZodError } from "zod";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate input against a Zod schema, returning a structured result.
 */
export function validateInput<T>(schema: ZodType<T>, input: unknown): ValidationResult<T> {
  try {
    const data = schema.parse(input);
    return { success: true, data };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        success: false,
        errors: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      };
    }
    return { success: false, errors: ["Unknown validation error"] };
  }
}
