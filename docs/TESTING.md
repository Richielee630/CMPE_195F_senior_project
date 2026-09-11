# Regression tests

Run `npm test` with the Node version in `.nvmrc`. The suite runs 21 frontend/client tests in Vitest and eight backend tests with Node's test runner. `npm run build` checks production compilation; `npm audit --audit-level=low` checks dependency advisories. GitHub Actions runs these checks too.

| Area | Automated coverage |
| --- | --- |
| Accounts | Login and registration forms, rejected credentials, logout, session expiry, password storage, throttling |
| Markets | Search, price sorting, unavailable data, retry recovery, cached-data expiry and provider cooldown |
| Asset details | Opening/closing, chart range requests, direct links and Back/Forward navigation |
| Charts | Canvas rendering with flat/invalid data, finite coordinates, resize and observer cleanup |
| Exchanges | Quote display, HTTPS-only trade links, backend range/asset validation |
| Watchlist | Signed-out prompt, saving/removing assets, failed saves, assets outside the market overview, ownership |
| Portfolio | Create/edit/delete, valuation with supplemental quotes, paused totals for stale/missing quotes, signed-out state |
| Holding order | Keyboard and pointer movement, visual lift state, cancellation, failed-save rollback, database migration, restart persistence, foreign/duplicate/incomplete ID rejection |
| Community notes | Posting/deleting, author-only controls, plain-text rendering, backend ownership |
| API client | Network errors, unreadable responses, provider retry metadata |

Frontend tests use mocked HTTP responses; backend tests use real temporary SQLite databases and mocked market providers. These tests do not verify live CoinGecko availability or pixel-level layout. Desktop/mobile visual checks and actual touch interaction remain manual. The holding drag behavior was manually confirmed by the user before this test expansion.
