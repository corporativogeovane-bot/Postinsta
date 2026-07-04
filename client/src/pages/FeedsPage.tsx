import { useEffect, useState } from "react";
import type { Feed } from "../types";
import { api } from "../api";

export function FeedsPage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setFeeds(await api.listFeeds());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.addFeed(name, url);
      setName("");
      setUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar feed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(feed: Feed) {
    await api.toggleFeed(feed.id, !feed.active);
    await load();
  }

  async function handleDelete(feed: Feed) {
    if (!confirm(`Remover o feed "${feed.name}"?`)) return;
    await api.deleteFeed(feed.id);
    await load();
  }

  return (
    <div className="page">
      <h1>Feeds monitorados</h1>

      <form className="feed-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Nome (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="url"
          placeholder="https://exemplo.com/rss"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Adicionando…" : "Adicionar feed"}
        </button>
      </form>
      {error && <p className="post-error">{error}</p>}

      <table className="feeds-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>URL</th>
            <th>Ativo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {feeds.map((feed) => (
            <tr key={feed.id}>
              <td>{feed.name}</td>
              <td className="feed-url">{feed.url}</td>
              <td>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!feed.active}
                    onChange={() => handleToggle(feed)}
                  />
                  <span />
                </label>
              </td>
              <td>
                <button className="btn btn-danger" onClick={() => handleDelete(feed)}>
                  Remover
                </button>
              </td>
            </tr>
          ))}
          {feeds.length === 0 && (
            <tr>
              <td colSpan={4} className="empty-state">
                Nenhum feed cadastrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
