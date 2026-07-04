import { useState } from "react";
import { Nav } from "./components/Nav";
import { PostsPage } from "./pages/PostsPage";
import { FeedsPage } from "./pages/FeedsPage";
import { SettingsPage } from "./pages/SettingsPage";

type Page = "posts" | "feeds" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("posts");

  return (
    <div className="app">
      <Nav page={page} onNavigate={setPage} />
      <main>
        {page === "posts" && <PostsPage />}
        {page === "feeds" && <FeedsPage />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
