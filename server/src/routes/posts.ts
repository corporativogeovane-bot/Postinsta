import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { db } from "../db.js";
import { GENERATED_DIR } from "../config.js";
import { processPost, saveExistingPostToDropbox } from "../services/postService.js";
import type { Post } from "../types.js";

export const postsRouter = Router();

const listStmt = db.prepare(`
  SELECT posts.*, feeds.name AS feed_name FROM posts
  JOIN feeds ON feeds.id = posts.feed_id
  ORDER BY posts.created_at DESC
  LIMIT ?
`);

const getStmt = db.prepare(`
  SELECT posts.*, feeds.name AS feed_name FROM posts
  JOIN feeds ON feeds.id = posts.feed_id
  WHERE posts.id = ?
`);

const deleteStmt = db.prepare("DELETE FROM posts WHERE id = ?");
const resetStmt = db.prepare("UPDATE posts SET status = 'processing', error_message = NULL WHERE id = ?");

postsRouter.get("/", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 60, 200);
  res.json(listStmt.all(limit) as Post[]);
});

postsRouter.get("/:id/download", (req, res) => {
  const post = getStmt.get(Number(req.params.id)) as Post | undefined;
  if (!post?.image_path) return res.status(404).json({ error: "Imagem não encontrada." });

  const filePath = path.join(GENERATED_DIR, post.image_path);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Arquivo não encontrado." });

  const safeName = post.title.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 60);
  res.download(filePath, `${safeName || "post"}.jpg`);
});

postsRouter.post("/:id/save-to-dropbox", async (req, res) => {
  const post = getStmt.get(Number(req.params.id)) as Post | undefined;
  if (!post) return res.status(404).json({ error: "Post não encontrado." });

  try {
    const result = await saveExistingPostToDropbox(post);
    res.json({ dropboxPath: result.path, dropboxLink: result.link });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Erro ao salvar no Dropbox." });
  }
});

postsRouter.post("/:id/regenerate", async (req, res) => {
  const post = getStmt.get(Number(req.params.id)) as Post | undefined;
  if (!post) return res.status(404).json({ error: "Post não encontrado." });

  resetStmt.run(post.id);
  res.json({ status: "processing" });

  void processPost(post.id, {
    title: post.title,
    summary: "",
    link: post.link,
    feedName: post.feed_name,
    sourceImageUrl: post.source_image_url,
  });
});

postsRouter.delete("/:id", (req, res) => {
  const post = getStmt.get(Number(req.params.id)) as Post | undefined;
  if (post?.image_path) {
    const filePath = path.join(GENERATED_DIR, post.image_path);
    fs.rm(filePath, { force: true }, () => {});
  }
  deleteStmt.run(Number(req.params.id));
  res.status(204).end();
});
