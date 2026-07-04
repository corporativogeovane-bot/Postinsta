import Parser from "rss-parser";
import { db } from "../db.js";
import { extractImageFromItem } from "./imageExtractor.js";
import { processPost } from "./postService.js";
import type { Feed } from "../types.js";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "media:content"],
      ["media:thumbnail", "media:thumbnail"],
      ["content:encoded", "content:encoded"],
    ],
  },
  requestOptions: {
    headers: { "User-Agent": "PostinstaBot/1.0 (+https://example.com)" },
  },
});

const insertPostStmt = db.prepare(`
  INSERT OR IGNORE INTO posts (feed_id, guid, title, link, source_image_url, status)
  VALUES (?, ?, ?, ?, ?, 'processing')
`);

const listActiveFeedsStmt = db.prepare("SELECT * FROM feeds WHERE active = 1");

let isChecking = false;

export async function checkFeed(feed: Feed): Promise<number> {
  let newCount = 0;
  let parsed;
  try {
    parsed = await parser.parseURL(feed.url);
  } catch (err) {
    console.error(`Falha ao ler feed "${feed.name}" (${feed.url}):`, (err as Error).message);
    return 0;
  }

  for (const item of parsed.items) {
    const guid = item.guid || item.link || item.title;
    if (!guid || !item.title || !item.link) continue;

    const imageUrl = await extractImageFromItem(item as any);
    const result = insertPostStmt.run(feed.id, guid, item.title, item.link, imageUrl);

    if (result.changes > 0) {
      newCount += 1;
      const postId = result.lastInsertRowid as number;
      void processPost(postId, {
        title: item.title,
        summary: item.contentSnippet ?? item.content ?? "",
        link: item.link,
        feedName: feed.name,
        sourceImageUrl: imageUrl,
      });
    }
  }

  return newCount;
}

export async function checkAllFeeds(): Promise<{ feedsChecked: number; newPosts: number }> {
  if (isChecking) return { feedsChecked: 0, newPosts: 0 };
  isChecking = true;
  try {
    const feeds = listActiveFeedsStmt.all() as Feed[];
    let newPosts = 0;
    for (const feed of feeds) {
      newPosts += await checkFeed(feed);
    }
    return { feedsChecked: feeds.length, newPosts };
  } finally {
    isChecking = false;
  }
}
