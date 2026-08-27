import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

// Some sandboxes pre-provision a browser revision under
// PLAYWRIGHT_BROWSERS_PATH that doesn't match this project's pinned
// @playwright/test version. When that specific revision is present,
// point at it directly rather than downloading a new one; everywhere
// else (a normal `npx playwright install` machine, CI), fall through to
// Playwright's default resolution.
const sandboxChromePath = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const executablePath = existsSync(sandboxChromePath) ? sandboxChromePath : undefined;

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:4173",
    headless: true,
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
