import { test, expect } from "@playwright/test";
import { signInViaMagicLink } from "./helpers/auth";

// The single most important flow in the product: a client submits a
// document request, a lawyer actually receives it, decides on it, and the
// client sees the outcome. Before migration 0002 this loop did not exist
// at all — submissions were written to the database and no lawyer ever
// saw them — so it gets a test that would fail loudly if it silently
// disconnects again.
//
// Uses two independent browser contexts because the two halves are
// different signed-in users with different roles; a single context would
// let one session's cookies mask a real authorization bug.
test("client submission reaches the lawyer's queue and the decision returns to the client", async ({
  browser,
}) => {
  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();
  await signInViaMagicLink(clientPage, "loop-client");

  const marker = `LOOPTEST-${Date.now()}`;
  await clientPage.goto("/en/marriage/documents");
  await clientPage.getByLabel("Briefly describe your situation").fill(marker);
  await clientPage.getByLabel("Conditions you'd like considered").fill("Test conditions.");
  await clientPage.getByRole("button", { name: "Draft the conditions" }).click();

  // The client's own list should show it waiting on a lawyer.
  await expect(clientPage.getByText(marker)).toBeVisible({ timeout: 10_000 });
  await expect(clientPage.getByText("With your lawyer").first()).toBeVisible();

  // A lawyer, in a separate session, must actually receive it.
  const lawyerContext = await browser.newContext();
  const lawyerPage = await lawyerContext.newPage();
  await signInViaMagicLink(lawyerPage, "lawyer@test.local");
  await lawyerPage.goto("/en/review");

  const queueRow = lawyerPage.getByRole("link").filter({ hasText: marker });
  await expect(queueRow).toBeVisible({ timeout: 10_000 });
  await queueRow.click();

  await expect(lawyerPage.getByRole("heading", { name: "Item detail" })).toBeVisible();
  await lawyerPage.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(lawyerPage.getByText("Approved").first()).toBeVisible();

  // ...and the decision must come back to the client.
  await clientPage.reload();
  await expect(clientPage.getByText("Reviewed & approved").first()).toBeVisible({
    timeout: 10_000,
  });

  await clientContext.close();
  await lawyerContext.close();
});
