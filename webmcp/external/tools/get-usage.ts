import { z } from "zod";
import { registerTool } from "../../shared/register.js";

const inputSchema = z.object({
  toolName: z.string().optional().describe("Filter by tool name"),
  period: z.enum(["hour", "day", "week", "month"]).default("day"),
});

type Input = z.infer<typeof inputSchema>;

interface GetUsageResult {
  toolName: string;
  period: string;
  invocations: number;
  uniqueAgents: number;
  avgDurationMs: number;
}

export const getUsage = {
  name: "get-usage",
  description: "Get usage statistics for marketplace tools",
  inputSchema,
  handler: async (input: Input): Promise<GetUsageResult> => {
    // Stub: would query jadecli.com usage analytics
    return {
      toolName: input.toolName ?? "all",
      period: input.period,
      invocations: 0,
      uniqueAgents: 0,
      avgDurationMs: 0,
    };
  },
};

registerTool(getUsage);
