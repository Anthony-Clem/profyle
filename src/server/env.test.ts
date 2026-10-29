import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const valid = {
  DATABASE_URL: "postgres://u:p@localhost:5433/db",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  GITHUB_CLIENT_ID: "",
  S3_ENDPOINT: "http://localhost:9000",
  S3_REGION: "us-east-1",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
  S3_BUCKET: "bucket",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  EMAIL_FROM: "Profyle <no-reply@profyle.io>",
};

describe("env()", () => {
  beforeEach(() => {
    vi.resetModules();
    for (const [name, value] of Object.entries(valid)) vi.stubEnv(name, value);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("parses valid vars, coercing numbers and treating blanks as unset", async () => {
    const { env } = await import("./env");

    expect(env().SMTP_PORT).toBe(1025);
    expect(env().GITHUB_CLIENT_ID).toBeUndefined();
  });

  it("names every invalid or missing var", async () => {
    vi.stubEnv("DATABASE_URL", "not a url");
    vi.stubEnv("S3_BUCKET", "");
    const { env } = await import("./env");

    expect(() => env()).toThrow("Invalid or missing env vars: DATABASE_URL, S3_BUCKET");
  });
});
