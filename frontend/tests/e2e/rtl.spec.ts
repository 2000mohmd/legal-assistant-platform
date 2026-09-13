import { test, expect } from "@playwright/test";
import { signInViaMagicLink } from "./helpers/auth";

// /marriage/* and /review redirect a signed-out visitor to /login, but the
// dir/lang attributes are set on <html> by the outer layout regardless of
// which page ends up rendering, so these checks hold either way.
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

// Requires local Supabase running — verified live, passing.
test("numeric citation identifiers stay LTR inside an Arabic-direction page", async ({
  page,
}) => {
  await signInViaMagicLink(page, "rtl-test", "ar");
  await page.goto("/ar/marriage/chat");
  await page.getByRole("button", { name: /مهر/ }).click();
  const citationNumber = page.locator("bdi").first();
  await expect(citationNumber).toHaveAttribute("dir", "ltr");
});
