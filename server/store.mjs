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
  if (db.prepare("PRAGMA user_version").get().user_version < 2)
    db.exec(`BEGIN;
      ALTER TABLE holdings ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id) AS position
        FROM holdings
      ) UPDATE holdings SET sort_order = (SELECT position FROM ranked WHERE ranked.id = holdings.id);
      PRAGMA user_version = 2;
      COMMIT;`);
  db.exec("PRAGMA optimize");
  return db;
}
