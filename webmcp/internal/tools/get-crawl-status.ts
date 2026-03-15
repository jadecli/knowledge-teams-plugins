import { z } from "zod";
import { registerTool } from "../../shared/register.js";

const inputSchema = z.object({
  crawlerName: z.string().describe("Crawler identifier to check status for"),
  includeHistory: z.boolean().default(false).describe("Include recent run history"),
  historyLimit: z.number().default(10).describe("Max history entries to return"),
});

type Input = z.infer<typeof inputSchema>;

export const getCrawlStatus = {
  name: "get-crawl-status",
  description: "Get current status and health of a registered crawl job",
  inputSchema,
  handler: async (input: Input) => {
    // Stub: would query jadecli.app crawl-status endpoint
    return {
      crawlerName: input.crawlerName,
      enabled: true,
      schedule: "0 3 * * *",
      lastRunId: null,
      lastRunAt: null,
      lastRunStatus: null,
      nextRunAt: null,
      totalSources: 0,
      sourcesCompleted: 0,
      freshnessSlaMet: false,
      history: [],
    };
  },
};

registerTool(getCrawlStatus);
