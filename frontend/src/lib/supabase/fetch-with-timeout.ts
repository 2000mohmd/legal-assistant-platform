/**
 * Wraps fetch with a hard timeout so a genuinely hanging connection (e.g. a
 * firewall silently dropping packets instead of refusing them) fails fast
 * instead of blocking a request indefinitely.
 *
 * Does NOT address a different, separately-observed slowness: with
 * Supabase completely unreachable on this machine, `@supabase/supabase-js`
 * itself took ~7-8s to report `ECONNREFUSED` even in a bare Node script
 * with no Next.js and no custom fetch involved — confirmed empirically,
 * so that delay is internal retry/backoff behavior in the client library
 * itself, not a hanging fetch this wrapper could catch. Once Supabase is
 * actually reachable there's nothing to retry, so this is a non-issue in
 * practice — noted here only so nobody re-diagnoses it as this wrapper
 * failing to work.
 */
export function fetchWithTimeout(timeoutMs = 5000): typeof fetch {
  return (input, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(input, { ...init, signal: controller.signal }).finally(() =>
      clearTimeout(timeout)
    );
  };
}
