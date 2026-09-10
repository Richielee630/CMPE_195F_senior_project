# Crypto Solution

A college senior project, rebuilt as a modern crypto research workspace.

- Live top-50 market overview with search, sorting, and seven-day trends
- Asset details with 1-day, 1-week, 1-month, and 1-year charts
- Exchange quote comparisons from CoinGecko
- Registration and sign-in with durable server-side sessions
- Personal watchlists and manual portfolio holdings with editing, allocation, and unrealized return
- Coin-specific community notes with author-owned deletion
- Responsive Apple-inspired visual design

## Run locally

Use Node **24 LTS, at least 24.15**. No Python, uv, MySQL, or external database server is needed.

```sh
nvm install
nvm use
npm ci --ignore-scripts
npm start
```

Without nvm, use npm's cached Node runtime:

```sh
npm exec --yes --package=node@24 -- npm ci --ignore-scripts
npm exec --yes --package=node@24 -- npm start
```

Open **http://127.0.0.1:3000**. `npm start` runs Vite and the new Node API together. Both bind to loopback. Use this exact origin for cookie-based sign-in. Ctrl+C stops both processes.

Copy `.env.example` to `.env` if you need a CoinGecko Demo key or a different database file. The API works with keyless public access when available; service errors and cached data are explicitly labeled. Never prefix API secrets with `VITE_`.

The backend creates `data/crypto-solution.sqlite` on first start. Accounts and private records persist across restarts. `.env` and database files are ignored by Git. The original backend was missing; this is a newly implemented backend, not a recovered database.

## Checks

```sh
npm test
npm run build
npm audit
```

`npm test` runs UI tests in jsdom and backend tests against isolated SQLite databases. `npm run build` produces `dist/`. For a local production preview, run `npm run dev:api` and `npm run preview` in separate terminals after stopping the normal dev server.

## Documentation

- [Staged renewal plan and status](docs/RENEWAL-PLAN.md)
- [Architecture, endpoints, and deployment boundaries](docs/ARCHITECTURE.md)
- [Local run and troubleshooting](docs/LOCAL-RUN.md)
- [Security review](docs/SECURITY-REVIEW.md)
- [Design direction and social asset](docs/DESIGN.md)

This is a local review version. A public release still needs verified email/password recovery, moderation operations, durable deployment storage/backups, TLS configuration, and production monitoring. No trading, custody, exchange credentials, or investment recommendations are implemented.

The original 2021 app remains in Git history; `dd7d8e1` is the last restored legacy interface before the renewal.

## Quality checks and navigation

Watchlist and portfolio have direct URLs; asset details can be shared using `?coin=bitcoin`. CI runs tests, builds, and a full npm audit on pushes/PRs and weekly. See [the quality-pass report](docs/QUALITY-PASS.md), including the pending real-browser/mobile checklist.
