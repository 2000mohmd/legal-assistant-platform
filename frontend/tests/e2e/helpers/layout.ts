import { expect, type Page } from "@playwright/test";

/**
 * A page scrolls sideways when some descendant is wider than the viewport
 * and nothing clips it. Reporting the offending elements (not just the
 * fact of overflow) is what makes a failure actionable — otherwise you get
 * "something is too wide" and have to bisect the DOM by hand.
 *
 * Deliberately asserts on documentElement.scrollWidth rather than on the
 * per-element widths it collects: an element wider than the screen inside
 * its own `overflow-x: auto` wrapper (the review queue's table, by design)
 * is properly contained and must NOT fail this check. scrollWidth is what
 * actually reflects whether the page itself moves.
 */
export async function expectNoSidewaysScroll(page: Page) {
  const { viewport, scrollWidth, tooWide } = await page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;
    const wide: string[] = [];
    document.querySelectorAll("*").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > clientWidth + 1 && rect.height > 0) {
        wide.push(
          `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 60)}"> w=${Math.round(rect.width)}`
        );
      }
    });
    return {
      viewport: clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      tooWide: wide.slice(0, 8),
    };
  });

  expect(
    scrollWidth,
    `${page.url()} scrolls sideways at ${viewport}px. Elements wider than the viewport:\n` +
      (tooWide.length ? tooWide.join("\n") : "(none found — look for a margin or transform instead)")
  ).toBeLessThanOrEqual(viewport + 1);
}

/** iPhone 13 logical viewport — the reference phone for these checks. */
export const PHONE_VIEWPORT = { width: 390, height: 844 };
