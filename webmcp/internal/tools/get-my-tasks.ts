import { z } from "zod";
import { registerTool } from "../../shared/register.js";

const inputSchema = z.object({
  agentId: z.string().describe("The agent's unique identifier"),
  status: z.enum(["active", "paused", "completed", "all"]).default("active"),
});

type Input = z.infer<typeof inputSchema>;

export const getMyTasks = {
  name: "get-my-tasks",
  description: "Retrieve tasks assigned to the calling agent, filtered by status",
  inputSchema,
  handler: async (input: Input) => {
    // Stub: would query jadecli.app task API
    return {
      agentId: input.agentId,
      tasks: [],
      filter: input.status,
    };
  },
};

registerTool(getMyTasks);
