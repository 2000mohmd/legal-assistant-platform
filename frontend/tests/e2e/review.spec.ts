import { test, expect } from "@playwright/test";
import { signInViaMagicLink } from "./helpers/auth";

// NOTE: requires local Supabase running with supabase/seed.sql applied
// (which seeds lawyer@test.local with profiles.role = 'lawyer') —
// untested in any environment so far (see helpers/auth.ts).
test.describe("review console (signed in as the seeded test lawyer)", () => {
  test.beforeEach(async ({ page }) => {
    await signInViaMagicLink(page, "lawyer@test.local");
  });

  test("review console: queue, approve, and audit trail", async ({ page }) => {
    await page.goto("/en/review");

    await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();
    const firstRow = page.getByRole("link").first();
    await firstRow.click();

    await expect(page.getByRole("heading", { name: "Item detail" })).toBeVisible();
    await page.getByRole("button", { name: "Approve", exact: true }).click();

    await expect(page.getByText("Approved").first()).toBeVisible();
    await expect(page.getByText("Audit trail")).toBeVisible();
  });

  test("review console: edit then approve shows a diff", async ({ page }) => {
    await page.goto("/en/review");
    await page.getByRole("link").nth(1).click();

    await page.getByRole("button", { name: "Edit then approve" }).click();
    const textarea = page.getByRole("textbox");
    await textarea.fill("An edited version of the draft for the diff view.");
    await page.getByRole("button", { name: "Save & approve" }).click();

    await expect(page.getByText("Approved (edited)").first()).toBeVisible();
    await expect(page.getByText("Diff: AI draft vs. edited final")).toBeVisible();
  });
});

test("review console denies a signed-in non-lawyer", async ({ page }, testInfo) => {
  await signInViaMagicLink(page, `not-a-lawyer-${testInfo.testId}@example.com`);
  await page.goto("/en/review");
  await expect(page.getByText(/not authorized/i)).toBeVisible();
});
