import React, { useEffect, useState } from "react";
import { request } from "./api";
import Chart from "./Chart";
import "./style.css";

const money = (n, compact = false) =>
  Number.isFinite(n)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: compact ? "compact" : "standard",
        maximumFractionDigits: n < 1 ? 5 : 2,
      }).format(n)
    : "—";
const percent = (n) =>
  Number.isFinite(n) ? `${n >= 0 ? "+" : ""}${n.toFixed(2)}%` : "—";
const colors = {
  btc: "#f7931a",
  eth: "#6579c5",
  sol: "#252530",
  ltc: "#4878be",
  usdt: "#26a17b",
  usdc: "#2775ca",
};
function CoinIcon({ coin }) {
  return (
    <span
      className="coin-icon"
      style={{ background: colors[coin.symbol] || "#596779" }}
    >
      {coin.symbol === "btc"
        ? "₿"
        : coin.symbol === "eth"
          ? "Ξ"
          : coin.symbol?.slice(0, 1).toUpperCase()}
    </span>
  );
}
function Change({ value }) {
  return (
    <span className={value < 0 ? "negative" : "positive"}>
      {percent(value)}
    </span>
  );
}
function Notice({ children, onRetry }) {
  return (
    <div className="notice" role="status">
      {children}
      {onRetry && (
        <button className="text-button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("markets");
  const [market, setMarket] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState("rank"),
    [selected, setSelected] = useState(null);
  const [user, setUser] = useState(null),
    [auth, setAuth] = useState(null),
    [watchlist, setWatchlist] = useState([]);
  const [feedback, setFeedback] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      setMarket(await request("/markets"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function refreshUser() {
    try {
      const result = await request("/me");
      setUser(result.user);
      if (result.user) setWatchlist((await request("/watchlist")).data);
      else setWatchlist([]);
    } catch {
      setUser(null);
    }
  }
  useEffect(() => {
    load();
    refreshUser();
  }, []);
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(""), 4500);
    return () => clearTimeout(timer);
  }, [feedback]);
  const coins = Array.isArray(market?.data) ? market.data : [];
  async function toggleWatch(coin) {
    if (!user) {
      setAuth("login");
      return;
    }
    const saved = watchlist.includes(coin.id);
    try {
      await request(`/watchlist/${coin.id}`, {
        method: saved ? "DELETE" : "PUT",
      });
      setWatchlist((old) =>
        saved ? old.filter((id) => id !== coin.id) : [...old, coin.id],
      );
      setFeedback(
        saved
          ? `${coin.name} removed from watchlist`
          : `${coin.name} added to watchlist`,
      );
    } catch (e) {
      setFeedback(e.message);
    }
  }
  const filtered = coins
    .filter(
      (c) =>
        (view !== "watchlist" || watchlist.includes(c.id)) &&
        `${c.name} ${c.symbol}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "change"
        ? (b.price_change_percentage_24h || 0) -
          (a.price_change_percentage_24h || 0)
        : sort === "price"
          ? b.current_price - a.current_price
          : a.market_cap_rank - b.market_cap_rank,
    );
  const totalCap = coins.reduce((sum, c) => sum + (c.market_cap || 0), 0),
    volume = coins.reduce((sum, c) => sum + (c.total_volume || 0), 0);
  const rising = coins.filter((c) => c.price_change_percentage_24h > 0).length;
  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="nav-inner">
          <button
            className="brand"
            onClick={() => setView("markets")}
            aria-label="Crypto Solution home"
          >
            <span className="brand-mark">
              c<span>·</span>
            </span>
            crypto<span className="brand-light">solution</span>
          </button>
          <nav aria-label="Main navigation">
            {[
              ["markets", "Discover"],
              ["watchlist", "Watchlist"],
              ["portfolio", "Portfolio"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-current={view === id ? "page" : undefined}
                onClick={() => {
                  setView(id);
                  setQuery("");
                }}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="account-nav">
            {user ? (
              <>
                <span className="user-name">{user.name}</span>
                <button
                  className="pill secondary"
                  onClick={async () => {
                    try {
                      await request("/auth/logout", { method: "POST" });
                      setUser(null);
                      setWatchlist([]);
                      setFeedback("Signed out");
                    } catch (e) {
                      setFeedback(e.message);
                    }
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button className="pill dark" onClick={() => setAuth("login")}>
                Sign in <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>
        </div>
      </header>
      <main id="main" className="main">
        <section className="page-heading">
          <div>
            <p className="eyebrow">YOUR PERSPECTIVE. A LITTLE CLEARER.</p>
            <h1>
              {view === "markets" ? (
                <>
                  A world of crypto.
                  <br />
                  <span>Made clear.</span>
                </>
              ) : view === "watchlist" ? (
                <>
                  Your market.
                  <br />
                  <span>At a glance.</span>
                </>
              ) : (
                <>
                  The bigger picture.
                  <br />
                  <span>Your portfolio.</span>
                </>
              )}
            </h1>
            <p className="intro">
              {view === "markets"
                ? "Explore the market. Follow what matters. Find your own perspective."
                : view === "watchlist"
                  ? "A thoughtful collection of the assets you’re keeping an eye on."
                  : "Keep your holdings in one place. See how they move with the market."}
            </p>
          </div>
          <div className="edition">
            <span className="edition-orb" />
            <span>
              CRYPTO SOLUTION
              <br />
              <strong>A fresh perspective, since 2021.</strong>
            </span>
          </div>
        </section>
        {error && <Notice onRetry={load}>{error}</Notice>}
        {market && (
          <div className="data-status">
            <span
              className={market.stale ? "status-dot stale" : "status-dot"}
            />
            {market.stale ? "Cached market snapshot" : "Latest market snapshot"}
            <span>
              Updated{" "}
              {new Date(market.updatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · CoinGecko
            </span>
            <button className="text-button" disabled={loading} onClick={load}>
              {loading ? "Refreshing…" : "Refresh ↻"}
            </button>
          </div>
        )}
        {view === "markets" && (
          <>
            <section className="stats" aria-label="Market summary">
              <div>
                <p>Tracked market cap</p>
                <strong>{coins.length ? money(totalCap, true) : "—"}</strong>
                <small>Across the top {coins.length || "50"} assets</small>
              </div>
              <div>
                <p>Trading volume</p>
                <strong>{coins.length ? money(volume, true) : "—"}</strong>
                <small>Past 24 hours · tracked assets</small>
              </div>
              <div>
                <p>Market breadth</p>
                <strong>
                  {coins.length ? `${rising} / ${coins.length}` : "—"}
                </strong>
                <small>Assets gaining in the past 24 hours</small>
              </div>
              <div className="summary-note">
                <span className="mini-symbol">↗</span>
                <h3>
                  Less noise.
                  <br />
                  More perspective.
                </h3>
                <small>Market data, thoughtfully presented.</small>
              </div>
            </section>
            <div className="section-heading">
              <h2>In focus</h2>
              <span>Familiar names. A closer look.</span>
            </div>
            <section className="featured">
              {loading && !coins.length
                ? [0, 1, 2].map((i) => (
                    <div key={i} className="focus-card skeleton" />
                  ))
                : ["bitcoin", "ethereum", "solana"]
                    .map((id) => coins.find((c) => c.id === id))
                    .filter(Boolean)
                    .map((coin) => (
                      <button
                        className="focus-card"
                        key={coin.id}
                        onClick={() => setSelected(coin)}
                      >
                        <div className="coin-heading">
                          <CoinIcon coin={coin} />
                          <div>
                            <h3>{coin.name}</h3>
                            <span>{coin.symbol.toUpperCase()}</span>
                          </div>
                          <span className="card-arrow">↗</span>
                        </div>
                        <div className="focus-price">
                          {money(coin.current_price)}
                          <Change value={coin.price_change_percentage_24h} />
                        </div>
                        <Chart
                          points={coin.sparkline_in_7d?.price}
                          compact
                          negative={
                            coin.price_change_percentage_7d_in_currency < 0
                          }
                          label={`${coin.name} seven-day price trend`}
                        />
                        <span className="card-caption">7-day price trend</span>
                      </button>
                    ))}
            </section>
          </>
        )}
        {view === "portfolio" ? (
          <Portfolio
            user={user}
            coins={coins}
            onSignIn={() => setAuth("login")}
            notify={setFeedback}
          />
        ) : (
          <section className="market-section">
            <div className="section-heading market-toolbar">
              <div>
                <h2>
                  {view === "watchlist"
                    ? "Your watchlist"
                    : "The market, in view"}
                </h2>
                <p>
                  {view === "watchlist"
                    ? "Saved to your account. Always within reach."
                    : "Explore the top 50 assets by market capitalization."}
                </p>
              </div>
              <div className="table-controls">
                <label className="search">
                  <span aria-hidden="true">⌕</span>
                  <input
                    aria-label="Search assets"
                    placeholder="Search assets"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <kbd>⌕</kbd>
                </label>
                <select
                  aria-label="Sort assets"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="rank">Market cap</option>
                  <option value="change">24h gain</option>
                  <option value="price">Price</option>
                </select>
              </div>
            </div>
            {view === "watchlist" && !user ? (
              <Empty
                title="Make room for your favorites."
                text="Sign in to build a watchlist that stays with you."
                action="Sign in"
                onAction={() => setAuth("login")}
              />
            ) : !loading && !filtered.length ? (
              <Empty
                title={
                  query
                    ? "No matching assets."
                    : "A little space for what matters."
                }
                text={
                  query
                    ? "Try another name or symbol."
                    : "Tap the star beside any market to start your collection."
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="market-table">
                  <thead>
                    <tr>
                      <th aria-label="Watchlist" />
                      <th>#</th>
                      <th>Asset</th>
                      <th>Price</th>
                      <th>24h change</th>
                      <th className="hide-small">Market cap</th>
                      <th className="hide-medium">Past 7 days</th>
                      <th aria-label="Details" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((coin) => (
                      <tr key={coin.id}>
                        <td>
                          <button
                            className={`star ${watchlist.includes(coin.id) ? "saved" : ""}`}
                            aria-label={`${watchlist.includes(coin.id) ? "Remove" : "Save"} ${coin.name}`}
                            aria-pressed={watchlist.includes(coin.id)}
                            onClick={() => toggleWatch(coin)}
                          >
                            {watchlist.includes(coin.id) ? "★" : "☆"}
                          </button>
                        </td>
                        <td className="rank">{coin.market_cap_rank}</td>
                        <td>
                          <button
                            className="asset-cell"
                            onClick={() => setSelected(coin)}
                          >
                            <CoinIcon coin={coin} />
                            <span>
                              <strong>{coin.name}</strong>
                              <small>{coin.symbol.toUpperCase()}</small>
                            </span>
                          </button>
                        </td>
                        <td className="numeric">{money(coin.current_price)}</td>
                        <td className="numeric">
                          <Change value={coin.price_change_percentage_24h} />
                        </td>
                        <td className="numeric hide-small">
                          {money(coin.market_cap, true)}
                        </td>
                        <td className="hide-medium">
                          <Chart
                            points={coin.sparkline_in_7d?.price}
                            compact
                            negative={
                              coin.price_change_percentage_7d_in_currency < 0
                            }
                            label={`${coin.name} seven-day price trend`}
                          />
                        </td>
                        <td>
                          <button
                            className="detail-button"
                            aria-label={`View ${coin.name}`}
                            onClick={() => setSelected(coin)}
                          >
                            ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {loading && !coins.length && (
                  <p className="loading-text">
                    Gathering a fresh market perspective…
                  </p>
                )}
              </div>
            )}
          </section>
        )}
        <section className="closing-note">
          <div className="brand-mark">
            c<span>·</span>
          </div>
          <p>
            Curiosity started this.
            <br />
            <strong>Clarity takes it forward.</strong>
          </p>
          <span>
            A senior project, reimagined.
            <br />
            San José · Since 2021
          </span>
        </section>
      </main>
      <footer>
        <span>© {new Date().getFullYear()} Crypto Solution</span>
        <span>
          Market data by{" "}
          <a
            href="https://www.coingecko.com/en/api"
            target="_blank"
            rel="noreferrer"
          >
            CoinGecko ↗
          </a>
        </span>
        <span>For research. Not financial advice.</span>
      </footer>
      {feedback && (
        <div className="toast" role="status">
          {feedback}
        </div>
      )}
      {auth && (
        <Auth
          mode={auth}
          setMode={setAuth}
          onClose={() => setAuth(null)}
          onSuccess={async () => {
            await refreshUser();
            setAuth(null);
            setFeedback("Welcome. Make yourself at home.");
          }}
        />
      )}
      {selected && (
        <CoinDetail
          coin={selected}
          onClose={() => setSelected(null)}
          user={user}
          onSignIn={() => setAuth("login")}
          saved={watchlist.includes(selected.id)}
          toggleWatch={() => toggleWatch(selected)}
          notify={setFeedback}
        />
      )}
    </div>
  );
}

function Empty({ title, text, action, onAction }) {
  return (
    <div className="empty">
      <span className="empty-symbol">✧</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="pill blue" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  const ref = React.useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
    >
      <button className="close-button" onClick={onClose} aria-label="Close">
        ×
      </button>
      {children}
    </dialog>
  );
}
function Auth({ mode, setMode, onClose, onSuccess }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title={mode === "login" ? "Sign in" : "Create account"}
      onClose={onClose}
    >
      <div className="auth-heading">
        <span className="brand-mark">
          c<span>·</span>
        </span>
        <p className="eyebrow">YOUR PERSONAL PERSPECTIVE</p>
        <h2>{mode === "login" ? "Welcome back." : "Make it yours."}</h2>
        <p>Your watchlist, portfolio, and ideas. Together.</p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const body = Object.fromEntries(new FormData(e.currentTarget));
          try {
            await request(`/auth/${mode === "login" ? "login" : "register"}`, {
              method: "POST",
              body: JSON.stringify(body),
            });
            await onSuccess();
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {mode === "register" && (
          <label>
            Your name
            <input
              name="name"
              required
              minLength={2}
              maxLength={60}
              autoComplete="name"
            />
          </label>
        )}
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={mode === "register" ? 15 : 1}
            maxLength={128}
          />
        </label>
        {mode === "register" && <small>Use at least 15 characters.</small>}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="pill blue full" disabled={busy}>
          {busy
            ? "One moment…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
      <button
        className="auth-switch text-button"
        onClick={() => {
          setError("");
          setMode(mode === "login" ? "register" : "login");
        }}
      >
        {mode === "login"
          ? "New here? Create an account"
          : "Already have an account? Sign in"}
      </button>
    </Modal>
  );
}
function CoinDetail({
  coin,
  onClose,
  user,
  onSignIn,
  saved,
  toggleWatch,
  notify,
}) {
  const [days, setDays] = useState("7"),
    [chart, setChart] = useState(null),
    [error, setError] = useState(""),
    [exchanges, setExchanges] = useState(null),
    [exchangeError, setExchangeError] = useState("");
  useEffect(() => {
    let active = true;
    setChart(null);
    setError("");
    request(`/coins/${coin.id}/chart?days=${days}`)
      .then((x) => {
        if (active) setChart(x);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [coin.id, days]);
  useEffect(() => {
    let active = true;
    request(`/coins/${coin.id}/exchanges`)
      .then((x) => {
        if (active) setExchanges(x);
      })
      .catch((e) => {
        if (active) setExchangeError(e.message);
      });
    return () => {
      active = false;
    };
  }, [coin.id]);
  const tickers = (exchanges?.data?.tickers || [])
    .filter((t) => !t.is_anomaly && !t.is_stale && t.converted_last?.usd > 0)
    .slice(0, 5);
  return (
    <Modal title={`${coin.name} details`} onClose={onClose} wide>
      <div className="detail-heading">
        <CoinIcon coin={coin} />
        <div>
          <p className="eyebrow">
            {coin.symbol.toUpperCase()} · MARKET #{coin.market_cap_rank}
          </p>
          <h2>{coin.name}</h2>
        </div>
        <button className="pill secondary" onClick={toggleWatch}>
          {saved ? "★ Watching" : "☆ Watch"}
        </button>
      </div>
      <div className="detail-price">
        {money(coin.current_price)}{" "}
        <Change value={coin.price_change_percentage_24h} />
      </div>
      <div className="chart-toolbar">
        <span>Price in USD</span>
        <div className="segmented" aria-label="Chart range">
          {[
            ["1", "1D"],
            ["7", "1W"],
            ["30", "1M"],
            ["365", "1Y"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={days === value}
              onClick={() => setDays(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <Notice>{error}</Notice>
      ) : !chart ? (
        <div className="chart-placeholder">Loading price history…</div>
      ) : (
        <>
          <Chart
            points={chart.data.prices}
            label={`${coin.name} price history over ${days} days`}
          />
          <div className="chart-labels">
            <span>
              {new Date(chart.data.prices?.[0]?.[0]).toLocaleDateString()}
            </span>
            <span>
              {chart.stale ? "Cached data · " : ""}
              {new Date(chart.data.prices?.at(-1)?.[0]).toLocaleDateString()}
            </span>
          </div>
        </>
      )}
      <div className="coin-metrics">
        <div>
          <small>Market cap</small>
          <strong>{money(coin.market_cap, true)}</strong>
        </div>
        <div>
          <small>24h volume</small>
          <strong>{money(coin.total_volume, true)}</strong>
        </div>
        <div>
          <small>24h high</small>
          <strong>{money(coin.high_24h)}</strong>
        </div>
        <div>
          <small>24h low</small>
          <strong>{money(coin.low_24h)}</strong>
        </div>
      </div>
      <div className="section-heading">
        <h3>Across the exchanges</h3>
        <span>USD equivalent · top reported pairs</span>
      </div>
      {exchangeError ? (
        <Notice>{exchangeError}</Notice>
      ) : !exchanges ? (
        <p className="muted">Finding exchange prices…</p>
      ) : (
        <>
          {exchanges.stale && <Notice>Showing cached exchange quotes.</Notice>}
          <div className="exchange-list">
            {tickers.length ? (
              tickers.map((t, i) => (
                <div key={i}>
                  <span>
                    <strong>{t.market.name}</strong>
                    <small>
                      {t.base}/{t.target}
                    </small>
                  </span>
                  <strong>{money(t.converted_last.usd)}</strong>
                  {/^https:\/\//.test(t.trade_url || "") && (
                    <a
                      href={t.trade_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View pair on ${t.market.name}`}
                    >
                      ↗
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="muted">No current exchange quotes available.</p>
            )}
          </div>
        </>
      )}
      <Notes coin={coin} user={user} onSignIn={onSignIn} notify={notify} />
    </Modal>
  );
}
function Notes({ coin, user, onSignIn, notify }) {
  const [notes, setNotes] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      setNotes((await request(`/coins/${coin.id}/notes`)).data);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [coin.id]);
  return (
    <section className="notes">
      <div className="section-heading">
        <h3>Shared perspectives</h3>
        <span>Community notes</span>
      </div>
      {error && <Notice>{error}</Notice>}
      {!notes.length && !error && (
        <p className="muted">No notes yet. Start a thoughtful conversation.</p>
      )}
      {notes.map((note) => (
        <article className="note" key={note.id}>
          <div>
            <strong>{note.name}</strong>
            <time>{new Date(note.created_at).toLocaleDateString()}</time>
            {user?.id === note.user_id && (
              <button
                className="text-button"
                onClick={async () => {
                  try {
                    await request(`/notes/${note.id}`, { method: "DELETE" });
                    await load();
                  } catch (e) {
                    notify(e.message);
                  }
                }}
              >
                Delete
              </button>
            )}
          </div>
          <p>{note.body}</p>
        </article>
      ))}
      {user ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            setBusy(true);
            try {
              await request(`/coins/${coin.id}/notes`, {
                method: "POST",
                body: JSON.stringify({ body: new FormData(form).get("body") }),
              });
              form.reset();
              await load();
            } catch (err) {
              notify(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="new-note">Add your perspective</label>
          <textarea
            id="new-note"
            name="body"
            required
            minLength={1}
            maxLength={1000}
            placeholder="What are you watching?"
          />
          <button className="pill blue" disabled={busy}>
            {busy ? "Posting…" : "Post note"}
          </button>
        </form>
      ) : (
        <button className="text-button" onClick={onSignIn}>
          Sign in to share a perspective ↗
        </button>
      )}
    </section>
  );
}
function Portfolio({ user, coins, onSignIn, notify }) {
  const [holdings, setHoldings] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(null);
  async function load() {
    try {
      setHoldings((await request("/holdings")).data);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    if (user) load();
    else setHoldings([]);
  }, [user]);
  if (!user)
    return (
      <Empty
        title="Your own point of view."
        text="Sign in to track your holdings and see your portfolio in perspective."
        action="Sign in"
        onAction={onSignIn}
      />
    );
  const rows = holdings.map((h) => ({
    ...h,
    coin: coins.find((c) => c.id === h.coin_id),
  }));
  const unpriced = rows.some((h) => !Number.isFinite(h.coin?.current_price));
  const value = rows.reduce(
      (s, h) => s + h.quantity * (h.coin?.current_price || 0),
      0,
    ),
    cost = rows.reduce((s, h) => s + h.quantity * h.cost_basis, 0);
  return (
    <section>
      <div className="portfolio-summary">
        <p className="eyebrow">TOTAL PORTFOLIO VALUE</p>
        <h2>{unpriced ? "—" : money(value)}</h2>
        <p>
          {unpriced ? (
            "Some quotes are unavailable. Totals are paused."
          ) : (
            <>
              {money(value - cost)} unrealized return{" "}
              {cost > 0 && <Change value={((value - cost) / cost) * 100} />}
            </>
          )}
        </p>
        <small>Manual holdings · USD · excludes fees and realized gains</small>
      </div>
      {error && <Notice onRetry={load}>{error}</Notice>}
      <div className="portfolio-grid">
        <section className="surface">
          <div className="section-heading">
            <h2>Your holdings</h2>
            <span>{holdings.length} positions</span>
          </div>
          {rows.length ? (
            rows.map((h) => (
              <div className="holding" key={h.id}>
                <div>
                  <strong>{h.coin?.name || h.coin_id}</strong>
                  <small>
                    {h.quantity} units · {money(h.cost_basis)} average cost
                  </small>
                  {!unpriced && value > 0 && (
                    <progress
                      aria-label={`${h.coin?.name || h.coin_id} allocation`}
                      max="100"
                      value={
                        ((h.quantity * h.coin.current_price) / value) * 100
                      }
                    />
                  )}
                </div>
                <div>
                  <strong>
                    {h.coin
                      ? money(h.quantity * h.coin.current_price)
                      : "Quote unavailable"}
                  </strong>
                  <button className="text-button" onClick={() => setEditing(h)}>
                    Edit
                  </button>
                  <button
                    className="text-button"
                    aria-label={`Remove ${h.coin?.name || h.coin_id} holding`}
                    onClick={async () => {
                      try {
                        await request(`/holdings/${h.id}`, {
                          method: "DELETE",
                        });
                        if (editing?.id === h.id) setEditing(null);
                        await load();
                      } catch (e) {
                        notify(e.message);
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <Empty
              title="Start with your first asset."
              text="Add a position to see its current value and return."
            />
          )}
        </section>
        <section className="surface">
          <h3>{editing ? "Edit holding" : "Add a holding"}</h3>
          <p className="muted">A simple record. No wallets connected.</p>
          <form
            key={editing?.id || "new"}
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              setBusy(true);
              const body = Object.fromEntries(new FormData(form));
              body.quantity = Number(body.quantity);
              body.cost_basis = Number(body.cost_basis);
              try {
                await request(
                  editing ? `/holdings/${editing.id}` : "/holdings",
                  {
                    method: editing ? "PUT" : "POST",
                    body: JSON.stringify(body),
                  },
                );
                form.reset();
                setEditing(null);
                await load();
                notify(editing ? "Holding updated" : "Holding added");
              } catch (err) {
                notify(err.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Asset
              <select
                name="coin_id"
                required
                defaultValue={editing?.coin_id || ""}
              >
                <option value="" disabled>
                  Choose an asset
                </option>
                {coins.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol.toUpperCase()})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input
                name="quantity"
                defaultValue={editing?.quantity}
                type="number"
                min="0.00000001"
                max="1000000000000"
                step="any"
                required
                placeholder="0.00"
              />
            </label>
            <label>
              Average cost per unit (USD)
              <input
                name="cost_basis"
                defaultValue={editing?.cost_basis}
                type="number"
                min="0"
                max="1000000000000"
                step="any"
                required
                placeholder="0.00"
              />
            </label>
            <button className="pill blue full" disabled={busy || !coins.length}>
              {busy ? "Saving…" : editing ? "Save changes" : "Add holding"}
            </button>
            {editing && (
              <button
                type="button"
                className="text-button"
                onClick={() => setEditing(null)}
              >
                Cancel editing
              </button>
            )}
          </form>
        </section>
      </div>
    </section>
  );
}
