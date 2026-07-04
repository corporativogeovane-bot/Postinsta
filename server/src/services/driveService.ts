import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";
import { Readable } from "node:stream";
import { ROOT_DIR, config } from "../config.js";

export interface DriveUploadResult {
  id: string;
  webViewLink: string;
}

function resolveKeyFilePath(): string {
  return path.isAbsolute(config.google.keyFile)
    ? config.google.keyFile
    : path.join(ROOT_DIR, config.google.keyFile);
}

export function isDriveConfigured(): boolean {
  return fs.existsSync(resolveKeyFilePath());
}

async function getDriveClient() {
  const keyFile = resolveKeyFilePath();
  if (!fs.existsSync(keyFile)) {
    throw new Error(
      "Credenciais do Google Drive não encontradas. Configure GOOGLE_SERVICE_ACCOUNT_KEY_FILE."
    );
  }
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  return google.drive({ version: "v3", auth });
}

export async function uploadImageToDrive(
  fileBuffer: Buffer,
  fileName: string,
  folderId: string
): Promise<DriveUploadResult> {
  const drive = await getDriveClient();

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType: "image/jpeg",
      body: Readable.from(fileBuffer),
    },
    fields: "id, webViewLink",
  });

  if (!res.data.id) {
    throw new Error("Falha ao enviar imagem para o Google Drive.");
  }

  return {
    id: res.data.id,
    webViewLink: res.data.webViewLink ?? "",
  };
}
