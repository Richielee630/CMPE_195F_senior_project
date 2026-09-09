const BASE = "https://api.coingecko.com/api/v3";
export const validCoin = (id) =>
  typeof id === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(id);

export function createMarket({
  fetcher = fetch,
  now = Date.now,
  apiKey = process.env.COINGECKO_API_KEY,
} = {}) {
  const cache = new Map();
  const pending = new Map();
  async function get(path, ttl = 120_000, validate = () => true) {
    const saved = cache.get(path);
    if (saved && now() - saved.time < ttl)
      return { data: saved.data, updatedAt: saved.time, stale: false };
    if (pending.has(path)) return pending.get(path);
    const task = (async () => {
      try {
        const response = await fetcher(BASE + path, {
          headers: apiKey ? { "x-cg-demo-api-key": apiKey } : {},
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok)
          throw new Error(`Market provider returned ${response.status}`);
        const data = await response.json();
        if (!validate(data)) throw new Error("Invalid market response");
        const entry = { data, time: now() };
        cache.set(path, entry);
        if (cache.size > 300) cache.delete(cache.keys().next().value);
        return { data, updatedAt: entry.time, stale: false };
      } catch {
        if (saved && now() - saved.time < 3_600_000)
          return { data: saved.data, updatedAt: saved.time, stale: true };
        const error = new Error(
          "Market data is temporarily unavailable. Please try again shortly.",
        );
        error.status = 503;
        throw error;
      } finally {
        pending.delete(path);
      }
    })();
    pending.set(path, task);
    return task;
  }
  return {
    markets: () =>
      get(
        "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=7d",
        120_000,
        (data) =>
          Array.isArray(data) &&
          data.length > 0 &&
          data.every(
            (c) =>
              validCoin(c.id) &&
              typeof c.name === "string" &&
              typeof c.symbol === "string" &&
              Number.isFinite(c.current_price),
          ),
      ),
    chart: (id, days) =>
      get(
        `/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
        300_000,
        (data) =>
          Array.isArray(data?.prices) &&
          data.prices.length > 1 &&
          data.prices.every(
            (p) =>
              Array.isArray(p) &&
              Number.isFinite(p[0]) &&
              Number.isFinite(p[1]),
          ),
      ),
    exchanges: (id) =>
      get(
        `/coins/${id}/tickers?order=volume_desc&depth=true`,
        300_000,
        (data) => Array.isArray(data?.tickers),
      ),
  };
}
