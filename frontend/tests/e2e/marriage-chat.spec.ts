import { test, expect } from "@playwright/test";

test("chat flow streams an answer with a verification badge and citation chip", async ({ page }) => {
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
