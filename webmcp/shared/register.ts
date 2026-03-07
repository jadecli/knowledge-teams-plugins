import { z, ZodType } from "zod";

export interface WebMCPToolDefinition<T = unknown> {
  name: string;
  description: string;
  inputSchema: ZodType<T>;
  handler: (input: T) => Promise<unknown>;
}

const registry = new Map<string, WebMCPToolDefinition>();

/**
 * Register a WebMCP tool. Tools are keyed by name; duplicate names throw.
 */
export function registerTool<T>(tool: WebMCPToolDefinition<T>): void {
  if (registry.has(tool.name)) {
    throw new Error(`Tool "${tool.name}" is already registered`);
  }
  registry.set(tool.name, tool as WebMCPToolDefinition);
}

/**
 * Retrieve a registered tool by name.
 */
export function getTool(name: string): WebMCPToolDefinition | undefined {
  return registry.get(name);
}

/**
 * List all registered tool names.
 */
export function listTools(): string[] {
  return Array.from(registry.keys());
}

/**
 * Clear registry (for testing).
 */
export function clearRegistry(): void {
  registry.clear();
}
