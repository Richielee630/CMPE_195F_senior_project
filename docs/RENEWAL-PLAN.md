# Crypto Solution renewal

## Product direction

An uncluttered place to understand crypto markets, compare trading venues, and keep a personal research workspace. Preserve the name and the Bitcoin/Ethereum/Litecoin roots while expanding to a useful market overview.

Apple-inspired visual direction: warm off-white canvas, white surfaces, near-black text, system typography, generous whitespace, rounded cards, fine separators, small blue accents, restrained motion. A strong market overview leads the page rather than a generic sidebar. Responsive navigation, keyboard operation, reduced-motion support, and explicit loading/error/empty states are part of the design.

## Stage 1 — Design and market foundation

- Replace the legacy UI with a responsive market workspace.
- Search and sort assets, inspect a coin, change chart ranges, and compare exchange prices.
- Add a real Node backend and one same-origin /api boundary.
- Centralize CoinGecko requests with timeouts, validation, caching, and request deduplication. Label stale data; never silently substitute invented prices.
- Remove third-party embedded scripts and obsolete trading links.
- Finish when market API tests, UI interaction tests, and a production build pass.

## Stage 2 — Identity and watchlists

- Restore registration, login, logout, and current-user flows with server-owned identity.
- Durable relational storage with schema migrations.
- Password hashing, opaque expiring HttpOnly sessions, origin checks, request limits, and authorization on every private endpoint.
- Save/remove watchlist items, persist across server restarts, and display useful signed-out/empty states.
- Finish when tests cover failed login, logout, expired sessions, private-route rejection, and isolation between two accounts.

## Stage 3 — Personal workspace

- Pending product clarification: manual portfolio holdings with quantity and cost basis, current value, allocation, and unrealized return. No exchange credentials or trading execution.
- Validate amounts, enforce record ownership, handle unavailable quotes explicitly, and keep monetary calculations/display consistent.
- Finish when create/update/delete, persistence, validation, and ownership tests pass.

## Stage 4 — Community research

- Coin-specific community notes with author/time attribution and deletion by the author.
- Plain-text content, size limits, rate limits, and visible request feedback.
- No invented users, posts, or market commentary.
- Finish when posting, listing, deletion, and cross-account authorization tests pass.

## Stage 5 — Integration and release readiness

- Refresh README, configuration examples, database/setup instructions, architecture notes, and security review.
- Verify complete install, tests, production build, full dependency audit, and local HTTP routes.
- Keep secrets and databases out of Git. Preserve history of the original project.
- Deployment scope pending user clarification. Public release requires a hosting-specific identity, database, backup, TLS, and operational review; a local checkpoint is not a production-security claim.

## Decisions and boundaries

- Keep npm and Vite; Python/uv is unnecessary.
- Prefer a small dependency surface and standard browser/Node APIs.
- Original project and previous dependency fix are preserved at commit dd7d8e1.
- Do not fabricate restored backend behavior or claim the old database was recovered: the backend is a new implementation.
- No wallet custody, order execution, investment recommendations, or paid data subscriptions are part of this rebuild.
- Password recovery/email verification and public moderation tooling require provider/operational decisions before public launch.

## Progress

- Stage 1 implemented: new responsive UI, React 19, server market adapter, search/sort, asset charts and exchange comparison.
- Stage 2 implemented: local SQLite accounts, expiring sessions, server authorization, persistent watchlists.
- Stage 3 implemented with the stated manual-portfolio assumption: create/edit/remove holdings, allocation, valuation and unrealized return.
- Stage 4 implemented: coin notes, author-only deletion, plain-text rendering and rate limits.
- Stage 5 local checks passed: clean install, 6 frontend tests, 4 backend integration tests, production build, zero npm audit findings, and HTTP 200 for live markets/chart/exchange endpoints. Hosted/public release remains a separate stage pending target and operational decisions.
- Social card generated and inspected; source prompt recorded in DESIGN.md.
