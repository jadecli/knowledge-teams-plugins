import { z } from "zod";
import { registerTool } from "../../shared/register.js";

const inputSchema = z.object({
  taskId: z.string().describe("The task to claim"),
  agentId: z.string().describe("The claiming agent's identifier"),
  role: z.string().describe("The S-team role the agent is operating as"),
});

type Input = z.infer<typeof inputSchema>;

export const claimTask = {
  name: "claim-task",
  description: "Claim an unassigned task for execution by this agent",
  inputSchema,
  handler: async (input: Input) => {
    // Stub: would call jadecli.app task claim endpoint
    return {
      taskId: input.taskId,
      claimedBy: input.agentId,
      role: input.role,
      claimedAt: new Date().toISOString(),
      success: true,
    };
  },
};

registerTool(claimTask);
