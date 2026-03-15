import { z } from "zod";
import { registerTool } from "../../shared/register.js";

const inputSchema = z.object({
  crawlerName: z.string().describe("Crawler identifier from manifest (e.g., 'blog-crawler')"),
  schedule: z.string().optional().describe("Cron expression (5-field POSIX). Omit to use manifest default"),
  enabled: z.boolean().default(true).describe("Whether the schedule is active"),
  budgetToolCalls: z.number().default(200).describe("Max tool calls per crawl run"),
});

type Input = z.infer<typeof inputSchema>;

export const scheduleCrawl = {
  name: "schedule-crawl",
  description: "Register or update a cron schedule for a crawl job",
  inputSchema,
  handler: async (input: Input) => {
    // Stub: would persist schedule to jadecli.app crawl-scheduler endpoint
    return {
      crawlerName: input.crawlerName,
      schedule: input.schedule ?? "0 3 * * *",
      enabled: input.enabled,
      budgetToolCalls: input.budgetToolCalls,
      scheduledAt: new Date().toISOString(),
      success: true,
    };
  },
};

registerTool(scheduleCrawl);
