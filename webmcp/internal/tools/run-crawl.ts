import { z } from "zod";
import { registerTool } from "../../shared/register.js";

const inputSchema = z.object({
  crawlerName: z.string().describe("Crawler to execute"),
  dryRun: z.boolean().default(false).describe("Validate manifest without fetching"),
  limit: z.number().optional().describe("Max sources to crawl (for testing)"),
  sourceSlug: z.string().optional().describe("Crawl a single source by slug"),
});

type Input = z.infer<typeof inputSchema>;

export const runCrawl = {
  name: "run-crawl",
  description: "Execute a crawl job immediately (on-demand, outside cron schedule)",
  inputSchema,
  handler: async (input: Input) => {
    // Stub: would trigger crawl execution via jadecli.app crawl-runner endpoint
    const crawlRunId = `${input.crawlerName}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    return {
      crawlRunId,
      crawlerName: input.crawlerName,
      dryRun: input.dryRun,
      limit: input.limit ?? null,
      sourceSlug: input.sourceSlug ?? null,
      status: "queued",
      queuedAt: new Date().toISOString(),
      success: true,
    };
  },
};

registerTool(runCrawl);
