import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: [
        "webmcp/**/*.ts",
        "lib/**/*.ts",
        "db/**/*.ts",
        "compose/**/*.ts",
        "src/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.security.test.ts",
        "**/node_modules/**",
      ],
      thresholds: {
        branches: 60,
        functions: 60,
        lines: 60,
        statements: 60,
      },
    },
  },
});
