import { Router } from "express";
import { db } from "../db.js";
import { checkFeed } from "../services/feedMonitor.js";
import type { Feed } from "../types.js";

export const feedsRouter = Router();

const listStmt = db.prepare("SELECT * FROM feeds ORDER BY created_at DESC");
const insertStmt = db.prepare("INSERT INTO feeds (name, url) VALUES (?, ?)");
const deleteStmt = db.prepare("DELETE FROM feeds WHERE id = ?");
const toggleStmt = db.prepare("UPDATE feeds SET active = ? WHERE id = ?");
const getStmt = db.prepare("SELECT * FROM feeds WHERE id = ?");

feedsRouter.get("/", (_req, res) => {
  res.json(listStmt.all() as Feed[]);
});

feedsRouter.post("/", async (req, res) => {
  const { name, url } = req.body ?? {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL do feed é obrigatória." });
  }

  try {
    const info = insertStmt.run(name?.trim() || url, url.trim());
    const feed = getStmt.get(info.lastInsertRowid) as Feed;
    res.status(201).json(feed);

    // Checa o feed recém-criado em segundo plano, sem bloquear a resposta.
    checkFeed(feed).catch((err) => console.error("Erro ao checar novo feed:", err));
  } catch (err: any) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "Esse feed já está cadastrado." });
    }
    res.status(500).json({ error: "Erro ao cadastrar feed." });
  }
});

feedsRouter.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const feed = getStmt.get(id) as Feed | undefined;
  if (!feed) return res.status(404).json({ error: "Feed não encontrado." });

  const active = req.body?.active;
  toggleStmt.run(active ? 1 : 0, id);
  res.json(getStmt.get(id));
});

feedsRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  deleteStmt.run(id);
  res.status(204).end();
});
