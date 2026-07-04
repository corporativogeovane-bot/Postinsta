import * as cheerio from "cheerio";

interface MediaTag {
  $?: { url?: string; type?: string; medium?: string };
}

export interface FeedItemLike {
  link?: string;
  content?: string;
  contentSnippet?: string;
  "content:encoded"?: string;
  enclosure?: { url?: string; type?: string };
  "media:content"?: MediaTag | MediaTag[];
  "media:thumbnail"?: MediaTag | MediaTag[];
}

const IMAGE_EXTENSION_RE = /\.(jpe?g|png|webp|gif)(\?.*)?$/i;

function firstMediaUrl(media: MediaTag | MediaTag[] | undefined): string | null {
  if (!media) return null;
  const list = Array.isArray(media) ? media : [media];
  for (const entry of list) {
    const url = entry?.$?.url;
    if (url) return url;
  }
  return null;
}

function extractImgFromHtml(html: string | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

async function fetchOgImage(link: string): Promise<string | null> {
  try {
    const res = await fetch(link, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "PostinstaBot/1.0 (+https://example.com)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const og =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[property="og:image:url"]').attr("content");
    return og ?? null;
  } catch {
    return null;
  }
}

/**
 * Tenta descobrir a imagem principal de uma notícia, na seguinte ordem:
 * enclosure -> media:content/thumbnail -> <img> no conteúdo -> og:image da página.
 */
export async function extractImageFromItem(item: FeedItemLike): Promise<string | null> {
  const enclosureUrl = item.enclosure?.url;
  if (enclosureUrl && (!item.enclosure?.type || item.enclosure.type.startsWith("image"))) {
    if (!item.enclosure?.type && !IMAGE_EXTENSION_RE.test(enclosureUrl)) {
      // enclosure sem tipo declarado e sem extensão de imagem reconhecível: ignora
    } else {
      return enclosureUrl;
    }
  }

  const mediaContent = firstMediaUrl(item["media:content"]);
  if (mediaContent) return mediaContent;

  const mediaThumbnail = firstMediaUrl(item["media:thumbnail"]);
  if (mediaThumbnail) return mediaThumbnail;

  const imgFromContent =
    extractImgFromHtml(item["content:encoded"]) || extractImgFromHtml(item.content);
  if (imgFromContent) return imgFromContent;

  if (item.link) {
    const ogImage = await fetchOgImage(item.link);
    if (ogImage) return ogImage;
  }

  return null;
}
