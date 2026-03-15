import { z } from "zod";
import { registerTool } from "../../shared/register.js";

const inputSchema = z.object({
  toolName: z.string().describe("The tool to invoke"),
  input: z.record(z.string(), z.unknown()).describe("Tool input parameters"),
  callerAgent: z.string().optional().describe("Identifier of the calling agent"),
});

type Input = z.infer<typeof inputSchema>;

interface InvokeToolResult {
  toolName: string;
  status: string;
  result: null;
  invokedAt: string;
}

export const invokeTool = {
  name: "invoke-tool",
  description: "Invoke a marketplace tool with the given input parameters",
  inputSchema,
  handler: async (input: Input): Promise<InvokeToolResult> => {
    // Stub: would proxy to the actual tool execution endpoint
    return {
      toolName: input.toolName,
      status: "stub",
      result: null,
      invokedAt: new Date().toISOString(),
    };
  },
};

registerTool(invokeTool);
