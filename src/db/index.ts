import { drizzle } from "drizzle-orm/node-postgres";
import { getConnectionString } from "@netlify/database";
import { Pool } from "pg";

// Netlify Database injects the correct connection for Functions, previews, and
// local `netlify dev`. This deliberately has no legacy database fallback.
const databaseUrl = getConnectionString();

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

// Local Postgres doesn't use SSL; Netlify Database connections do.
const isLocal =
  databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
