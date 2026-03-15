import { z } from "zod";
import { registerTool } from "../../shared/register.js";

const inputSchema = z.object({
  taskId: z.string().describe("The task to checkpoint"),
  budgetUsed: z.number().describe("Tool calls consumed so far"),
  summary: z.string().describe("Brief summary of progress since last checkpoint"),
  requestBudgetExtension: z.number().optional().describe("Additional tool calls requested"),
});

type Input = z.infer<typeof inputSchema>;

interface RequestCheckpointResult {
  taskId: string;
  checkpointId: string;
  budgetUsed: number;
  budgetExtended: number;
  approved: boolean;
}

export const requestCheckpoint = {
  name: "request-checkpoint",
  description: "Request a checkpoint for the current task, optionally requesting budget extension",
  inputSchema,
  handler: async (input: Input): Promise<RequestCheckpointResult> => {
    // Stub: would call jadecli.app checkpoint API
    return {
      taskId: input.taskId,
      checkpointId: `cp_${Date.now()}`,
      budgetUsed: input.budgetUsed,
      budgetExtended: input.requestBudgetExtension ?? 0,
      approved: true,
    };
  },
};

registerTool(requestCheckpoint);
