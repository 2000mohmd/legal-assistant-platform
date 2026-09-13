import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // Most specs now hit a real local Supabase stack (Postgres + GoTrue +
  // Mailpit in Docker) instead of mocks. Observed live: 4 workers hitting
  // it simultaneously produced a real timeout (page never finished loading
  // in time) that didn't reproduce at lower concurrency — capping workers
  // trades a bit of wall-clock time for reliability against the real stack.
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    // A production server (vs. `next dev`) avoids per-route on-demand
    // compilation, which otherwise makes the first navigation to each route
    // slow/flaky under parallel test workers.
    command: "npm run build && npm run start -- -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
