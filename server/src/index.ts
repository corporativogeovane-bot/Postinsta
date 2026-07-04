import express from "express";
import cors from "cors";
import "./db.js";
import { config, GENERATED_DIR } from "./config.js";
import { feedsRouter } from "./routes/feeds.js";
import { postsRouter } from "./routes/posts.js";
import { settingsRouter } from "./routes/settings.js";
import { startScheduler } from "./scheduler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/generated", express.static(GENERATED_DIR));

app.use("/api/feeds", feedsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/settings", settingsRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(config.port, () => {
  console.log(`Postinsta server rodando em http://localhost:${config.port}`);
  startScheduler();
});
