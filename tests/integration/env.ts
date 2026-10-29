/**
 * Integration tests run against the Docker services with the defaults in
 * .env.example (vars already set, e.g. in CI, win) and the profyle_test database.
 */
export function loadTestEnv() {
  process.loadEnvFile(".env.example");
  if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is not set");
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
