import React from "react";
import { it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import App from "../renewal/App";
vi.mock("../renewal/Chart", () => ({
  default: ({ label }) => <div role="img" aria-label={label} />,
}));
const coin = {
  id: "bitcoin",
  name: "Bitcoin",
  symbol: "btc",
  current_price: 100,
  market_cap_rank: 1,
  market_cap: 1000000,
  total_volume: 1000,
  price_change_percentage_24h: 2,
  sparkline_in_7d: { price: [98, 99, 100] },
};
function setup({ signedIn = false, offline = false } = {}) {
  const calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path, options) => {
      calls.push([path, options]);
      if (path === "/api/me")
        return Response.json({
          user: signedIn ? { id: "one", name: "Richie" } : null,
        });
      if (path === "/api/markets")
        return Response.json(
          offline
            ? { error: "Market data is temporarily unavailable." }
            : {
                data: [
                  coin,
                  {
                    ...coin,
                    id: "ethereum",
                    name: "Ethereum",
                    symbol: "eth",
                    market_cap_rank: 2,
                  },
                ],
                updatedAt: Date.now(),
                stale: false,
              },
          { status: offline ? 503 : 200 },
        );
      if (path === "/api/watchlist") return Response.json({ data: [] });
      if (path === "/api/holdings") return Response.json({ data: [] });
      if (path.includes("/chart"))
        return Response.json({
          data: {
            prices: [
              [1, 99],
              [2, 100],
            ],
          },
        });
      if (path.endsWith("/exchanges"))
        return Response.json({ data: { tickers: [] } });
      return Response.json({ data: [] });
    }),
  );
  return calls;
}
it("renders markets, filters assets, and opens chart details with ranges", async () => {
  const calls = setup();
  render(<App />);
  await screen.findByRole("button", { name: "View Bitcoin" });
  fireEvent.change(screen.getByRole("textbox", { name: "Search assets" }), {
    target: { value: "bitcoin" },
  });
  expect(screen.queryByRole("button", { name: "View Ethereum" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "View Bitcoin" }));
  const modal = screen.getByRole("dialog", { name: "Bitcoin details" });
  fireEvent.click(within(modal).getByRole("button", { name: "1M" }));
  await waitFor(() =>
    expect(calls.some(([path]) => path.endsWith("days=30"))).toBe(true),
  );
  fireEvent.click(within(modal).getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("shows market errors without fabricated prices", async () => {
  setup({ offline: true });
  render(<App />);
  expect(
    await screen.findByText("Market data is temporarily unavailable."),
  ).toBeTruthy();
  expect(screen.queryByRole("button", { name: "View Bitcoin" })).toBeNull();
  expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
});
it("asks signed-out users to sign in before saving", async () => {
  setup();
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "Save Bitcoin" }));
  expect(screen.getByRole("dialog", { name: "Sign in" })).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "New here? Create an account" }),
  );
  expect(screen.getByLabelText("Your name")).toBeTruthy();
});
it("saves an asset through the API and shows it in the watchlist", async () => {
  const calls = setup({ signedIn: true });
  render(<App />);
  await screen.findByText("Richie");
  fireEvent.click(await screen.findByRole("button", { name: "Save Bitcoin" }));
  await screen.findByRole("button", { name: "Remove Bitcoin" });
  expect(
    calls.some(
      ([path, options]) =>
        path === "/api/watchlist/bitcoin" && options.method === "PUT",
    ),
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Watchlist" }));
  expect(screen.getByRole("button", { name: "View Bitcoin" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "View Ethereum" })).toBeNull();
});
it("opens the portfolio with a useful signed-out state", async () => {
  setup();
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Portfolio" }));
  expect(await screen.findByText("Your own point of view.")).toBeTruthy();
});
it("creates and edits portfolio holdings with server-owned records", async () => {
  setup({ signedIn: true });
  const original = globalThis.fetch;
  let holdings = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path, options) => {
      if (path === "/api/holdings" && options.method === "POST") {
        holdings = [{ id: "holding-1", ...JSON.parse(options.body) }];
        return Response.json({ id: "holding-1" });
      }
      if (path === "/api/holdings/holding-1" && options.method === "PUT") {
        holdings = [{ id: "holding-1", ...JSON.parse(options.body) }];
        return Response.json({ ok: true });
      }
      if (path === "/api/holdings/holding-1" && options.method === "DELETE") {
        holdings = [];
        return Response.json({ ok: true });
      }
      if (path === "/api/holdings") return Response.json({ data: holdings });
      return original(path, options);
    }),
  );
  render(<App />);
  await screen.findByText("Richie");
  fireEvent.click(screen.getByRole("button", { name: "Portfolio" }));
  fireEvent.change(screen.getByLabelText("Asset"), {
    target: { value: "bitcoin" },
  });
  fireEvent.change(screen.getByLabelText("Quantity"), {
    target: { value: "2" },
  });
  fireEvent.change(screen.getByLabelText("Average cost per unit (USD)"), {
    target: { value: "80" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add holding" }));
  expect(await screen.findByText("2 units · $80.00 average cost")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  fireEvent.change(screen.getByLabelText("Quantity"), {
    target: { value: "3" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByText("3 units · $80.00 average cost")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Remove Bitcoin holding" }));
  await screen.findByText("Start with your first asset.");
  expect(screen.getByRole("heading", { name: "$0.00" })).toBeTruthy();
});

it("restores a direct asset link and responds to Back/Forward navigation", async () => {
  setup();
  window.history.replaceState(null, "", "/watchlist?coin=bitcoin");
  render(<App />);
  expect(
    await screen.findByRole("dialog", { name: "Bitcoin details" }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(window.location.pathname).toBe("/watchlist");
  expect(window.location.search).toBe("");
  window.history.replaceState(null, "", "/portfolio");
  fireEvent(window, new PopStateEvent("popstate"));
  expect(await screen.findByText("Your own point of view.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Discover" }));
  expect(window.location.pathname).toBe("/");
});

it("keeps saved assets outside the top 50 visible and removable when quotes fail", async () => {
  setup({ signedIn: true });
  const original = globalThis.fetch;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path, options) => {
      if (path === "/api/watchlist")
        return Response.json({ data: ["old-asset"] });
      if (path.startsWith("/api/quotes"))
        return Response.json({ error: "Quotes unavailable" }, { status: 503 });
      return original(path, options);
    }),
  );
  render(<App />);
  await screen.findByText("Richie");
  fireEvent.click(screen.getByRole("button", { name: "Watchlist" }));
  expect(
    await screen.findByRole("button", { name: "Remove old-asset" }),
  ).toBeTruthy();
  expect(await screen.findByText("Quotes unavailable")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Remove old-asset" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Remove old-asset" }),
    ).toBeNull(),
  );
});

it("fetches and values a holding outside the market overview", async () => {
  setup({ signedIn: true });
  const original = globalThis.fetch;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path, options) => {
      if (path === "/api/holdings")
        return Response.json({
          data: [
            { id: "holding", coin_id: "litecoin", quantity: 2, cost_basis: 50 },
          ],
        });
      if (path.startsWith("/api/quotes"))
        return Response.json({
          data: [
            {
              ...coin,
              id: "litecoin",
              name: "Litecoin",
              symbol: "ltc",
              current_price: 60,
            },
          ],
          stale: false,
        });
      return original(path, options);
    }),
  );
  render(<App />);
  await screen.findByText("Richie");
  fireEvent.click(screen.getByRole("button", { name: "Portfolio" }));
  await screen.findByText("Litecoin");
  expect(screen.getByRole("heading", { name: "$120.00" })).toBeTruthy();
});

it("reorders holdings with keyboard and pointer controls and restores order if saving fails", async () => {
  setup({ signedIn: true });
  const original = globalThis.fetch;
  let failSave = false;
  const ids = ["first", "second"];
  vi.stubGlobal("fetch", vi.fn(async (path, options) => {
    if (path === "/api/holdings") return Response.json({ data: ids.map((id, i) => ({
      id, coin_id: i ? "ethereum" : "bitcoin", quantity: 1, cost_basis: 10,
    })) });
    if (path === "/api/holdings/order") {
      expect(JSON.parse(options.body).ids).toEqual(failSave ? ids : [...ids].reverse());
      return Response.json(failSave ? { error: "Could not save order" } : { ok: true }, { status: failSave ? 503 : 200 });
    }
    return original(path, options);
  }));
  window.history.replaceState({}, "", "/portfolio");
  render(<App />);
  const bitcoin = await screen.findByRole("button", { name: "Reorder Bitcoin holding" });
  const order = () => screen.getAllByRole("button", { name: /^Reorder/ }).map(b => b.getAttribute("aria-label"));
  fireEvent.keyDown(bitcoin, { key: "ArrowDown" });
  await screen.findByText("Holding order saved");
  expect(order()).toEqual(["Reorder Ethereum holding", "Reorder Bitcoin holding"]);
  failSave = true;
  vi.stubGlobal("PointerEvent", MouseEvent);
  bitcoin.setPointerCapture = vi.fn();
  document.elementFromPoint = vi.fn(() => screen.getByRole("button", { name: "Reorder Ethereum holding" }));
  fireEvent.pointerDown(bitcoin, { button: 0 });
  fireEvent.pointerMove(bitcoin, { clientX: 10, clientY: 10 });
  expect(bitcoin.closest(".holding").classList.contains("holding-lifted")).toBe(true);
  fireEvent.pointerCancel(bitcoin);
  expect(bitcoin.closest(".holding").classList.contains("holding-lifted")).toBe(false);
  expect(order()).toEqual(["Reorder Ethereum holding", "Reorder Bitcoin holding"]);
  fireEvent.pointerDown(bitcoin, { button: 0, clientX: 0, clientY: 0 });
  fireEvent.pointerMove(bitcoin, { clientX: 10, clientY: 10 });
  fireEvent.pointerUp(bitcoin);
  await screen.findByText("Could not save order");
  delete document.elementFromPoint;
  expect(order()).toEqual(["Reorder Ethereum holding", "Reorder Bitcoin holding"]);
});

it.each(["login", "register"])("completes %s, reports rejected credentials, and signs out", async (mode) => {
  setup();
  const original = globalThis.fetch;
  let signedIn = false, reject = true;
  vi.stubGlobal("fetch", vi.fn(async (path, options) => {
    if (path === `/api/auth/${mode}`) {
      const body = JSON.parse(options.body);
      expect(body.email).toBe("richie@example.com");
      if (mode === "register") expect(body.name).toBe("Richie");
      if (reject) return Response.json({ error: "Please check your credentials" }, { status: 400 });
      signedIn = true;
      return Response.json({ ok: true });
    }
    if (path === "/api/me") return Response.json({ user: signedIn ? { id: "one", name: "Richie" } : null });
    if (path === "/api/auth/logout") { signedIn = false; return Response.json({ ok: true }); }
    return original(path, options);
  }));
  window.history.replaceState({}, "", `/?auth=${mode}`);
  render(<App />);
  const modal = await screen.findByRole("dialog");
  fireEvent.change(within(modal).getByLabelText("Email address"), { target: { value: "richie@example.com" } });
  fireEvent.change(within(modal).getByLabelText("Password"), { target: { value: "a-long-test-password" } });
  if (mode === "register") fireEvent.change(within(modal).getByLabelText("Your name"), { target: { value: "Richie" } });
  fireEvent.submit(modal.querySelector("form"));
  expect(await within(modal).findByRole("alert")).toBeTruthy();
  reject = false;
  fireEvent.submit(modal.querySelector("form"));
  await screen.findByText("Richie");
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await screen.findByText("Signed out");
  expect(screen.queryByText("Richie")).toBeNull();
});

it("posts plain-text notes and only exposes delete controls for the author", async () => {
  setup({ signedIn: true });
  const original = globalThis.fetch;
  let notes = [{ id: "other", user_id: "two", name: "Other author", created_at: 1, body: "A different perspective" }];
  const text = "<img src=x onerror=alert(1)>";
  vi.stubGlobal("fetch", vi.fn(async (path, options) => {
    if (path === "/api/coins/bitcoin/notes") {
      if (options.method === "POST") notes.push({ id: "mine", user_id: "one", name: "Richie", created_at: 1, body: JSON.parse(options.body).body });
      return Response.json({ data: notes });
    }
    if (path === "/api/notes/mine") { expect(options.method).toBe("DELETE"); notes = notes.filter(n => n.id !== "mine"); return Response.json({ ok: true }); }
    return original(path, options);
  }));
  render(<App />);
  await screen.findByText("Richie");
  fireEvent.click(await screen.findByRole("button", { name: "View Bitcoin" }));
  await screen.findByText("A different perspective");
  expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  fireEvent.change(screen.getByLabelText("Add your perspective"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Post note" }));
  const note = await screen.findByText(text);
  expect(note.querySelector("img")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  await waitFor(() => expect(screen.queryByText(text)).toBeNull());
  expect(screen.getByText("A different perspective")).toBeTruthy();
});

it("shows exchange prices but only links to HTTPS trade URLs", async () => {
  setup();
  const original = globalThis.fetch;
  vi.stubGlobal("fetch", vi.fn(async (path, options) => {
    if (path.endsWith("/exchanges")) return Response.json({ data: { tickers: [
      { market: { name: "Safe exchange" }, base: "BTC", target: "USD", converted_last: { usd: 101 }, trade_url: "https://example.com/trade" },
      { market: { name: "Unsafe exchange" }, base: "BTC", target: "USD", converted_last: { usd: 102 }, trade_url: "javascript:alert(1)" },
    ] } });
    return original(path, options);
  }));
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "View Bitcoin" }));
  expect((await screen.findByRole("link", { name: "View pair on Safe exchange" })).getAttribute("href")).toBe("https://example.com/trade");
  expect(screen.queryByRole("link", { name: "View pair on Unsafe exchange" })).toBeNull();
  expect(screen.getByText("$102.00")).toBeTruthy();
});

it("recovers market data after a failed request and sorts prices", async () => {
  setup();
  const original = globalThis.fetch;
  let failed = true;
  vi.stubGlobal("fetch", vi.fn(async (path, options) => {
    if (path === "/api/markets") {
      if (failed) return Response.json({ error: "Market temporarily offline" }, { status: 503 });
      return Response.json({ data: [coin, { ...coin, id: "ethereum", name: "Ethereum", current_price: 200, market_cap_rank: 2 }], updatedAt: Date.now(), stale: false });
    }
    return original(path, options);
  }));
  render(<App />);
  await screen.findByText("Market temporarily offline");
  failed = false;
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("button", { name: "View Bitcoin" });
  fireEvent.change(screen.getByLabelText("Sort assets"), { target: { value: "price" } });
  expect(screen.getAllByRole("button", { name: /^View (Bitcoin|Ethereum)$/ }).map(b => b.getAttribute("aria-label"))).toEqual(["View Ethereum", "View Bitcoin"]);
  expect(screen.queryByText("Market temporarily offline")).toBeNull();
});

it.each(["stale", "missing"])("pauses portfolio totals when quotes are %s", async (state) => {
  setup({ signedIn: true });
  const original = globalThis.fetch;
  vi.stubGlobal("fetch", vi.fn(async (path, options) => {
    if (path === "/api/holdings") return Response.json({ data: [{ id: "one", coin_id: "litecoin", quantity: 2, cost_basis: 50 }] });
    if (path.startsWith("/api/quotes")) return Response.json({ data: state === "missing" ? [] : [{ ...coin, id: "litecoin" }], stale: state === "stale" });
    return original(path, options);
  }));
  window.history.replaceState({}, "", "/portfolio");
  render(<App />);
  await screen.findByText("2 units · $50.00 average cost");
  await waitFor(() => expect(globalThis.fetch.mock.calls.some(([path]) => path.startsWith("/api/quotes"))).toBe(true));
  expect(screen.getByRole("heading", { name: "—" })).toBeTruthy();
  expect(screen.getByText("Quotes are unavailable, stale, or still loading. Totals are paused.")).toBeTruthy();
});

it("keeps a failed watchlist save unsaved and reports the error", async () => {
  setup({ signedIn: true });
  const original = globalThis.fetch;
  vi.stubGlobal("fetch", vi.fn(async (path, options) => path === "/api/watchlist/bitcoin"
    ? Response.json({ error: "Watchlist could not be saved" }, { status: 503 }) : original(path, options)));
  render(<App />);
  await screen.findByText("Richie");
  fireEvent.click(await screen.findByRole("button", { name: "Save Bitcoin" }));
  await screen.findByText("Watchlist could not be saved");
  expect(screen.getByRole("button", { name: "Save Bitcoin" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Remove Bitcoin" })).toBeNull();
});
