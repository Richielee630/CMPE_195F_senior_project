export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(15_000)])
        : AbortSignal.timeout(15_000),
      headers: { "Content-Type": "application/json", ...options.headers },
      credentials: "same-origin",
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      error.name === "TimeoutError"
        ? "The request took too long. Please try again."
        : "Cannot reach the server. Check your connection and try again.",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The server returned an unreadable response. Please try again.",
    );
  }
  if (!response.ok) {
    const error = new Error(
      data.error || "Something went wrong. Please try again.",
    );
    error.status = response.status;
    error.retryAfter = Number(response.headers.get("retry-after")) || 0;
    if (error.retryAfter > 0)
      error.message += ` Retry in about ${error.retryAfter} seconds.`;
    throw error;
  }
  return data;
}
