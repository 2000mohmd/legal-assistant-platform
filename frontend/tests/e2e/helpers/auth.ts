import type { Page } from "@playwright/test";

const MAILPIT_URL = "http://127.0.0.1:54324";

/**
 * Signs in via the real magic-link flow against local Supabase: submits
 * the login form, then polls the local Mailpit inbox (Supabase's built-in
 * email-testing server — see supabase/config.toml [local_smtp]) for the
 * email and follows the link it contains.
 *
 * UNVERIFIED: written against Mailpit's documented REST API shape, but
 * never actually run — this machine has no Docker, so `supabase start`
 * (and therefore Mailpit) has never been up to test this against. If the
 * API shape has changed or the link-extraction regex is wrong, this will
 * need fixing the first time someone runs it for real.
 */
export async function signInViaMagicLink(page: Page, email: string, locale: "ar" | "en" = "en") {
  await page.goto(`/${locale}/login`);
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole("button", { name: /send/i }).click();

  const link = await waitForMagicLink(email);
  await page.goto(link);
}

async function waitForMagicLink(email: string, timeoutMs = 15_000): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const searchRes = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`
    );
    if (searchRes.ok) {
      const { messages } = (await searchRes.json()) as { messages: { ID: string }[] };
      if (messages.length > 0) {
        const messageRes = await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
        const message = (await messageRes.json()) as { Text: string; HTML: string };
        const match = (message.Text || message.HTML).match(
          /https?:\/\/[^\s"]+\/auth\/confirm\?[^\s"]+/
        );
        if (match) return match[0];
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for a magic-link email to ${email} in Mailpit.`);
}
