# Architecture

## Runtime

- React 19 UI in `src/renewal/`, standard CSS, native canvas charts and dialogs.
- Vite dev/preview server proxies `/api` to a loopback Node 24 HTTP server.
- `server/app.mjs` owns routing, validation, authentication, and authorization.
- `server/store.mjs` initializes durable SQLite; `server/schema.sql` is migration v1, tracked using `PRAGMA user_version`.
- `server/market.mjs` owns fixed-host CoinGecko access, validation, timeout, TTL caching, and in-flight deduplication.

The original React 16/Ant Design/Chart.js/Axios/Moment code was replaced. Historical source is available at dd7d8e1. Only React and React DOM remain as application npm dependencies.

## Identity

Passwords are salted and hashed with asynchronous scrypt (N=32768, r=8, p=3). Sessions use random 256-bit opaque tokens; only their SHA-256 hashes are stored. Cookies are HttpOnly, SameSite=Lax, scoped to `/`, and Secure when APP_ORIGIN is HTTPS. Sessions expire after seven days and logout deletes the server-side token.

Every private query binds the authenticated user ID. Request bodies cannot choose the owner. State-changing requests require the configured Origin and JSON bodies when data is expected. Bodies are capped at 16 KiB. Auth and note writes are throttled; SQL uses bound parameters and foreign keys.

Rate limits are process-local and suitable for this local single-process checkpoint. A production multi-instance release needs a shared limit store and correctly configured trusted proxy/client address handling. The API intentionally does not trust forwarded identity headers.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /api/health | Health check |
| GET | /api/markets | Top 50 assets with seven-day trends |
| GET | /api/coins/:id/chart?days=1\|7\|30\|365 | Price history |
| GET | /api/coins/:id/exchanges | Exchange tickers |
| POST | /api/auth/register | Register and create session |
| POST | /api/auth/login | Verify credentials and create session |
| POST | /api/auth/logout | Revoke session |
| GET | /api/me | Optional current user |
| GET | /api/watchlist | Current user's saved asset IDs |
| PUT / DELETE | /api/watchlist/:coin | Save/remove asset |
| GET / POST | /api/holdings | List/create owned holdings |
| PUT / DELETE | /api/holdings/:id | Edit/delete owned holding |
| GET / POST | /api/coins/:id/notes | Latest 50 community notes / post |
| DELETE | /api/notes/:id | Delete own note |

## Data behavior

Market summaries cover the returned 50 assets, not the entire cryptocurrency universe. Prices and valuations use USD. Portfolio positions are manual lots with quantity and average cost; valuation is quantity × current quote. Unrealized return excludes fees, taxes, and realized gains. Missing quotes suspend aggregate valuation rather than treating the missing position as zero. Numeric display uses JavaScript doubles, suitable for a research tracker, not an accounting ledger.

Successful market snapshots cache for two minutes; charts and exchange quotes cache for five. Failed refreshes may serve a clearly labeled snapshot up to one hour old. Refresh does not bypass server cache. Data is supplied by CoinGecko; API coverage and access limits can vary. Invalid provider response shapes are rejected.

## Release boundary

The implementation is a local review checkpoint. It is not Cloudflare Worker-compatible because it uses Node HTTP and local SQLite. A Sites deployment would require a deliberate adaptation to Workers and D1 plus a hosted identity decision; it must not be published as if the local SQLite database would persist there. No hosting resources have been created.

Before a public launch: email verification and password recovery provider, abuse/moderation/reporting operations, TLS and origin config, private backups/restore drill, account deletion/export, deployment process, monitoring and shared throttling. Platform-owned authentication can replace local auth when adapting to private Sites. Preserve the current local architecture until the hosting target is chosen.

Password parameters follow an [OWASP scrypt configuration](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html); registration requires 15–128 characters.

## Quality-pass updates

Shareable client routes use History API state plus URL query parameters for asset/account dialogs. `/api/quotes?ids=...` retrieves up to 100 validated asset IDs per request, allowing saved assets and holdings outside the top-50 overview to remain useful. It is public market data and never returns account records. Provider rate-limit cooldowns apply across market endpoints; see [quality-pass notes](QUALITY-PASS.md) for error behavior and validation boundaries.

### Holding order

Portfolio handles support pointer dragging (mouse or touch) and Up/Down arrow keys. `PUT /api/holdings/order` accepts `{ "ids": [...] }` containing every holding ID for the signed-in user, exactly once. The server validates ownership and saves the complete order transactionally. SQLite migration 2 adds `sort_order`, preserving existing positions; newly added holdings appear first. The UI restores the previous order if saving fails.
