/**
 * @module db/client
 * @description Neon serverless database client.
 * One function, one job: create a typed Drizzle instance from DATABASE_URL.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

let cachedDb: NeonHttpDatabase<typeof schema> | null = null;

/** Returns a Drizzle ORM instance connected to Neon. */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (cachedDb) return cachedDb;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(url);
  cachedDb = drizzle(sql, { schema });
  return cachedDb;
}

/** Returns true if DATABASE_URL is configured. */
export function hasDatabase(): boolean {
  return !!process.env.DATABASE_URL;
}
