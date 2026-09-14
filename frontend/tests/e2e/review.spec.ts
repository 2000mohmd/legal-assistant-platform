import { test, expect, type Browser, type Page } from "@playwright/test";
import { signInAsLawyer, signInViaMagicLink } from "./helpers/auth";
import { submitDocumentRequest } from "./helpers/requests";
import { expectNoSidewaysScroll, PHONE_VIEWPORT } from "./helpers/layout";

// Requires local Supabase running with supabase/seed.sql applied.
//
// These tests used to run `.serial` and share lawyer@test.local, because
// two things genuinely raced: concurrent sign-ins to one mailbox could
// consume each other's single-use magic link, and both tests picked "the
// first Pending row" out of a queue every other spec was also mutating.
// Serializing one file papered over both without fixing either — nothing
// stopped a spec in another worker from doing the same thing.
//
// Both are now fixed at the source: signInAsLawyer() mints a private
// lawyer account per call (see seed.sql's dev-only promotion rule), and
// each test submits and then claims its OWN queue row. So these can run
// fully parallel.
test.describe("review console", () => {
  /** Opens the queue row for a request this test created, not a shared one. */
  async function openOwnItem(page: Page, browser: Browser, label: string) {
    const marker = await submitDocumentRequest(browser, label);

    await signInAsLawyer(page);
    await page.goto("/en/review");
    await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();

    const row = page.getByRole("link").filter({ hasText: marker });
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.click();
    await expect(page.getByRole("heading", { name: "Item detail" })).toBeVisible();
  }

  test("queue, approve, and audit trail", async ({ page, browser }) => {
    await openOwnItem(page, browser, "APPROVE");

    await page.getByRole("button", { name: "Approve", exact: true }).click();

    await expect(page.getByText("Approved").first()).toBeVisible();
    await expect(page.getByText("Audit trail")).toBeVisible();
  });

  test("edit then approve shows a diff", async ({ page, browser }) => {
    await openOwnItem(page, browser, "EDIT");

    await page.getByRole("button", { name: "Edit then approve" }).click();
    const textarea = page.getByRole("textbox");
    await textarea.fill("An edited version of the draft for the diff view.");
    await page.getByRole("button", { name: "Save & approve" }).click();

    await expect(page.getByText("Approved (edited)").first()).toBeVisible();
    await expect(page.getByText("Diff: AI draft vs. edited final")).toBeVisible();
  });

  // The queue's table IS wider than a phone on purpose — four columns
  // don't usefully compress — so what's asserted is that it stays inside
  // its own scroll container and the page doesn't move sideways with it.
  test("fits a phone screen", async ({ page, browser }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await openOwnItem(page, browser, "MOBILE");

    await expectNoSidewaysScroll(page);

    await page.goto("/en/review");
    await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();
    await expectNoSidewaysScroll(page);
  });
});

test("review console denies a signed-in non-lawyer", async ({ page }) => {
  await signInViaMagicLink(page, "not-a-lawyer");
  await page.goto("/en/review");
  await expect(page.getByText(/not authorized/i)).toBeVisible();
});
