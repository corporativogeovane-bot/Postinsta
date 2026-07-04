import { Router } from "express";
import { getSettings, updateSettings } from "../services/settingsService.js";
import { isDriveConfigured } from "../services/driveService.js";
import { checkAllFeeds } from "../services/feedMonitor.js";

export const settingsRouter = Router();

settingsRouter.get("/", (_req, res) => {
  res.json({ ...getSettings(), drive_credentials_present: isDriveConfigured() });
});

settingsRouter.put("/", (req, res) => {
  const next = updateSettings(req.body ?? {});
  res.json({ ...next, drive_credentials_present: isDriveConfigured() });
});

settingsRouter.post("/check-now", async (_req, res) => {
  const result = await checkAllFeeds();
  res.json(result);
});
