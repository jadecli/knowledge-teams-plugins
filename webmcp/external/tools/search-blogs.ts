/**
 * @module webmcp/external/tools/search-blogs
 * @description WebMCP tool for querying cached customer blog posts.
 * Agents use this to find relevant customer case studies without re-crawling.
 */

import { z } from "zod";
import { registerTool } from "../../shared/register.js";

const searchBlogs = {
  name: "search-blogs",
  description:
    "Search cached Anthropic customer blog posts by company, tag, or keyword. " +
    "Returns matching case studies from claude.com/customers/*.",
  inputSchema: z.object({
    /** Filter by company name (partial match) */
    company: z.string().optional(),
    /** Filter by tag (exact match) */
    tag: z.string().optional(),
    /** Full-text keyword search across cached content */
    keyword: z.string().optional(),
    /** Maximum results to return */
    limit: z.number().default(10),
  }),
  handler: async (input: {
    company?: string;
    tag?: string;
    keyword?: string;
    limit: number;
  }): Promise<unknown> => {
    // Stub: will query meta_blog_cache via Drizzle when database is connected
    // For now, returns the manifest-based results
    const { BLOG_MANIFEST, getBlogsByTag } = await import(
      "../../../lib/blog-manifest.js"
    );

    let results = [...BLOG_MANIFEST];

    if (input.company) {
      const query = input.company.toLowerCase();
      results = results.filter((e) =>
        e.company.toLowerCase().includes(query),
      );
    }

    if (input.tag) {
      const tagged = getBlogsByTag(input.tag);
      const taggedUrls = new Set(tagged.map((e) => e.url));
      results = results.filter((e) => taggedUrls.has(e.url));
    }

    return {
      results: results.slice(0, input.limit).map((e) => ({
        company: e.company,
        slug: e.slug,
        url: e.url,
        tags: e.tags,
      })),
      total: results.length,
      truncated: results.length > input.limit,
    };
  },
};

registerTool(searchBlogs);

export default searchBlogs;
