# Local run

Use Node 24.15+ LTS; `.nvmrc` selects Node 24. This app uses React 19, Vite 8, and a Node HTTP API with built-in SQLite. Python/uv is unnecessary.

```sh
npm ci --ignore-scripts
npm start
```

Open http://127.0.0.1:3000. The frontend proxies `/api` to the backend at 127.0.0.1:8888. The launcher runs both and stops the sibling process if either exits. The old OpenSSL compatibility workaround is not needed.

If system Node is unsupported:

```sh
npm exec --yes --package=node@24 -- npm ci --ignore-scripts
npm exec --yes --package=node@24 -- npm start
```

Configuration: copy `.env.example` to `.env`. The launcher reads it for the backend and Vite reads it for metadata. `COINGECKO_API_KEY` is optional and server-only; `APP_ORIGIN` must match the browser origin exactly. `DATABASE_PATH` defaults to `./data/crypto-solution.sqlite`. `PUBLIC_SITE_URL` sets the absolute share-card URL.

For a production build preview, stop `npm start`, run `npm run build`, then run `npm run dev:api` and `npm run preview` in separate terminals. This is still a local preview, not a production deployment.

Market data errors usually indicate upstream rate limiting or service availability. Retry after a short wait or configure a CoinGecko Demo key. A previously successful response may be shown for up to one hour with a cached-data label; no invented fallback prices are provided.

Tests use isolated databases and mocked provider responses, not your real account data. Automated visual browser testing has not been performed. Local HTTP checks verify the health endpoint and live market requests.

To back up local data, stop both processes before copying the database and any SQLite sidecar files. Keep backups private; they contain email addresses, password hashes, and personal records. Do not delete the database unless you intend to remove local accounts and saved data.
