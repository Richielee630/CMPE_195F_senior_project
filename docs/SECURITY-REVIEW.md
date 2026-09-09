# Dependency security review — 2026-09-08

## Current remediation status

The updated lockfile reports **0 vulnerabilities at every severity** in a fresh full `npm audit`. See [current audit](dependency-audit-current.json). A clean `npm ci --ignore-scripts` install, production build, and six component integration tests passed under Node 24.20.0.

Changes: replaced react-scripts/Webpack 4 with Vite 8; upgraded Ant Design 3 to 4, Axios to 1.20, and Moment to 2.30; refreshed transitive packages; removed unused react-moment/react-number-format and obsolete test dependencies; added Vitest and jsdom. React 16 and Chart.js 2 remain for original API compatibility and have no reported findings in this audit. This does not imply those versions are actively maintained.

The original app layout and routes are retained, JSX files now use `.jsx`, and Ant Design CSS is imported at the entry point. No legacy OpenSSL option is needed.

Zero npm findings does not establish complete application security. The application-review items below, unavailable backend/SQL, and external script risks remain. No backend credentials or authorization protocol were changed. Browser automation was unavailable; tests use jsdom and mock chart canvas and external market requests.

## Historical baseline

Baseline: commit `f448786` (2021-11-01). npm audit queried the registry against the original lockfile using npm 11.11.0. The following inventory records the original versions before remediation; it is not the current dependency tree.

## Summary

| Severity | Affected packages |
| --- | ---: |
| critical | 20 |
| high | 80 |
| moderate | 130 |
| low | 10 |
| total | 240 |

These are npm affected-package counts, including transitive/metavulnerability findings, not 240 independently proven exploitable application flaws. Build tools are declared under dependencies, so npm production classification does not distinguish browser runtime exposure. Node-only Axios SSRF findings, for example, are not automatically exploitable through this browser-only app. Backend dependencies are unavailable and could not be audited.

## Every direct dependency

| Package | Locked version | npm finding |
| --- | --- | --- |
| @ant-design/icons | 4.6.2 | No finding reported (not a safety guarantee) |
| @testing-library/jest-dom | 4.2.4 | moderate |
| @testing-library/react | 9.5.0 | No finding reported (not a safety guarantee) |
| @testing-library/user-event | 7.2.1 | No finding reported (not a safety guarantee) |
| antd | 3.26.20 | high |
| axios | 0.19.2 | high |
| chart.js | 2.9.4 | No finding reported (not a safety guarantee) |
| moment | 2.29.1 | high |
| react | 16.14.0 | No finding reported (not a safety guarantee) |
| react-chartjs-2 | 2.11.2 | No finding reported (not a safety guarantee) |
| react-dom | 16.14.0 | No finding reported (not a safety guarantee) |
| react-moment | 0.9.7 | No finding reported (not a safety guarantee) |
| react-number-format | 4.6.3 | No finding reported (not a safety guarantee) |
| react-router-dom | 5.2.0 | No finding reported (not a safety guarantee) |
| react-scripts | 3.3.0 | high |

## Application review

- Login and signup place passwords in URL query parameters, even though the request method is POST. URLs can be logged; use a request body over HTTPS after recovering the backend contract.
- Login state is a client-controlled username in cookies/localStorage. This is not evidence of server-side authentication. Verify server sessions and authorization on every personal/favorite/comment operation when the backend is recovered.
- Several requests interpolate unencoded user input into query strings. Use URLSearchParams or an encoded body.
- Client Access-Control-Allow-* headers do not configure server CORS. Configure CORS on the backend.
- Backend fetch failures are unhandled in several components. The missing server breaks comments, registration, login, profiles, and favorites.
- Market request failures render default zero values rather than an explicit unavailable state. Do not interpret those as real market prices.
- Exchange names, external trading links, and their array positions need revalidation. The original list includes ftx_us and ftx_spot.
- External CoinGecko and TradingView scripts execute in the page. Their availability/content are not covered by npm audit.

## Remediation order

1. Recover the original backend and SQL schema before restoring accounts; audit those dependencies and authentication separately.
2. Replace deprecated Create React App/react-scripts with a maintained build tool and use a supported Node LTS. React officially deprecated CRA: https://react.dev/blog/2025/02/14/sunsetting-create-react-app .
3. Upgrade Axios and Moment, then address Ant Design and its transitive dependencies with UI regression checks. Do not blindly apply npm audit fix --force; suggested fixes include breaking major upgrades.
4. Correct credential transport, server sessions/authorization, input encoding, and error states.
5. Revalidate exchange endpoints and trading links, then rerun audit and browser flow checks.

## Full affected dependency inventory

Exact advisory URLs, affected ranges, dependency paths, and npm fix suggestions are preserved in [the raw audit](dependency-audit-original.json).

| Package | Severity | Direct |
| --- | --- | --- |
| @babel/core | low | no |
| @babel/helpers | moderate | no |
| @babel/runtime | moderate | no |
| @babel/runtime-corejs3 | moderate | no |
| @babel/traverse | critical | no |
| @hapi/hoek | high | no |
| @jest/core | moderate | no |
| @jest/environment | moderate | no |
| @jest/fake-timers | moderate | no |
| @jest/reporters | moderate | no |
| @jest/test-sequencer | moderate | no |
| @jest/transform | moderate | no |
| @svgr/plugin-svgo | high | no |
| @svgr/webpack | high | no |
| @testing-library/jest-dom | moderate | yes |
| acorn | high | no |
| adjust-sourcemap-loader | high | no |
| ajv | moderate | no |
| ansi-html | high | no |
| ansi-regex | high | no |
| antd | high | yes |
| anymatch | moderate | no |
| async | high | no |
| autoprefixer | moderate | no |
| axios | high | yes |
| babel-jest | moderate | no |
| babel-preset-react-app | moderate | no |
| bn.js | moderate | no |
| body-parser | high | no |
| brace-expansion | high | no |
| braces | high | no |
| browserify-sign | high | no |
| browserslist | high | no |
| chokidar | high | no |
| cipher-base | critical | no |
| color-string | moderate | no |
| compression | low | no |
| cookie | low | no |
| core-js-compat | high | no |
| cross-spawn | high | no |
| css | moderate | no |
| css-blank-pseudo | moderate | no |
| css-declaration-sorter | moderate | no |
| css-has-pseudo | moderate | no |
| css-loader | moderate | no |
| css-prefers-color-scheme | moderate | no |
| css-select | high | no |
| cssnano | moderate | no |
| cssnano-preset-default | moderate | no |
| cssnano-util-raw-cache | moderate | no |
| debug | low | no |
| decode-uri-component | high | no |
| dns-packet | high | no |
| dot-prop | high | no |
| draft-js | high | no |
| elliptic | critical | no |
| es5-ext | low | no |
| eslint | high | no |
| eventsource | critical | no |
| expect | moderate | no |
| express | high | no |
| external-editor | low | no |
| fast-glob | moderate | no |
| fbjs | high | no |
| file-entry-cache | high | no |
| flat-cache | high | no |
| flatted | high | no |
| follow-redirects | high | no |
| fork-ts-checker-webpack-plugin | high | no |
| form-data | critical | no |
| fsevents | high | no |
| glob-parent | high | no |
| globby | moderate | no |
| hosted-git-info | moderate | no |
| html-minifier | high | no |
| html-webpack-plugin | high | no |
| http-proxy | high | no |
| http-proxy-middleware | high | no |
| icss-utils | moderate | no |
| immutable | high | no |
| ini | high | no |
| inquirer | low | no |
| ip | high | no |
| is-svg | high | no |
| isomorphic-fetch | high | no |
| jest | moderate | no |
| jest-cli | moderate | no |
| jest-config | moderate | no |
| jest-each | moderate | no |
| jest-environment-jsdom | moderate | no |
| jest-environment-jsdom-fourteen | moderate | no |
| jest-environment-node | moderate | no |
| jest-haste-map | moderate | no |
| jest-jasmine2 | moderate | no |
| jest-message-util | moderate | no |
| jest-resolve-dependencies | moderate | no |
| jest-runner | moderate | no |
| jest-runtime | moderate | no |
| jest-snapshot | moderate | no |
| jest-util | moderate | no |
| jest-watch-typeahead | moderate | no |
| jest-watcher | moderate | no |
| js-yaml | high | no |
| jsdom | moderate | no |
| json-schema | critical | no |
| json5 | high | no |
| jsprim | critical | no |
| loader-fs-cache | critical | no |
| loader-utils | critical | no |
| lodash | high | no |
| lodash.template | high | no |
| merge-deep | critical | no |
| micromatch | high | no |
| minimatch | high | no |
| minimist | critical | no |
| mkdirp | critical | no |
| moment | high | yes |
| node-fetch | high | no |
| node-forge | high | no |
| node-notifier | moderate | no |
| node-pre-gyp | high | no |
| nth-check | high | no |
| object-path | high | no |
| on-headers | low | no |
| optimize-css-assets-webpack-plugin | moderate | no |
| path-parse | moderate | no |
| path-to-regexp | high | no |
| pbkdf2 | critical | no |
| postcss | high | no |
| postcss-attribute-case-insensitive | moderate | no |
| postcss-browser-comments | moderate | no |
| postcss-calc | moderate | no |
| postcss-color-functional-notation | moderate | no |
| postcss-color-gray | moderate | no |
| postcss-color-hex-alpha | moderate | no |
| postcss-color-mod-function | moderate | no |
| postcss-color-rebeccapurple | moderate | no |
| postcss-colormin | moderate | no |
| postcss-convert-values | moderate | no |
| postcss-custom-media | moderate | no |
| postcss-custom-properties | moderate | no |
| postcss-custom-selectors | moderate | no |
| postcss-dir-pseudo-class | moderate | no |
| postcss-discard-comments | moderate | no |
| postcss-discard-duplicates | moderate | no |
| postcss-discard-empty | moderate | no |
| postcss-discard-overridden | moderate | no |
| postcss-double-position-gradients | moderate | no |
| postcss-env-function | moderate | no |
| postcss-flexbugs-fixes | moderate | no |
| postcss-focus-visible | moderate | no |
| postcss-focus-within | moderate | no |
| postcss-font-variant | moderate | no |
| postcss-gap-properties | moderate | no |
| postcss-image-set-function | moderate | no |
| postcss-initial | moderate | no |
| postcss-lab-function | moderate | no |
| postcss-loader | moderate | no |
| postcss-logical | moderate | no |
| postcss-media-minmax | moderate | no |
| postcss-merge-longhand | moderate | no |
| postcss-merge-rules | moderate | no |
| postcss-minify-font-values | moderate | no |
| postcss-minify-gradients | moderate | no |
| postcss-minify-params | moderate | no |
| postcss-minify-selectors | moderate | no |
| postcss-modules-extract-imports | moderate | no |
| postcss-modules-local-by-default | moderate | no |
| postcss-modules-scope | moderate | no |
| postcss-modules-values | moderate | no |
| postcss-nesting | moderate | no |
| postcss-normalize | moderate | no |
| postcss-normalize-charset | moderate | no |
| postcss-normalize-display-values | moderate | no |
| postcss-normalize-positions | moderate | no |
| postcss-normalize-repeat-style | moderate | no |
| postcss-normalize-string | moderate | no |
| postcss-normalize-timing-functions | moderate | no |
| postcss-normalize-unicode | moderate | no |
| postcss-normalize-url | moderate | no |
| postcss-normalize-whitespace | moderate | no |
| postcss-ordered-values | moderate | no |
| postcss-overflow-shorthand | moderate | no |
| postcss-page-break | moderate | no |
| postcss-place | moderate | no |
| postcss-preset-env | moderate | no |
| postcss-pseudo-class-any-link | moderate | no |
| postcss-reduce-initial | moderate | no |
| postcss-reduce-transforms | moderate | no |
| postcss-replace-overflow-wrap | moderate | no |
| postcss-safe-parser | moderate | no |
| postcss-selector-matches | moderate | no |
| postcss-selector-not | moderate | no |
| postcss-svgo | high | no |
| postcss-unique-selectors | moderate | no |
| qs | high | no |
| rc-editor-core | high | no |
| rc-editor-mention | high | no |
| react-dev-utils | critical | no |
| react-scripts | high | yes |
| readdirp | moderate | no |
| recursive-readdir | high | no |
| renderkid | high | no |
| request | critical | no |
| request-promise-native | moderate | no |
| resolve-url-loader | high | no |
| sane | moderate | no |
| selfsigned | high | no |
| semver | high | no |
| send | low | no |
| serialize-javascript | high | no |
| serve-static | low | no |
| sha.js | critical | no |
| shell-quote | critical | no |
| sockjs | moderate | no |
| source-map-resolve | moderate | no |
| ssri | high | no |
| stylehacks | moderate | no |
| svgo | high | no |
| tar | critical | no |
| terser | high | no |
| terser-webpack-plugin | high | no |
| tmp | high | no |
| tmpl | high | no |
| tough-cookie | moderate | no |
| url-parse | critical | no |
| uuid | moderate | no |
| watchpack | high | no |
| webpack | high | no |
| webpack-dev-middleware | high | no |
| webpack-dev-server | high | no |
| webpack-log | moderate | no |
| websocket-driver | critical | no |
| websocket-extensions | high | no |
| word-wrap | moderate | no |
| ws | high | no |
| y18n | high | no |
| yaml | moderate | no |
| yargs | moderate | no |
| yargs-parser | moderate | no |
