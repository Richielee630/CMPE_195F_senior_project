import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, chmodSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function openStore(
  filename = process.env.DATABASE_PATH || "./data/crypto-solution.sqlite",
) {
  if (filename !== ":memory:")
    mkdirSync(dirname(resolve(filename)), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  if (filename !== ":memory:") chmodSync(filename, 0o600);
  db.exec(
    "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;",
  );
  if (db.prepare("PRAGMA user_version").get().user_version < 1)
    db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
  db.exec("PRAGMA optimize");
  return db;
}
