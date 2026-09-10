# Quality pass — September 9, 2026

## Implemented

- `/`, `/watchlist`, and `/portfolio` survive refresh and browser Back/Forward.
- Asset panels are shareable with `?coin=bitcoin`; sign-in/register dialogs use `?auth=login` and `?auth=register`. Unknown or delisted asset links display an explicit unavailable state.
- Navigation and supplemental quote loading live in separate hooks, keeping their lifecycle logic out of page rendering.
- Saved assets outside the top-50 overview load through `/api/quotes?ids=...`. Missing assets remain visible and removable, rather than disappearing from a watchlist. Requests batch at 100 IDs and validate identifiers server-side.
- Holdings outside the overview receive supplemental quotes. Missing/stale/loading quotes suspend totals rather than producing a misleading zero valuation.
- Failed overview refreshes label the retained snapshot stale. Network/provider failures impose a 30-second cooldown. Provider 429 responses honor Retry-After (seconds or HTTP date), with a bounded 30–3600 second delay shared across endpoints. In-flight deduplication and one-hour maximum stale fallback remain.
- API errors distinguish unreachable servers, timeout, unreadable responses, and provider retry timing. Canceled quote requests do not update unmounted consumers.
- CI uses Node 24 from `.nvmrc`, a clean locked install, UI/backend tests, build, and all-severity npm audit. It runs on master pushes, pull requests, manual dispatch and weekly. Official action commits are pinned; token permissions are read-only. Workflow design follows [GitHub’s Node CI documentation](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs).

## Verification boundaries

Local validation passed: production build, 11 frontend/client tests, 7 backend integration tests, and zero findings in a fresh npm audit.

Automated tests cover the existing flows plus direct-link restoration, simulated popstate navigation, out-of-overview watchlists/holdings, cooldown/recovery, quote validation, and API errors. These are jsdom/API tests, not a substitute for real-browser review. CI execution itself can be observed only after this workflow is pushed.

Browser-control tools were unavailable in this session. The desktop/mobile visual pass below remains pending; it is not claimed as completed.

## Browser review checklist

Use http://127.0.0.1:3000 at desktop and 390px mobile width:

- Create a disposable account, sign out/in, and verify bad-password feedback.
- Save/remove an asset; reload the watchlist and verify persistence.
- Open a coin; copy its URL to a new tab. Check all chart ranges, error states, Escape, focus return, and Back/Forward.
- Search and sort the market; check empty results and horizontal overflow on mobile.
- Add/edit/remove a holding and check totals and allocation; verify an unavailable quote does not appear as zero.
- Post/delete a note; verify another account cannot delete it.
- Stop the API briefly, then refresh. Verify a readable failure and stale label; restart and recover.
- Navigate using only Tab, Shift+Tab, Enter, and Escape. Confirm visible focus and that dialogs contain focus.
- Enable reduced motion and check loading states and card interactions.

## Still separate work

Public account recovery/verification, production monitoring/moderation, decimal accounting beyond the research tracker, and broader component/module refactoring remain outside this pass. No deployment or database reset is part of these changes.
