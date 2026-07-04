import { Router } from "express";
import { getSettings, updateSettings } from "../services/settingsService.js";
import { isDropboxConfigured } from "../services/dropboxService.js";
import { checkAllFeeds } from "../services/feedMonitor.js";

export const settingsRouter = Router();

settingsRouter.get("/", (_req, res) => {
  res.json({ ...getSettings(), dropbox_configured: isDropboxConfigured() });
});

settingsRouter.put("/", (req, res) => {
  const next = updateSettings(req.body ?? {});
  res.json({ ...next, dropbox_configured: isDropboxConfigured() });
});

settingsRouter.post("/check-now", async (_req, res) => {
  const result = await checkAllFeeds();
  res.json(result);
});
