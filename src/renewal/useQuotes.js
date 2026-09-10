import { useEffect, useState } from "react";
import { request } from "./api";

export function useQuotes(ids, revision) {
  const key = [...new Set(ids)].sort().join(",");
  const [result, setResult] = useState({
    key: "",
    data: [],
    loading: false,
    error: "",
  });
  useEffect(() => {
    if (!key) {
      setResult({ key, data: [], loading: false, error: "" });
      return;
    }
    const controller = new AbortController();
    setResult({ key, data: [], loading: true, error: "" });
    const allIds = key.split(",");
    const batches = [];
    for (let i = 0; i < allIds.length; i += 100)
      batches.push(allIds.slice(i, i + 100));
    Promise.all(
      batches.map((ids) =>
        request(`/quotes?ids=${encodeURIComponent(ids.join(","))}`, {
          signal: controller.signal,
        }),
      ),
    )
      .then((responses) => ({
        data: responses.flatMap((r) => r.data || []),
        stale: responses.some((r) => r.stale),
        updatedAt: Math.min(...responses.map((r) => r.updatedAt || Date.now())),
      }))
      .then((response) => {
        if (!controller.signal.aborted)
          setResult({ ...response, key, loading: false, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ key, data: [], loading: false, error: error.message });
      });
    return () => controller.abort();
  }, [key, revision]);
  return result.key === key
    ? result
    : { data: [], loading: Boolean(key), error: "" };
}
