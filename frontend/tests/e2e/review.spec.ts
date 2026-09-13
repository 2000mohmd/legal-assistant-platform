import { test, expect } from "@playwright/test";
import { signInViaMagicLink } from "./helpers/auth";

// Requires local Supabase running with supabase/seed.sql applied (which
// seeds lawyer@test.local with profiles.role = 'lawyer') — verified live,
// passing. Both tests below share that one seeded account (it's the only
// lawyer-role user seeded), so two real bugs showed up here specifically:
// running them in parallel let one test's Mailpit search grab the other's
// concurrently-arriving email (fixed with `.serial`, forcing one sign-in
// to fully complete before the next starts), and even serially, two
// emails to the same address moments apart could tie on Mailpit's
// second-granularity timestamps (fixed in helpers/auth.ts by diffing
// message IDs before/after sending, rather than sorting by timestamp).
test.describe.serial("review console (signed in as the seeded test lawyer)", () => {
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

test("review console denies a signed-in non-lawyer", async ({ page }) => {
  await signInViaMagicLink(page, "not-a-lawyer");
  await page.goto("/en/review");
  await expect(page.getByText(/not authorized/i)).toBeVisible();
});
