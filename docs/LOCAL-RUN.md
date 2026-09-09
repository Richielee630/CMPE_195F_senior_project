# Run Crypto Solution locally

Use Node 24 LTS (at least 24.15). `.nvmrc` selects Node 24 if you use nvm.

```sh
nvm install
nvm use
npm ci --ignore-scripts
npm start
```

If nvm is not installed, install Node 24 LTS or run commands through npm's cached Node package without changing your system Node:

```sh
npm exec --yes --package=node@24 -- npm ci --ignore-scripts
npm exec --yes --package=node@24 -- npm start
```

Open http://127.0.0.1:3000 . The server binds only to loopback and fails if the port is occupied. Stop it with Ctrl+C. The former NODE_OPTIONS=--openssl-legacy-provider workaround is no longer needed.

```sh
npm test
npm run build
npm run preview
npm audit
```

The production output is `dist/`. Stop the dev server before previewing on the same port. Tests cover dashboard tab switching, login/signup rendering, successful comments loading, HTTP errors, and an unreachable comments backend. External market requests and chart canvas are mocked in tests; browser visual testing was unavailable.

The backend expected at http://127.0.0.1:8888 and the original README's btb.sql schema are absent from this repository and the searched Git history. Login, signup, profiles, favorites, and comments require that backend. Comments display an unavailable state and disable sending when the backend fails. Other backend flows still need restoration and error handling. Live market data and widgets depend on external service availability, rate limits, CORS, and legacy exchange IDs.

See SECURITY-REVIEW.md for current audit results and remaining application-level security issues. A zero dependency audit does not resolve the missing backend or the original credential/session design.
