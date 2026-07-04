/**
 * Reconhece marcas/empresas conhecidas citadas no título da notícia, para que
 * o gerador de imagem possa pedir à IA um fundo com o símbolo dessa marca em
 * destaque (em vez de uma imagem genérica sem relação com a notícia).
 */

const BRAND_DOMAINS: Record<string, string> = {
  google: "google.com",
  "google ai": "google.com",
  "google deepmind": "deepmind.com",
  deepmind: "deepmind.com",
  alphabet: "abc.xyz",
  meta: "meta.com",
  facebook: "facebook.com",
  instagram: "instagram.com",
  whatsapp: "whatsapp.com",
  apple: "apple.com",
  microsoft: "microsoft.com",
  openai: "openai.com",
  chatgpt: "openai.com",
  anthropic: "anthropic.com",
  claude: "anthropic.com",
  amazon: "amazon.com",
  netflix: "netflix.com",
  twitter: "x.com",
  "x corp": "x.com",
  tiktok: "tiktok.com",
  samsung: "samsung.com",
  nvidia: "nvidia.com",
  tesla: "tesla.com",
  spacex: "spacex.com",
  uber: "uber.com",
  spotify: "spotify.com",
  linkedin: "linkedin.com",
  ibm: "ibm.com",
  intel: "intel.com",
  sony: "sony.com",
  huawei: "huawei.com",
  xiaomi: "mi.com",
  adobe: "adobe.com",
  salesforce: "salesforce.com",
  oracle: "oracle.com",
  paypal: "paypal.com",
  airbnb: "airbnb.com",
  petrobras: "petrobras.com.br",
  vale: "vale.com",
  nubank: "nubank.com.br",
  itau: "itau.com.br",
  bradesco: "bradesco.com.br",
  "banco do brasil": "bb.com.br",
  caixa: "caixa.gov.br",
  ambev: "ambev.com.br",
  "magazine luiza": "magazineluiza.com.br",
  magalu: "magazineluiza.com.br",
  americanas: "americanas.com.br",
  globo: "globo.com",
  record: "recordtv.com.br",
  sbt: "sbt.com.br",
  correios: "correios.com.br",
  embraer: "embraer.com",
  jbs: "jbs.com.br",
  ifood: "ifood.com.br",
  "mercado livre": "mercadolivre.com.br",
  mercadolivre: "mercadolivre.com.br",
  shein: "shein.com",
  shopee: "shopee.com.br",
};

// Nomes que não seguem a simples capitalização de cada palavra.
const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  ibm: "IBM",
  jbs: "JBS",
  sbt: "SBT",
  ifood: "iFood",
  chatgpt: "ChatGPT",
  openai: "OpenAI",
  tiktok: "TikTok",
  nvidia: "NVIDIA",
  spacex: "SpaceX",
  paypal: "PayPal",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  deepmind: "DeepMind",
  "google deepmind": "Google DeepMind",
  "banco do brasil": "Banco do Brasil",
  "magazine luiza": "Magazine Luiza",
  magalu: "Magazine Luiza",
  "mercado livre": "Mercado Livre",
  mercadolivre: "Mercado Livre",
  "x corp": "X (Twitter)",
  twitter: "X (Twitter)",
};

// Frases mais longas primeiro, para "banco do brasil" ganhar de um possível "brasil" solto.
const SORTED_BRANDS = Object.keys(BRAND_DOMAINS).sort((a, b) => b.length - a.length);

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(COMBINING_DIACRITICS, "");
}

function toDisplayName(keyword: string): string {
  return DISPLAY_NAME_OVERRIDES[keyword] ?? keyword.replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface DetectedBrand {
  keyword: string;
  domain: string;
  displayName: string;
}

export function detectBrand(title: string): DetectedBrand | null {
  const normalizedTitle = ` ${normalize(title)} `;
  for (const keyword of SORTED_BRANDS) {
    const pattern = new RegExp(`[^a-z0-9]${keyword.replace(/ /g, "\\s+")}[^a-z0-9]`, "i");
    if (pattern.test(normalizedTitle)) {
      return { keyword, domain: BRAND_DOMAINS[keyword], displayName: toDisplayName(keyword) };
    }
  }
  return null;
}

/** Monta um prompt para a IA desenhar o símbolo da marca bem grande, sem precisar escrever tudo. */
export function buildBrandSymbolPrompt(displayName: string): string {
  return [
    `${displayName} logo icon symbol only`,
    "single bold minimalist mark, no readable text, no letters spelled out",
    "huge, centered, filling almost the entire frame",
    "flat vector design, official brand colors, clean simple background",
  ].join(", ");
}

/** Busca o logo oficial exato da marca (Clearbit), como alternativa mais fiel à IA generativa. */
export async function fetchBrandLogo(domain: string): Promise<Buffer | null> {
  try {
    const res = await fetch(`https://logo.clearbit.com/${domain}?size=800`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}
