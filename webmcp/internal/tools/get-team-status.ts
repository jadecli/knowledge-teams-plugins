import { z } from "zod";
import { registerTool } from "../../shared/register.js";

const inputSchema = z.object({
  teamFilter: z.string().optional().describe("Filter by S-team role"),
});

type Input = z.infer<typeof inputSchema>;

interface GetTeamStatusResult {
  filter: string;
  agents: unknown[];
  activeTasks: number;
  totalBudgetUsed: number;
}

export const getTeamStatus = {
  name: "get-team-status",
  description: "Get the current status of all active S-team agent sessions",
  inputSchema,
  handler: async (input: Input): Promise<GetTeamStatusResult> => {
    // Stub: would query jadecli.app team status API
    return {
      filter: input.teamFilter ?? "all",
      agents: [],
      activeTasks: 0,
      totalBudgetUsed: 0,
    };
  },
};

registerTool(getTeamStatus);
