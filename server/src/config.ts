import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, "..");
export const GENERATED_DIR = path.join(ROOT_DIR, "generated");
export const DATA_DIR = path.join(ROOT_DIR, "data");

export const config = {
  port: Number(process.env.PORT ?? 4000),
  checkIntervalMinutes: Number(process.env.CHECK_INTERVAL_MINUTES ?? 15),
  imageFormat: (process.env.IMAGE_FORMAT === "portrait" ? "portrait" : "square") as
    | "square"
    | "portrait",
  aiEnabled: (process.env.AI_ENABLED ?? "true") !== "false",
  dropbox: {
    accessToken: process.env.DROPBOX_ACCESS_TOKEN ?? "",
    folderPath: process.env.DROPBOX_FOLDER_PATH ?? "/Postinsta",
    autoSave: (process.env.DROPBOX_AUTO_SAVE ?? "false") === "true",
  },
};
