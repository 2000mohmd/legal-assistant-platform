import { expect, type Browser } from "@playwright/test";
import { signInViaMagicLink } from "./auth";

/**
 * Submits a real document request as a fresh client and returns the unique
 * marker text it was submitted with, so a lawyer-side test can find
 * exactly that row in the queue.
 *
 * Tests that need a pending review item create their own here rather than
 * consuming one of the three seeded ones. Picking "the first Pending row"
 * out of the shared queue is a race between specs: two of them can open
 * the same row, and the first decision strips the action buttons the
 * other is about to click. Worse, it can steal the row another spec
 * submitted and is waiting on. Owning your own row removes both.
 */
export async function submitDocumentRequest(browser: Browser, label: string): Promise<string> {
  const marker = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await signInViaMagicLink(page, "request-client");
    await page.goto("/en/marriage/documents");
    await page.getByLabel("Briefly describe your situation").fill(marker);
    await page.getByLabel("Conditions you'd like considered").fill("Test conditions.");
    await page.getByRole("button", { name: "Draft the conditions" }).click();
    await expect(page.getByText(marker)).toBeVisible({ timeout: 10_000 });
  } finally {
    await context.close();
  }

  return marker;
}
