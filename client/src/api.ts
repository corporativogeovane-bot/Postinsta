import type { Feed, Post, Settings } from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listFeeds: () => request<Feed[]>("/api/feeds"),
  addFeed: (name: string, url: string) =>
    request<Feed>("/api/feeds", { method: "POST", body: JSON.stringify({ name, url }) }),
  toggleFeed: (id: number, active: boolean) =>
    request<Feed>(`/api/feeds/${id}`, { method: "PATCH", body: JSON.stringify({ active }) }),
  deleteFeed: (id: number) => request<void>(`/api/feeds/${id}`, { method: "DELETE" }),

  listPosts: () => request<Post[]>("/api/posts"),
  deletePost: (id: number) => request<void>(`/api/posts/${id}`, { method: "DELETE" }),
  regeneratePost: (id: number) => request<{ status: string }>(`/api/posts/${id}/regenerate`, { method: "POST" }),
  saveToDropbox: (id: number) =>
    request<{ dropboxPath: string; dropboxLink: string }>(`/api/posts/${id}/save-to-dropbox`, {
      method: "POST",
    }),

  getSettings: () => request<Settings>("/api/settings"),
  updateSettings: (partial: Partial<Settings>) =>
    request<Settings>("/api/settings", { method: "PUT", body: JSON.stringify(partial) }),
  checkNow: () => request<{ feedsChecked: number; newPosts: number }>("/api/settings/check-now", {
    method: "POST",
  }),
};
