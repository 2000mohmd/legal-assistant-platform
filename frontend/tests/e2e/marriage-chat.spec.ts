import { test, expect } from "@playwright/test";
import { signInViaMagicLink } from "./helpers/auth";

// NOTE: requires local Supabase running (`supabase start`) — untested in
// any environment so far (see helpers/auth.ts). Each test signs in with a
// fresh, unique email since local Supabase has no test-data reset between
// runs and repeat sign-ins to the same address would each need their own
// magic link anyway.
test.describe("marriage chat (signed in)", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await signInViaMagicLink(page, `chat-test-${testInfo.testId}@example.com`);
  });

  test("chat flow streams an answer with a verification badge and citation chip", async ({
    page,
  }) => {
    await page.goto("/en/marriage/chat");

    await page.getByRole("button", { name: "Can part of the dowry be deferred?" }).click();

    // Streaming renders progressively; wait for the final verified badge to
    // appear once the mock stream + metadata sentinel have landed.
    await expect(page.getByText("Citations verified")).toBeVisible({ timeout: 10_000 });

    const citationChip = page.getByRole("button", { name: /Art\. 9/ });
    await expect(citationChip).toBeVisible();
    await citationChip.click();
    await expect(page.getByText(/Illustrative sample/)).toBeVisible();
  });

  test("high-stakes question surfaces the council-mode banner", async ({ page }) => {
    await page.goto("/en/marriage/chat");
    await page.getByRole("button", { name: "Who has custody rights after divorce?" }).click();
    await expect(page.getByText("High-stakes question")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Citation unverifiable")).toBeVisible();
  });
});
