import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "./store.mjs";
import { createService } from "./app.mjs";
import { createMarket } from "./market.mjs";

const origin = "http://127.0.0.1:3000";
function client(service) {
  return async (
    path,
    { method = "GET", data, cookie, requestOrigin = origin } = {},
  ) => {
    const headers = {
      "Content-Type": "application/json",
      Origin: requestOrigin,
    };
    if (cookie) headers.Cookie = cookie;
    const response = await service.handle(
      new Request(origin + "/api" + path, {
        method,
        headers,
        ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
      }),
    );
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
      headers: response.headers,
    };
  };
}
const account = (n) => ({
  name: `Person ${n}`,
  email: `person${n}@example.com`,
  password: "a-long-test-password-123",
});
test("accounts, persistence, watchlists, holdings and notes enforce ownership", async () => {
  const directory = mkdtempSync(join(tmpdir(), "crypto-test-"));
  const filename = join(directory, "test.sqlite");
  let db = openStore(filename);
  let service = createService({ db });
  let api = client(service);
  try {
    const alice = await api("/auth/register", {
      method: "POST",
      data: account(1),
    });
    const bob = await api("/auth/register", {
      method: "POST",
      data: account(2),
    });
    assert.equal(alice.status, 200);
    assert.equal(bob.status, 200);
    assert.match(alice.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
    assert.notEqual(
      db
        .prepare("SELECT password_hash FROM users WHERE email = ?")
        .get(account(1).email).password_hash,
      account(1).password,
    );
    assert.equal((await api("/watchlist")).status, 401);
    assert.equal(
      (
        await api("/watchlist/bitcoin", {
          method: "PUT",
          cookie: alice.cookie,
          requestOrigin: "https://evil.example",
        })
      ).status,
      403,
    );
    assert.equal(
      (await api("/watchlist/bitcoin", { method: "PUT", cookie: alice.cookie }))
        .status,
      200,
    );
    assert.deepEqual(
      (await api("/watchlist", { cookie: bob.cookie })).data.data,
      [],
    );
    const holding = await api("/holdings", {
      method: "POST",
      cookie: alice.cookie,
      data: { coin_id: "bitcoin", quantity: 2, cost_basis: 100 },
    });
    assert.equal(holding.status, 200);
    assert.deepEqual(
      (await api("/holdings", { cookie: bob.cookie })).data.data,
      [],
    );
    assert.equal(
      (
        await api(`/holdings/${holding.data.id}`, {
          method: "DELETE",
          cookie: bob.cookie,
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await api(`/holdings/${holding.data.id}`, {
          method: "PUT",
          cookie: alice.cookie,
          data: { coin_id: "bitcoin", quantity: 3, cost_basis: 200 },
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await api("/holdings", {
          method: "POST",
          cookie: alice.cookie,
          data: { coin_id: "bitcoin", quantity: -1, cost_basis: 100 },
        })
      ).status,
      400,
    );
    const note = await api("/coins/bitcoin/notes", {
      method: "POST",
      cookie: alice.cookie,
      data: { body: "<script>plain text only</script>" },
    });
    assert.equal(note.status, 200);
    assert.equal(
      (
        await api(`/notes/${note.data.id}`, {
          method: "DELETE",
          cookie: bob.cookie,
        })
      ).status,
      404,
    );
    assert.equal(
      (await api("/coins/bitcoin/notes")).data.data[0].body,
      "<script>plain text only</script>",
    );
    db.close();
    db = openStore(filename);
    service = createService({ db });
    api = client(service);
    assert.deepEqual(
      (await api("/watchlist", { cookie: alice.cookie })).data.data,
      ["bitcoin"],
    );
    assert.equal(
      (await api("/holdings", { cookie: alice.cookie })).data.data[0].quantity,
      3,
    );
    assert.equal(
      (
        await api(`/notes/${note.data.id}`, {
          method: "DELETE",
          cookie: alice.cookie,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await api(`/holdings/${holding.data.id}`, {
          method: "DELETE",
          cookie: alice.cookie,
        })
      ).status,
      200,
    );
    assert.equal(
      (await api("/auth/logout", { method: "POST", cookie: alice.cookie }))
        .status,
      200,
    );
    assert.equal(
      (await api("/watchlist", { cookie: alice.cookie })).status,
      401,
    );
  } finally {
    db.close();
    rmSync(directory, { recursive: true });
  }
});
test("credentials, session expiry and auth throttling", async () => {
  let now = Date.now();
  const db = openStore(":memory:");
  const api = client(createService({ db, now: () => now }));
  try {
    assert.equal(
      (
        await api("/auth/register", {
          method: "POST",
          data: { ...account(1), password: "short" },
        })
      ).status,
      400,
    );
    const result = await api("/auth/register", {
      method: "POST",
      data: account(1),
    });
    assert.equal(
      (
        await api("/auth/login", {
          method: "POST",
          data: { ...account(1), password: "incorrect" },
        })
      ).status,
      401,
    );
    assert.equal(
      (await api("/auth/login", { method: "POST", data: account(1) })).status,
      200,
    );
    now += 8 * 86400_000;
    assert.equal(
      (await api("/watchlist", { cookie: result.cookie })).status,
      401,
    );
    for (let i = 0; i < 12; i++)
      await api("/auth/login", { method: "POST", data: {} });
    assert.equal(
      (await api("/auth/login", { method: "POST", data: {} })).status,
      429,
    );
  } finally {
    db.close();
  }
});
test("market cache deduplicates requests, labels stale data, and expires unavailable data", async () => {
  let now = 1,
    calls = 0,
    offline = false;
  const market = createMarket({
    now: () => now,
    fetcher: async () => {
      calls++;
      if (offline) throw new Error("offline");
      return Response.json([
        { id: "bitcoin", name: "Bitcoin", symbol: "btc", current_price: 100 },
      ]);
    },
  });
  const [a, b] = await Promise.all([market.markets(), market.markets()]);
  assert.deepEqual(a, b);
  assert.equal(calls, 1);
  await market.markets();
  assert.equal(calls, 1);
  now += 130_000;
  offline = true;
  assert.equal((await market.markets()).stale, true);
  now += 3600_000;
  await assert.rejects(market.markets(), /temporarily unavailable/);
});
test("market routes validate ranges and forward valid identifiers", async () => {
  const db = openStore(":memory:");
  const api = client(
    createService({
      db,
      market: {
        chart: async (id, days) => ({ id, days }),
        exchanges: async (id) => ({ id }),
      },
    }),
  );
  try {
    assert.equal((await api("/coins/bitcoin/chart?days=999")).status, 400);
    assert.deepEqual((await api("/coins/bitcoin/chart?days=30")).data, {
      id: "bitcoin",
      days: "30",
    });
    assert.deepEqual((await api("/coins/ethereum/exchanges")).data, {
      id: "ethereum",
    });
  } finally {
    db.close();
  }
});
