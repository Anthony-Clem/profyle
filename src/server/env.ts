import "server-only";
import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((value) => value || undefined);

const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GITHUB_CLIENT_ID: optional,
  GITHUB_CLIENT_SECRET: optional,
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: optional,
  SMTP_PASS: optional,
  EMAIL_FROM: z.string().min(1),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Server env, validated on first use so a missing var fails with its name. */
export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const vars = parsed.error.issues.map((issue) => issue.path.join("."));
      throw new Error(`Invalid or missing env vars: ${vars.join(", ")}`);
    }
    cached = parsed.data;
  }
  return cached;
}
