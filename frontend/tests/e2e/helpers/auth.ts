import type { Page } from "@playwright/test";

const MAILPIT_URL = "http://127.0.0.1:54324";

/**
 * Builds a genuinely-unique-per-invocation test email. `testInfo.testId`
 * looked tempting but is WRONG here — it's stable per test *case* (based on
 * file + title), not per run, so every repeated `npx playwright test`
 * invocation reused the exact same address. Mailpit keeps history across
 * runs, so that address's inbox accumulated one magic-link email per past
 * run; grabbing anything other than truly-this-call's email meant
 * verifying an old, already-consumed token — which silently lands back on
 * /login, exactly what was observed.
 *
 * lawyer@test.local (the one seeded lawyer account) still has to be a
 * fixed, shared address, so this can't be the only safeguard — see
 * waitForMagicLink's before/after ID-diffing for the rest of the fix.
 */
function uniqueTestEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * Signs in via the real magic-link flow against local Supabase: submits
 * the login form, then polls the local Mailpit inbox (Supabase's built-in
 * email-testing server — see supabase/config.toml [local_smtp]) for the
 * email and follows the link it contains. `emailPrefix` becomes part of a
 * freshly-generated unique address (see uniqueTestEmail) unless a literal
 * `@`-containing email is passed instead (for the one seeded fixed
 * account, lawyer@test.local).
 */
export async function signInViaMagicLink(
  page: Page,
  emailPrefixOrFixedEmail: string,
  locale: "ar" | "en" = "en"
) {
  const email = emailPrefixOrFixedEmail.includes("@")
    ? emailPrefixOrFixedEmail
    : uniqueTestEmail(emailPrefixOrFixedEmail);

  // Snapshot which message IDs already exist for this address BEFORE
  // triggering a new one. lawyer@test.local is shared across multiple
  // tests in the same run, each sending its own email moments apart —
  // sorting by Created timestamp alone was not reliable (second-level
  // granularity ties let a test pick up the PREVIOUS test's already-
  // consumed email), confirmed live. Diffing by ID sidesteps timestamp
  // precision entirely: whatever's new after sending is unambiguously
  // this call's email, regardless of timing.
  const knownIds = new Set(await listMessageIds(email));

  await page.goto(`/${locale}/login`);
  // Locale-independent selectors on purpose: the label/button text is
  // translated per locale (Arabic renders neither "email" nor "send"),
  // so English-text regexes here would silently never match on ar — hit
  // this live via rtl.spec.ts's ar-locale call, which timed out on this
  // exact line 100% reproducibly until switched to id/type selectors.
  await page.locator("#login-email").fill(email);
  await page.locator('form button[type="submit"]').click();

  const link = await waitForNewMagicLink(email, knownIds);
  await page.goto(link);
}

async function listMessageIds(email: string): Promise<string[]> {
  const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
  if (!res.ok) return [];
  const { messages } = (await res.json()) as { messages: { ID: string }[] };
  return messages.map((m) => m.ID);
}

async function waitForNewMagicLink(
  email: string,
  knownIds: Set<string>,
  timeoutMs = 15_000
): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const searchRes = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`
    );
    if (searchRes.ok) {
      const { messages } = (await searchRes.json()) as { messages: { ID: string }[] };
      const freshMessage = messages.find((m) => !knownIds.has(m.ID));
      if (freshMessage) {
        const messageRes = await fetch(`${MAILPIT_URL}/api/v1/message/${freshMessage.ID}`);
        const message = (await messageRes.json()) as { Text: string; HTML: string };
        const match = (message.Text || message.HTML).match(
          /https?:\/\/[^\s"]+\/auth\/confirm\?[^\s"]+/
        );
        if (match) return match[0];
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for a NEW magic-link email to ${email} in Mailpit.`);
}
