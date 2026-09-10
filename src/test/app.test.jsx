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
