import { it, expect, vi } from "vitest";
import { request } from "../renewal/api";
it("explains connection and unreadable server failures", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
  );
  await expect(request("/me")).rejects.toThrow("Cannot reach the server");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response("<html>bad gateway</html>", { status: 502 }),
      ),
  );
  await expect(request("/me")).rejects.toThrow("unreadable response");
});
it("exposes provider retry timing to callers", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { error: "Unavailable" },
          { status: 503, headers: { "Retry-After": "60" } },
        ),
      ),
  );
  await expect(request("/markets")).rejects.toMatchObject({
    status: 503,
    retryAfter: 60,
  });
});
