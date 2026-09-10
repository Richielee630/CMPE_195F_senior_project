import { useEffect, useState } from "react";

export function readLocation() {
  const url = new URL(window.location.href);
  return {
    view:
      url.pathname === "/watchlist"
        ? "watchlist"
        : url.pathname === "/portfolio"
          ? "portfolio"
          : "markets",
    coin: /^[a-z0-9][a-z0-9-]{0,79}$/.test(url.searchParams.get("coin") || "")
      ? url.searchParams.get("coin")
      : null,
    auth: ["login", "register"].includes(url.searchParams.get("auth"))
      ? url.searchParams.get("auth")
      : null,
  };
}

export function useNavigation() {
  const [route, setRoute] = useState(readLocation);
  useEffect(() => {
    const update = () => setRoute(readLocation());
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  function navigate(patch) {
    const next = { ...readLocation(), ...patch };
    const url = new URL(window.location.href);
    url.pathname = next.view === "markets" ? "/" : `/${next.view}`;
    for (const key of ["coin", "auth"])
      next[key]
        ? url.searchParams.set(key, next[key])
        : url.searchParams.delete(key);
    url.hash = "";
    if (url.href !== window.location.href)
      window.history.pushState(null, "", url);
    setRoute(readLocation());
  }
  return { ...route, navigate };
}
