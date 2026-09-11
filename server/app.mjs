import {
  randomBytes,
  randomUUID,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { openStore } from "./store.mjs";
import { createMarket, validCoin } from "./market.mjs";

const scrypt = promisify(scryptCallback);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const SESSION_AGE = 7 * 24 * 60 * 60 * 1000;
const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
async function passwordHash(password, salt = randomBytes(16).toString("hex")) {
  const result = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 3,
    maxmem: 64 * 1024 * 1024,
  });
  return `3:${salt}:${result.toString("hex")}`;
}
async function passwordMatches(password, stored) {
  const parts = stored.split(":");
  // Preserve accounts made during the first local preview and upgrade on login.
  const legacy = parts.length === 2;
  const [salt, expected] = legacy ? parts : parts.slice(1);
  if (
    (!legacy && parts[0] !== "3") ||
    !/^[a-f0-9]{32}$/.test(salt) ||
    !/^[a-f0-9]{128}$/.test(expected)
  )
    return false;
  const actual = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: legacy ? 1 : 3,
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}

export function createService({
  db = openStore(),
  market = createMarket(),
  now = Date.now,
  origin = process.env.APP_ORIGIN || "http://127.0.0.1:3000",
} = {}) {
  const allowedOrigin = new URL(origin).origin;
  const secure = allowedOrigin.startsWith("https:");
  if (process.env.NODE_ENV === "production" && !secure)
    throw new Error("Production APP_ORIGIN must use HTTPS");
  const limits = new Map();
  function limit(key, maximum, windowMs) {
    if (limits.size > 5000)
      for (const [id, bucket] of limits)
        if (bucket.until < now()) limits.delete(id);
    const previous = limits.get(key);
    const bucket =
      previous && previous.until > now()
        ? previous
        : { count: 0, until: now() + windowMs };
    if (limits.size >= 10000 && !limits.has(key))
      fail(429, "Server is busy. Please try again later.");
    limits.set(key, bucket);
    if (++bucket.count > maximum)
      fail(429, "Too many requests. Please try again later.");
  }
  function sessionCookie(token, age = SESSION_AGE / 1000) {
    return `cs_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? "; Secure" : ""}`;
  }
  function session(req) {
    const token = req.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("cs_session="))
      ?.slice(11);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    return (
      db
        .prepare(
          "SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?",
        )
        .get(hash(token), now()) || null
    );
  }
  function signIn(user, headers) {
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now());
    const token = randomBytes(32).toString("hex");
    db.prepare("INSERT INTO sessions VALUES (?, ?, ?)").run(
      hash(token),
      user.id,
      now() + SESSION_AGE,
    );
    headers.set("Set-Cookie", sessionCookie(token));
    return { user: { id: user.id, name: user.name, email: user.email } };
  }
  async function body(req) {
    if (!req.headers.get("content-type")?.startsWith("application/json"))
      fail(415, "Use a JSON request body.");
    const text = await req.text();
    if (Buffer.byteLength(text) > 16_384) fail(413, "Request is too large.");
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      fail(400, "Invalid JSON.");
    }
    if (!data || typeof data !== "object" || Array.isArray(data))
      fail(400, "Invalid request body.");
    return data;
  }
  function holdingInput(data) {
    if (!validCoin(data.coin_id)) fail(400, "Choose a valid asset.");
    if (
      typeof data.quantity !== "number" ||
      !Number.isFinite(data.quantity) ||
      data.quantity <= 0 ||
      data.quantity > 1e12
    )
      fail(400, "Enter a quantity greater than zero, up to 1 trillion.");
    if (
      typeof data.cost_basis !== "number" ||
      !Number.isFinite(data.cost_basis) ||
      data.cost_basis < 0 ||
      data.cost_basis > 1e12
    )
      fail(400, "Enter a valid nonnegative average cost.");
    return data;
  }
  async function handle(req, ip = "local") {
    const headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
    });
    try {
      limit(`api:${ip}`, 240, 60_000);
      const url = new URL(req.url),
        path = url.pathname,
        method = req.method;
      if (
        !["GET", "HEAD"].includes(method) &&
        req.headers.get("origin") !== allowedOrigin
      )
        fail(403, "Request origin is not allowed.");
      let result;
      const user = session(req);
      const requireUser = () => user || fail(401, "Sign in to continue.");
      if (path === "/api/health" && method === "GET") result = { ok: true };
      else if (path === "/api/me" && method === "GET") result = { user };
      else if (path === "/api/auth/register" && method === "POST") {
        limit(`auth:${ip}`, 12, 900_000);
        const data = await body(req),
          email =
            typeof data.email === "string"
              ? data.email.trim().toLowerCase()
              : "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
          fail(400, "Enter a valid email address.");
        if (
          typeof data.name !== "string" ||
          data.name.trim().length < 2 ||
          data.name.trim().length > 60
        )
          fail(400, "Use a name between 2 and 60 characters.");
        if (
          typeof data.password !== "string" ||
          data.password.length < 15 ||
          data.password.length > 128
        )
          fail(400, "Use a password between 15 and 128 characters.");
        if (db.prepare("SELECT id FROM users WHERE email = ?").get(email))
          fail(409, "An account already uses that email.");
        const encoded = await passwordHash(data.password),
          newUser = { id: randomUUID(), email, name: data.name.trim() };
        try {
          db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)").run(
            newUser.id,
            email,
            newUser.name,
            encoded,
            now(),
          );
        } catch (error) {
          if (String(error.message).includes("UNIQUE"))
            fail(409, "An account already uses that email.");
          throw error;
        }
        result = signIn(newUser, headers);
      } else if (path === "/api/auth/login" && method === "POST") {
        limit(`auth:${ip}`, 12, 900_000);
        const data = await body(req),
          email =
            typeof data.email === "string"
              ? data.email.trim().toLowerCase()
              : "";
        if (
          typeof data.password !== "string" ||
          !data.password.length ||
          data.password.length > 128 ||
          email.length > 254
        )
          fail(400, "Enter your email and password.");
        limit(`email:${hash(email)}`, 20, 900_000);
        const account = db
          .prepare("SELECT * FROM users WHERE email = ?")
          .get(email);
        // Equal-cost password work for unknown accounts.
        const matched = await passwordMatches(
          data.password,
          account?.password_hash || `3:${"0".repeat(32)}:${"0".repeat(128)}`,
        );
        if (!account || !matched) fail(401, "Email or password is incorrect.");
        if (!account.password_hash.startsWith("3:")) {
          db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
            await passwordHash(data.password),
            account.id,
          );
        }
        result = signIn(account, headers);
      } else if (path === "/api/auth/logout" && method === "POST") {
        const token = req.headers
          .get("cookie")
          ?.split(";")
          .map((x) => x.trim())
          .find((x) => x.startsWith("cs_session="))
          ?.slice(11);
        if (token)
          db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(
            hash(token),
          );
        headers.set("Set-Cookie", sessionCookie("", 0));
        result = { ok: true };
      } else if (path === "/api/markets" && method === "GET")
        result = await market.markets();
      else if (path === "/api/quotes" && method === "GET") {
        const ids = [
          ...new Set((url.searchParams.get("ids") || "").split(",")),
        ];
        if (!ids.length || ids.length > 100 || !ids.every(validCoin))
          fail(400, "Provide between 1 and 100 valid asset IDs.");
        result = await market.quotes(ids);
      } else if (
        /^\/api\/coins\/[^/]+\/(chart|exchanges)$/.test(path) &&
        method === "GET"
      ) {
        const [, , , coin, action] = path.split("/");
        if (!validCoin(coin)) fail(400, "Invalid asset.");
        if (action === "chart") {
          const days = url.searchParams.get("days") || "7";
          if (!["1", "7", "30", "365"].includes(days))
            fail(400, "Invalid chart range.");
          result = await market.chart(coin, days);
        } else result = await market.exchanges(coin);
      } else if (path === "/api/watchlist" && method === "GET") {
        requireUser();
        result = {
          data: db
            .prepare(
              "SELECT coin_id FROM watchlist WHERE user_id = ? ORDER BY created_at",
            )
            .all(user.id)
            .map((x) => x.coin_id),
        };
      } else if (
        /^\/api\/watchlist\/[^/]+$/.test(path) &&
        ["PUT", "DELETE"].includes(method)
      ) {
        requireUser();
        const coin = path.split("/")[3];
        if (!validCoin(coin)) fail(400, "Invalid asset.");
        if (method === "PUT") {
          if (
            db
              .prepare("SELECT COUNT(*) AS n FROM watchlist WHERE user_id = ?")
              .get(user.id).n >= 100
          )
            fail(400, "Your watchlist is full. Remove an asset first.");
          db.prepare("INSERT OR IGNORE INTO watchlist VALUES (?, ?, ?)").run(
            user.id,
            coin,
            now(),
          );
        } else
          db.prepare(
            "DELETE FROM watchlist WHERE user_id = ? AND coin_id = ?",
          ).run(user.id, coin);
        result = { ok: true };
      } else if (path === "/api/holdings" && method === "GET") {
        requireUser();
        result = {
          data: db
            .prepare(
              "SELECT id, coin_id, quantity, cost_basis, created_at FROM holdings WHERE user_id = ? ORDER BY sort_order, created_at DESC, id",
            )
            .all(user.id),
        };
      } else if (path === "/api/holdings" && method === "POST") {
        requireUser();
        const data = holdingInput(await body(req));
        if (
          db
            .prepare("SELECT COUNT(*) AS n FROM holdings WHERE user_id = ?")
            .get(user.id).n >= 200
        )
          fail(400, "Portfolio limit reached.");
        const id = randomUUID();
        db.prepare(`INSERT INTO holdings (id, user_id, coin_id, quantity, cost_basis, created_at, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MIN(sort_order), 1) - 1 FROM holdings WHERE user_id = ?))`).run(
          id,
          user.id,
          data.coin_id,
          data.quantity,
          data.cost_basis,
          now(),
          user.id,
        );
        result = { id };
      } else if (path === "/api/holdings/order" && method === "PUT") {
        requireUser();
        const { ids } = await body(req);
        const owned = db.prepare("SELECT id FROM holdings WHERE user_id = ?").all(user.id);
        const allowed = new Set(owned.map((h) => h.id));
        if (!Array.isArray(ids) || ids.length !== owned.length ||
            new Set(ids).size !== ids.length || ids.some((id) => !allowed.has(id)))
          fail(400, "Holdings changed. Refresh your portfolio and try again.");
        db.exec("BEGIN");
        try {
          const update = db.prepare("UPDATE holdings SET sort_order = ? WHERE id = ? AND user_id = ?");
          ids.forEach((id, position) => update.run(position, id, user.id));
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
        result = { ok: true };
      } else if (
        /^\/api\/holdings\/[^/]+$/.test(path) &&
        ["DELETE", "PUT"].includes(method)
      ) {
        requireUser();
        const id = path.split("/")[3];
        if (
          !db
            .prepare("SELECT id FROM holdings WHERE id = ? AND user_id = ?")
            .get(id, user.id)
        )
          fail(404, "Holding not found.");
        if (method === "DELETE")
          db.prepare("DELETE FROM holdings WHERE id = ? AND user_id = ?").run(
            id,
            user.id,
          );
        else {
          const data = holdingInput(await body(req));
          db.prepare(
            "UPDATE holdings SET coin_id = ?, quantity = ?, cost_basis = ? WHERE id = ? AND user_id = ?",
          ).run(data.coin_id, data.quantity, data.cost_basis, id, user.id);
        }
        result = { ok: true };
      } else if (
        /^\/api\/coins\/[^/]+\/notes$/.test(path) &&
        ["GET", "POST"].includes(method)
      ) {
        const coin = path.split("/")[3];
        if (!validCoin(coin)) fail(400, "Invalid asset.");
        if (method === "GET")
          result = {
            data: db
              .prepare(
                "SELECT n.id, n.user_id, n.body, n.created_at, u.name FROM notes n JOIN users u ON n.user_id = u.id WHERE n.coin_id = ? ORDER BY n.created_at DESC LIMIT 50",
              )
              .all(coin),
          };
        else {
          requireUser();
          limit(`notes:${user.id}`, 5, 60_000);
          const data = await body(req);
          if (
            typeof data.body !== "string" ||
            !data.body.trim() ||
            data.body.trim().length > 1000
          )
            fail(400, "Notes must contain 1–1000 characters.");
          const id = randomUUID();
          db.prepare("INSERT INTO notes VALUES (?, ?, ?, ?, ?)").run(
            id,
            user.id,
            coin,
            data.body.trim(),
            now(),
          );
          result = { id };
        }
      } else if (/^\/api\/notes\/[^/]+$/.test(path) && method === "DELETE") {
        requireUser();
        const result = db
          .prepare("DELETE FROM notes WHERE id = ? AND user_id = ?")
          .run(path.split("/")[3], user.id);
        if (!result.changes) fail(404, "Note not found.");
        return Response.json({ ok: true }, { headers });
      } else fail(404, "Not found.");
      return Response.json(result, { headers });
    } catch (error) {
      if (error.retryAfter)
        headers.set("Retry-After", String(error.retryAfter));
      return Response.json(
        {
          error: error.status
            ? error.message
            : "Request failed. Please try again.",
        },
        { status: error.status || 500, headers },
      );
    }
  }
  return { handle, db };
}
