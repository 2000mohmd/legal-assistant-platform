import { test, expect } from "@playwright/test";

const screens = ["/", "/marriage/chat", "/marriage/documents", "/review"];

for (const screen of screens) {
  test(`${screen || "home"} renders dir="rtl" in Arabic and dir="ltr" in English`, async ({ page }) => {
    await page.goto(`/ar${screen === "/" ? "" : screen}`);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await page.goto(`/en${screen === "/" ? "" : screen}`);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
}

test("numeric citation identifiers stay LTR inside an Arabic-direction page", async ({ page }) => {
  await page.goto("/ar/marriage/chat");
  await page.getByRole("button", { name: /مهر/ }).click();
  const citationNumber = page.locator("bdi").first();
  await expect(citationNumber).toHaveAttribute("dir", "ltr");
});
