import { test, expect } from "@playwright/test";

test("home dashboard shows the marriage flow live and other areas locked", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const marriageTile = page.getByRole("link", { name: /الأحوال الشخصية/ });
  await expect(marriageTile).toBeVisible();

  await expect(page.getByText("قريباً").first()).toBeVisible();
});

test("locale toggle switches to English and flips direction", async ({ page }) => {
  await page.goto("/ar");
  await page.getByRole("button", { name: /toggle language/i }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("How can we help you today?");
});

test("marriage tile redirects a signed-out visitor to login", async ({ page }) => {
  // Marriage & family now requires a real signed-in user (Supabase auth) —
  // see (client)/marriage/layout.tsx. Signed-in-flow tests live in
  // marriage-chat.spec.ts / marriage-documents.spec.ts using the
  // signInViaMagicLink helper.
  await page.goto("/en");
  await page.getByRole("link", { name: /Marriage & Family Law/ }).click();
  await expect(page).toHaveURL(/\/en\/login\?redirectTo=%2Fmarriage%2Fchat$/);
});
