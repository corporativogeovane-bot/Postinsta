import fs from "node:fs/promises";
import path from "node:path";
import { db } from "../db.js";
import { GENERATED_DIR } from "../config.js";
import { generateCaption, generateFallbackImage } from "./aiService.js";
import { generateInstagramImage, dimensionsFor } from "./imageGenerator.js";
import { uploadImageToDrive, isDriveConfigured } from "./driveService.js";
import { getSettings } from "./settingsService.js";
import type { Post } from "../types.js";

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "PostinstaBot/1.0 (+https://example.com)" },
    });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

const updateStmt = db.prepare(`
  UPDATE posts
  SET status = ?, image_path = ?, caption = ?, hashtags = ?, error_message = ?,
      drive_file_id = ?, drive_file_link = ?
  WHERE id = ?
`);

export async function processPost(
  postId: number,
  input: { title: string; summary: string; link: string; feedName: string; sourceImageUrl: string | null }
): Promise<void> {
  const settings = getSettings();
  const { width, height } = dimensionsFor(settings.image_format);

  try {
    let backgroundImage: Buffer | null = null;
    if (input.sourceImageUrl) {
      backgroundImage = await downloadImage(input.sourceImageUrl);
    }
    if (!backgroundImage && settings.ai_enabled) {
      backgroundImage = await generateFallbackImage(input.title, width, height);
    }

    const imageBuffer = await generateInstagramImage({
      title: input.title,
      sourceLabel: input.feedName,
      format: settings.image_format,
      backgroundImage,
    });

    const fileName = `post-${postId}.jpg`;
    const filePath = path.join(GENERATED_DIR, fileName);
    await fs.writeFile(filePath, imageBuffer);

    let caption: string | null = null;
    let hashtags: string | null = null;
    if (settings.ai_enabled) {
      const ai = await generateCaption(input.title, input.summary);
      if (ai) {
        caption = ai.caption;
        hashtags = ai.hashtags.join(" ");
      }
    }

    let driveFileId: string | null = null;
    let driveFileLink: string | null = null;
    if (settings.drive_auto_save && settings.drive_folder_id && isDriveConfigured()) {
      try {
        const uploaded = await uploadImageToDrive(imageBuffer, fileName, settings.drive_folder_id);
        driveFileId = uploaded.id;
        driveFileLink = uploaded.webViewLink;
      } catch (err) {
        console.error("Falha ao salvar no Google Drive:", err);
      }
    }

    updateStmt.run("ready", fileName, caption, hashtags, null, driveFileId, driveFileLink, postId);
  } catch (err) {
    console.error("Falha ao processar post:", err);
    updateStmt.run(
      "error",
      null,
      null,
      null,
      err instanceof Error ? err.message : "Erro desconhecido",
      null,
      null,
      postId
    );
  }
}

const getPostStmt = db.prepare(`
  SELECT posts.*, feeds.name AS feed_name FROM posts
  JOIN feeds ON feeds.id = posts.feed_id
  WHERE posts.id = ?
`);

export function getPostById(id: number): Post | undefined {
  return getPostStmt.get(id) as Post | undefined;
}

export async function saveExistingPostToDrive(post: Post): Promise<{ id: string; link: string }> {
  if (!post.image_path) throw new Error("Post ainda não possui imagem gerada.");
  const settings = getSettings();
  if (!settings.drive_folder_id) throw new Error("Configure o ID da pasta do Google Drive.");
  const filePath = path.join(GENERATED_DIR, post.image_path);
  const buffer = await fs.readFile(filePath);
  const uploaded = await uploadImageToDrive(buffer, post.image_path, settings.drive_folder_id);

  db.prepare("UPDATE posts SET drive_file_id = ?, drive_file_link = ? WHERE id = ?").run(
    uploaded.id,
    uploaded.webViewLink,
    post.id
  );

  return { id: uploaded.id, link: uploaded.webViewLink };
}
