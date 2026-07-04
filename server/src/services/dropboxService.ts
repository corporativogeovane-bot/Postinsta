import { config } from "../config.js";

export interface DropboxUploadResult {
  path: string;
  link: string;
}

export function isDropboxConfigured(): boolean {
  return Boolean(config.dropbox.accessToken);
}

function normalizeFolderPath(folderPath: string): string {
  const trimmed = folderPath.trim().replace(/\/+$/, "");
  if (!trimmed || trimmed === "/") return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

async function dropboxApiCall<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.dropbox.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error_summary || `Erro do Dropbox (${res.status})`);
  }
  return data as T;
}

async function getOrCreateSharedLink(path: string): Promise<string> {
  try {
    const created = await dropboxApiCall<{ url: string }>(
      "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
      { path }
    );
    return created.url;
  } catch {
    // Provavelmente já existe um link compartilhado para esse arquivo: busca o existente.
    const existing = await dropboxApiCall<{ links: { url: string }[] }>(
      "https://api.dropboxapi.com/2/sharing/list_shared_links",
      { path, direct_only: true }
    );
    return existing.links?.[0]?.url ?? "";
  }
}

export async function uploadImageToDropbox(
  fileBuffer: Buffer,
  fileName: string,
  folderPath: string
): Promise<DropboxUploadResult> {
  if (!isDropboxConfigured()) {
    throw new Error(
      "Token de acesso do Dropbox não configurado. Defina DROPBOX_ACCESS_TOKEN no .env."
    );
  }

  const destinationPath = `${normalizeFolderPath(folderPath)}/${fileName}`;

  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.dropbox.accessToken}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path: destinationPath,
        mode: "add",
        autorename: true,
        mute: true,
      }),
    },
    body: new Uint8Array(fileBuffer),
    signal: AbortSignal.timeout(30000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error_summary || `Falha ao enviar imagem para o Dropbox (${res.status})`);
  }

  const uploadedPath: string = data.path_display ?? destinationPath;
  const link = await getOrCreateSharedLink(uploadedPath).catch(() => "");

  return { path: uploadedPath, link };
}
