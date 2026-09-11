import { test, expect } from "@playwright/test";
import { signInViaMagicLink } from "./helpers/auth";

// NOTE: requires local Supabase running (`supabase start`) — untested in
// any environment so far (see helpers/auth.ts).
test("document intake produces a drafted output gated as pending lawyer review by default", async ({
  page,
}, testInfo) => {
  await signInViaMagicLink(page, `docs-test-${testInfo.testId}@example.com`);
  await page.goto("/en/marriage/documents");

  await page.getByLabel("Briefly describe your situation").fill("Demo situation for testing.");
  await page.getByLabel("Conditions you'd like considered").fill("Demo condition for testing.");
  await page.getByRole("button", { name: "Draft the conditions" }).click();

  await expect(page.getByText("Your lawyer is reviewing this")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Najiz platform/ })).toBeVisible();

  // The template-approved state is only reachable via the explicitly
  // labeled demo toggle, never the default.
  await page.getByLabel("Demo: switch review state").check();
  await expect(page.getByText(/Reviewed & approved template/)).toBeVisible();
});
