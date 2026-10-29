import { beforeEach } from "vitest";
import { loadTestEnv } from "./env";

// Must run before anything imports @/server/db, which reads DATABASE_URL on import.
loadTestEnv();

const { db } = await import("@/server/db");
const { sql } = await import("drizzle-orm");

beforeEach(async () => {
  // Every app table hangs off "user", so this clears all of them.
  await db.execute(sql`TRUNCATE "user", verification, rate_limit CASCADE`);
});
