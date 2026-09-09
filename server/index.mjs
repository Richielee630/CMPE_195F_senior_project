import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { createService } from "./app.mjs";

export function createApp(options) {
  const service = createService(options);
  const server = createServer(async (req, res) => {
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 16_384) {
          res.writeHead(413, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Request is too large." }));
          return;
        }
        chunks.push(chunk);
      }
      const method = req.method;
      const request = new Request(`http://localhost${req.url}`, {
        method,
        headers: req.headers,
        ...(method !== "GET" && method !== "HEAD"
          ? { body: Buffer.concat(chunks) }
          : {}),
      });
      const response = await service.handle(
        request,
        req.socket.remoteAddress || "unknown",
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid request." }));
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.on("close", () => service.db.close());
  return server;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  createApp().listen(8888, "127.0.0.1", () =>
    console.log("API ready at http://127.0.0.1:8888"),
  );
}
