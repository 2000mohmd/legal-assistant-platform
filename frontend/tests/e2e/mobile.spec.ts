import { test, expect } from "@playwright/test";
import { signInViaMagicLink } from "./helpers/auth";
import { expectNoSidewaysScroll, PHONE_VIEWPORT } from "./helpers/layout";

// Phone-sized run over the screens a client actually reaches. This is a
// consumer-facing product and Saudi consumer traffic is overwhelmingly
// mobile, so a page that scrolls sideways on a phone is a real defect,
// not a polish item.
//
// The review console's phone check is NOT here — it needs
// lawyer@test.local, the single seeded lawyer account, and two specs
// signing into that shared address concurrently race for each other's
// magic link (hit live; see review.spec.ts's `.serial` note). Every
// lawyer sign-in stays inside that one serial block, so the console's
// phone check lives there with an explicit setViewportSize().
// Sets the phone viewport directly rather than spreading
// `devices["iPhone 13"]`: that preset also carries
// defaultBrowserType: "webkit", which silently overrides the chromium
// project and fails on a machine where only Chromium is installed. What
// this file is actually testing is layout at phone width, so the width is
// what it should ask for.
test.use({ viewport: PHONE_VIEWPORT, isMobile: true, hasTouch: true });

test("public pages fit a phone screen in both locales", async ({ page }) => {
  for (const path of ["/ar", "/en", "/ar/login", "/en/login"]) {
    await page.goto(path);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expectNoSidewaysScroll(page);
  }
});

test("signed-in client pages fit a phone screen", async ({ page }) => {
  await signInViaMagicLink(page, "mobile-client");

  for (const path of ["/en/marriage/chat", "/ar/marriage/chat", "/en/marriage/documents"]) {
    await page.goto(path);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expectNoSidewaysScroll(page);
  }
});
