import { z } from "zod";
import { registerTool } from "../../shared/register.js";

const inputSchema = z.object({
  taskId: z.string().describe("The task this artifact belongs to"),
  artifactType: z.string().describe("Type of artifact (report, code, analysis, etc.)"),
  content: z.string().describe("The artifact content"),
  metadata: z.object({
    model: z.string(),
    tokenCount: z.number(),
    toolCallsUsed: z.number(),
  }).optional(),
});

type Input = z.infer<typeof inputSchema>;

interface SubmitArtifactResult {
  taskId: string;
  artifactId: string;
  type: string;
  submittedAt: string;
  accepted: boolean;
}

export const submitArtifact = {
  name: "submit-artifact",
  description: "Submit a completed artifact for a task, with provenance metadata",
  inputSchema,
  handler: async (input: Input): Promise<SubmitArtifactResult> => {
    // Stub: would POST to jadecli.app artifact store
    return {
      taskId: input.taskId,
      artifactId: `art_${Date.now()}`,
      type: input.artifactType,
      submittedAt: new Date().toISOString(),
      accepted: true,
    };
  },
};

registerTool(submitArtifact);
