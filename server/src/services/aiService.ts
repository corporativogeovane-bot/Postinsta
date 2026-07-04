/**
 * Integração com a Pollinations.ai (https://pollinations.ai) - API de IA
 * gratuita e sem necessidade de chave, usada como recurso opcional para:
 *  - gerar legenda + hashtags a partir do título/resumo da notícia
 *  - gerar uma imagem de fundo quando a notícia não trouxer nenhuma imagem
 */

const TEXT_ENDPOINT = "https://text.pollinations.ai/openai";
const IMAGE_ENDPOINT = "https://image.pollinations.ai/prompt";

export interface AiCaption {
  caption: string;
  hashtags: string[];
}

function extractJsonBlock(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

export async function generateCaption(
  title: string,
  summary: string
): Promise<AiCaption | null> {
  try {
    const prompt = [
      "Você é um social media especialista em Instagram no Brasil.",
      `Notícia: "${title}"`,
      summary ? `Resumo: "${summary}"` : "",
      "Escreva uma legenda curta e envolvente para um post de Instagram sobre essa notícia,",
      "em português, com no máximo 2 frases, e sugira de 5 a 8 hashtags relevantes.",
      'Responda SOMENTE em JSON no formato: {"caption": "...", "hashtags": ["#exemplo1", "#exemplo2"]}',
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch(TEXT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const jsonBlock = extractJsonBlock(content);
    if (!jsonBlock) return null;

    const parsed = JSON.parse(jsonBlock);
    if (!parsed.caption) return null;

    return {
      caption: String(parsed.caption),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String) : [],
    };
  } catch {
    return null;
  }
}

export async function generateFallbackImage(
  prompt: string,
  width: number,
  height: number
): Promise<Buffer | null> {
  try {
    const url = `${IMAGE_ENDPOINT}/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}
