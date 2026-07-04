import sharp from "sharp";

export type ImageFormat = "square" | "portrait";

const DIMENSIONS: Record<ImageFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
};

const GRADIENT_PALETTES: [string, string][] = [
  ["#1f2937", "#4b1d3f"],
  ["#0f172a", "#1d4ed8"],
  ["#3b0764", "#9d174d"],
  ["#052e16", "#065f46"],
  ["#1e1b4b", "#7c2d12"],
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  // Se sobrou texto além do que coube, adiciona reticências na última linha.
  const consumedWords = lines.join(" ").split(/\s+/).length;
  if (consumedWords < words.length) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] =
      last.length > maxCharsPerLine - 1 ? `${last.slice(0, maxCharsPerLine - 1)}…` : `${last}…`;
  }

  return lines;
}

function pickPalette(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENT_PALETTES[hash % GRADIENT_PALETTES.length];
}

export type BackgroundMode = "photo" | "logo";

interface GenerateOptions {
  title: string;
  sourceLabel: string;
  format: ImageFormat;
  backgroundImage?: Buffer | null;
  backgroundMode?: BackgroundMode;
}

export async function generateInstagramImage({
  title,
  sourceLabel,
  format,
  backgroundImage,
  backgroundMode = "photo",
}: GenerateOptions): Promise<Buffer> {
  const { width, height } = DIMENSIONS[format];

  let background: Buffer;
  if (backgroundImage && backgroundMode === "logo") {
    try {
      background = await buildLogoBackground(backgroundImage, width, height);
    } catch {
      background = await buildGradientBackground(title, width, height);
    }
  } else if (backgroundImage) {
    try {
      background = await sharp(backgroundImage)
        .resize(width, height, { fit: "cover", position: "attention" })
        .toBuffer();
    } catch {
      background = await buildGradientBackground(title, width, height);
    }
  } else {
    background = await buildGradientBackground(title, width, height);
  }

  const fontSize = title.length > 110 ? 46 : title.length > 70 ? 54 : 66;
  const maxCharsPerLine = Math.floor((width - 140) / (fontSize * 0.56));
  const lines = wrapText(title, maxCharsPerLine, 6);
  const lineHeight = fontSize * 1.22;

  const textBlockHeight = lines.length * lineHeight;
  const bottomPadding = 90;
  const firstLineY = height - bottomPadding - textBlockHeight + fontSize;

  const gradientStart = Math.max(0, height - textBlockHeight - 260);

  const tspans = lines
    .map((line, i) => {
      const y = firstLineY + i * lineHeight;
      return `<text x="70" y="${y}" font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="${fontSize}" fill="#ffffff" stroke="rgba(0,0,0,0.35)" stroke-width="2" paint-order="stroke">${escapeXml(
        line
      )}</text>`;
    })
    .join("\n");

  const badgeY = gradientStart + 46;

  const overlaySvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#000000" stop-opacity="0" />
          <stop offset="1" stop-color="#000000" stop-opacity="0.82" />
        </linearGradient>
      </defs>
      <rect x="0" y="${gradientStart}" width="${width}" height="${height - gradientStart}" fill="url(#scrim)" />
      <rect x="70" y="${badgeY}" width="${Math.min(220, 26 + sourceLabel.length * 13)}" height="40" rx="20" fill="#ef4444" />
      <text x="${70 + 18}" y="${badgeY + 27}" font-family="Arial, sans-serif" font-weight="700" font-size="20" fill="#ffffff">${escapeXml(
        sourceLabel.toUpperCase()
      )}</text>
      ${tspans}
    </svg>
  `;

  return sharp(background)
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}

async function buildGradientBackground(
  seed: string,
  width: number,
  height: number
): Promise<Buffer> {
  const [from, to] = pickPalette(seed);
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${from}" />
          <stop offset="1" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" />
    </svg>
  `;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Monta um fundo com o logo da marca bem grande e centralizado, sobre um
 * card branco, com um fundo desfocado nas cores da própria marca por trás.
 */
async function buildLogoBackground(
  logoBuffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  const flattened = await sharp(logoBuffer)
    .flatten({ background: "#f1f5f9" })
    .toBuffer();

  const backdrop = await sharp(flattened)
    .resize(width, height, { fit: "cover" })
    .blur(70)
    .modulate({ brightness: 0.45 })
    .toBuffer();

  const cardWidth = Math.round(width * 0.74);
  const maxLogoWidth = cardWidth - 100;
  const maxLogoHeight = Math.round(height * 0.32);

  const logo = await sharp(logoBuffer)
    .resize({
      width: maxLogoWidth,
      height: maxLogoHeight,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoWidth = logoMeta.width ?? maxLogoWidth;
  const logoHeight = logoMeta.height ?? maxLogoHeight;

  const cardHeight = logoHeight + 100;
  const cardSvg = `<svg width="${cardWidth}" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="${cardWidth}" height="${cardHeight}" rx="28" fill="#ffffff" /></svg>`;
  const card = await sharp(Buffer.from(cardSvg)).png().toBuffer();

  const cardLeft = Math.round((width - cardWidth) / 2);
  const cardTop = Math.round(height * 0.09);
  const logoLeft = cardLeft + Math.round((cardWidth - logoWidth) / 2);
  const logoTop = cardTop + Math.round((cardHeight - logoHeight) / 2);

  return sharp(backdrop)
    .composite([
      { input: card, left: cardLeft, top: cardTop },
      { input: logo, left: logoLeft, top: logoTop },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}

export function dimensionsFor(format: ImageFormat) {
  return DIMENSIONS[format];
}
