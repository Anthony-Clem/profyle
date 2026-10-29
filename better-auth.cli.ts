// Used only by `pnpm auth:generate` to (re)generate src/server/db/schema/auth.ts.
// The Better Auth CLI can't load src/server/auth.ts because it imports "server-only".
// Keep the schema-affecting options (adapter, plugins, additionalFields) in sync with it.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/node-postgres";

export const auth = betterAuth({
  database: drizzleAdapter(drizzle.mock(), { provider: "pg" }),
  plugins: [emailOTP({ async sendVerificationOTP() {} })],
});
