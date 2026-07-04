import { useCallback, useEffect, useState } from "react";
import type { Post } from "../types";
import { api } from "../api";
import { PostCard } from "../components/PostCard";

export function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await api.listPosts();
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleCheckNow() {
    setChecking(true);
    setMessage(null);
    try {
      const result = await api.checkNow();
      setMessage(
        result.newPosts > 0
          ? `${result.newPosts} novo(s) post(s) encontrados em ${result.feedsChecked} feed(s).`
          : `Nenhuma notícia nova em ${result.feedsChecked} feed(s).`
      );
      load();
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Posts gerados</h1>
        <button className="btn btn-primary" disabled={checking} onClick={handleCheckNow}>
          {checking ? "Checando…" : "Checar feeds agora"}
        </button>
      </div>
      {message && <p className="info-message">{message}</p>}

      {loading ? (
        <p>Carregando…</p>
      ) : posts.length === 0 ? (
        <p className="empty-state">
          Nenhum post ainda. Cadastre um feed RSS na aba "Feeds" para começar.
        </p>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
