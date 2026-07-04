import { db } from "../db.js";
import type { Settings } from "../types.js";

const getAllStmt = db.prepare("SELECT key, value FROM settings");
const setStmt = db.prepare(
  "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
);

export function getSettings(): Settings {
  const rows = getAllStmt.all() as { key: string; value: string }[];
  const raw = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    image_format: raw.image_format === "portrait" ? "portrait" : "square",
    ai_enabled: raw.ai_enabled !== "false",
    dropbox_auto_save: raw.dropbox_auto_save === "true",
    dropbox_folder_path: raw.dropbox_folder_path ?? "/Postinsta",
  };
}

export function updateSettings(partial: Partial<Settings>): Settings {
  const current = getSettings();
  const next = { ...current, ...partial };
  setStmt.run("image_format", next.image_format);
  setStmt.run("ai_enabled", String(next.ai_enabled));
  setStmt.run("dropbox_auto_save", String(next.dropbox_auto_save));
  setStmt.run("dropbox_folder_path", next.dropbox_folder_path);
  return next;
}
