import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path("./src"),
      // "server-only" throws outside a React Server Components bundle; tests run in plain Node.
      "server-only": path("./tests/support/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/integration/global-setup.ts"],
          setupFiles: ["tests/integration/setup.ts"],
          // One shared test database: run files one at a time.
          fileParallelism: false,
        },
      },
    ],
  },
});
