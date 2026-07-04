import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, GENERATED_DIR, config } from "./config.js";

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(GENERATED_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, "postinsta.sqlite"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS feeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feed_id INTEGER NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
    guid TEXT NOT NULL,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    source_image_url TEXT,
    image_path TEXT,
    caption TEXT,
    hashtags TEXT,
    status TEXT NOT NULL DEFAULT 'processing',
    error_message TEXT,
    drive_file_id TEXT,
    drive_file_link TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(feed_id, guid)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const defaultSettings: Record<string, string> = {
  image_format: config.imageFormat,
  ai_enabled: String(config.aiEnabled),
  drive_auto_save: String(config.google.autoSave),
  drive_folder_id: config.google.folderId,
};

const insertSetting = db.prepare(
  "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
);
for (const [key, value] of Object.entries(defaultSettings)) {
  insertSetting.run(key, value);
}
