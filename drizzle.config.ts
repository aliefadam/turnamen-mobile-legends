import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load env from .env.local (used by Next.js) so a single file works everywhere.
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
