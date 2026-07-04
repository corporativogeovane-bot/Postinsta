import { useState } from "react";
import type { Post } from "../types";
import { api } from "../api";

interface PostCardProps {
  post: Post;
  onChanged: () => void;
}

const statusLabels: Record<Post["status"], string> = {
  processing: "Gerando imagem…",
  ready: "Pronto",
  error: "Erro",
};

export function PostCard({ post, onChanged }: PostCardProps) {
  const [busy, setBusy] = useState(false);
  const [dropboxMessage, setDropboxMessage] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Remover este post?")) return;
    setBusy(true);
    try {
      await api.deletePost(post.id);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleRegenerate() {
    setBusy(true);
    try {
      await api.regeneratePost(post.id);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveToDropbox() {
    setBusy(true);
    setDropboxMessage(null);
    try {
      const result = await api.saveToDropbox(post.id);
      setDropboxMessage("Salvo no Dropbox!");
      onChanged();
      void result;
    } catch (err) {
      setDropboxMessage(err instanceof Error ? err.message : "Erro ao salvar no Dropbox.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="post-card">
      <div className="post-image-wrap">
        {post.image_path ? (
          <img src={`/generated/${post.image_path}`} alt={post.title} loading="lazy" />
        ) : (
          <div className="post-image-placeholder">{statusLabels[post.status]}</div>
        )}
        <span className={`status-badge status-${post.status}`}>{statusLabels[post.status]}</span>
      </div>

      <div className="post-body">
        <a className="post-title" href={post.link} target="_blank" rel="noreferrer">
          {post.title}
        </a>
        <div className="post-meta">
          {post.feed_name} · {new Date(post.created_at).toLocaleString("pt-BR")}
        </div>

        {post.caption && <p className="post-caption">{post.caption}</p>}
        {post.hashtags && <p className="post-hashtags">{post.hashtags}</p>}
        {post.error_message && <p className="post-error">{post.error_message}</p>}

        <div className="post-actions">
          <a
            className="btn btn-primary"
            href={post.image_path ? `/api/posts/${post.id}/download` : undefined}
            aria-disabled={!post.image_path}
            onClick={(e) => !post.image_path && e.preventDefault()}
          >
            Baixar imagem
          </a>
          <button className="btn" disabled={busy || !post.image_path} onClick={handleSaveToDropbox}>
            {post.dropbox_link ? "Salvo no Dropbox ✓" : "Salvar no Dropbox"}
          </button>
          <button className="btn" disabled={busy} onClick={handleRegenerate}>
            Gerar novamente
          </button>
          <button className="btn btn-danger" disabled={busy} onClick={handleDelete}>
            Remover
          </button>
        </div>

        {post.dropbox_link && (
          <a className="dropbox-link" href={post.dropbox_link} target="_blank" rel="noreferrer">
            Ver no Dropbox
          </a>
        )}
        {dropboxMessage && <p className="dropbox-message">{dropboxMessage}</p>}
      </div>
    </div>
  );
}
