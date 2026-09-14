import { test, expect } from "@playwright/test";
import { signInViaMagicLink } from "./helpers/auth";

// Requires local Supabase running (`supabase start`) — verified live,
// passing. Each test signs in with a fresh, unique email (see
// helpers/auth.ts) since local Supabase has no test-data reset between
// runs and repeat sign-ins to the same address would each need their own
// magic link anyway.
test.describe("marriage chat (signed in)", () => {
  test.beforeEach(async ({ page }) => {
    await signInViaMagicLink(page, "chat-test");
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

  // An answer failing is the case that has to behave well, because the
  // alternative the code used to take was worse than an error: a 401's
  // body is the literal string "Unauthorized", and the old reader streamed
  // whatever came back straight into the assistant bubble — so a failure
  // could appear as the assistant confidently saying "Unauthorized", or as
  // a blank bubble with the input locked forever.
  test("a failed answer says so instead of showing an empty or bogus reply", async ({ page }) => {
    await page.goto("/en/marriage/chat");

    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "assistant_unavailable" }),
      })
    );

    await page.getByRole("button", { name: "Can part of the dowry be deferred?" }).click();

    await expect(page.getByText(/couldn't produce a verified answer/i)).toBeVisible({
      timeout: 10_000,
    });
    // The user's own message stays; the assistant's empty placeholder must not.
    await expect(page.getByText("Can part of the dowry be deferred?").last()).toBeVisible();
    await expect(page.getByText("Citations verified")).toHaveCount(0);

    // And the user must be able to try again — the input is the thing that
    // used to stay disabled.
    await expect(page.getByRole("textbox")).toBeEnabled();
  });
});
