import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithTimeout } from "./fetch-with-timeout";

describe("fetchWithTimeout", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
  });

  it("passes through a fast response unchanged", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("ok"));

    const result = await fetchWithTimeout(5000)("https://example.test");

    expect(await result.text()).toBe("ok");
  });

  it("aborts the request once the timeout elapses", async () => {
    global.fetch = vi.fn((_input, init: RequestInit | undefined) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      });
    }) as typeof fetch;

    const pending = fetchWithTimeout(1000)("https://example.test");
    const assertion = expect(pending).rejects.toThrow();

    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it("does not abort a response that resolves before the timeout", async () => {
    global.fetch = vi.fn().mockImplementation(
      (_input, init: RequestInit | undefined) =>
        new Promise((resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("should not abort")));
          setTimeout(() => resolve(new Response("fast")), 10);
        })
    ) as typeof fetch;

    const pending = fetchWithTimeout(5000)("https://example.test");
    await vi.advanceTimersByTimeAsync(10);

    expect(await (await pending).text()).toBe("fast");
  });
});
