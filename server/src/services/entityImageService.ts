/**
 * Reconhece marcas/empresas conhecidas citadas no título da notícia e busca
 * o logo oficial (via Clearbit Logo API, gratuita e sem chave) para usar
 * como fundo em destaque quando a notícia não tem foto própria.
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

// Frases mais longas primeiro, para "banco do brasil" ganhar de um possível "brasil" solto.
const SORTED_BRANDS = Object.entries(BRAND_DOMAINS).sort((a, b) => b[0].length - a[0].length);

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(COMBINING_DIACRITICS, "");
}

export function detectBrandDomain(title: string): string | null {
  const normalizedTitle = ` ${normalize(title)} `;
  for (const [keyword, domain] of SORTED_BRANDS) {
    const pattern = new RegExp(`[^a-z0-9]${keyword.replace(/ /g, "\\s+")}[^a-z0-9]`, "i");
    if (pattern.test(normalizedTitle)) return domain;
  }
  return null;
}

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

/** Busca o logo da marca citada no título, se houver alguma reconhecida. */
export async function findBrandLogoForTitle(title: string): Promise<Buffer | null> {
  const domain = detectBrandDomain(title);
  if (!domain) return null;
  return fetchBrandLogo(domain);
}
