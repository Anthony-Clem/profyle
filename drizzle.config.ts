import { defineConfig } from "drizzle-kit";

// Locally, read .env if present; CI and Vercel set env vars directly.
try {
  process.loadEnvFile();
} catch {}

// Migrations need a direct connection (Neon's pooler doesn't support every migration statement).
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("Set DATABASE_URL_UNPOOLED or DATABASE_URL to run drizzle-kit");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
