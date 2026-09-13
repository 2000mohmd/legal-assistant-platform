import { test, expect } from "@playwright/test";
import { signInViaMagicLink } from "./helpers/auth";

// Requires local Supabase running (`supabase start`) — verified live, passing.
test("document intake produces a drafted output gated as pending lawyer review by default", async ({
  page,
}) => {
  await signInViaMagicLink(page, "docs-test");
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
