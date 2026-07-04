/**
 * Testa a configuração do Dropbox: envia uma imagem pequena de teste para a
 * pasta configurada e confere se o link de compartilhamento é gerado.
 *
 * Uso: npm run test:dropbox   (rode a partir de server/, com o .env configurado)
 */
import sharp from "sharp";
import { config } from "../config.js";
import { isDropboxConfigured, uploadImageToDropbox } from "../services/dropboxService.js";

async function main() {
  console.log("Verificando configuração do Dropbox...\n");

  if (!isDropboxConfigured()) {
    console.error(
      "❌ DROPBOX_ACCESS_TOKEN não está definido no server/.env. Configure e rode de novo."
    );
    process.exit(1);
  }

  console.log(`Pasta de destino: ${config.dropbox.folderPath}`);
  console.log("Gerando imagem de teste...");

  const testImage = await sharp({
    create: { width: 600, height: 600, channels: 3, background: { r: 37, g: 99, b: 235 } },
  })
    .jpeg()
    .toBuffer();

  const fileName = `postinsta-teste-${Date.now()}.jpg`;

  try {
    console.log("Enviando para o Dropbox...");
    const result = await uploadImageToDropbox(testImage, fileName, config.dropbox.folderPath);
    console.log("\n✅ Upload concluído com sucesso!");
    console.log(`   Caminho no Dropbox: ${result.path}`);
    console.log(`   Link: ${result.link || "(não foi possível gerar link de compartilhamento)"}`);
  } catch (err) {
    console.error("\n❌ Falha ao enviar para o Dropbox:");
    console.error(`   ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

main();
