import { test, expect } from "@playwright/test";

test("review console: role gate, queue, approve, and audit trail", async ({ page }) => {
  await page.goto("/en/review");

  await expect(page.getByText("Sign in to the internal review console")).toBeVisible();
  await page.getByRole("button", { name: "Continue as reviewing lawyer" }).click();

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
  await page.getByRole("button", { name: "Continue as reviewing lawyer" }).click();
  await page.getByRole("link").nth(1).click();

  await page.getByRole("button", { name: "Edit then approve" }).click();
  const textarea = page.getByRole("textbox");
  await textarea.fill("An edited version of the draft for the diff view.");
  await page.getByRole("button", { name: "Save & approve" }).click();

  await expect(page.getByText("Approved (edited)").first()).toBeVisible();
  await expect(page.getByText("Diff: AI draft vs. edited final")).toBeVisible();
});
