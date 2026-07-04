interface NavProps {
  page: "posts" | "feeds" | "settings";
  onNavigate: (page: "posts" | "feeds" | "settings") => void;
}

const items: { key: NavProps["page"]; label: string }[] = [
  { key: "posts", label: "Posts gerados" },
  { key: "feeds", label: "Feeds" },
  { key: "settings", label: "Configurações" },
];

export function Nav({ page, onNavigate }: NavProps) {
  return (
    <header className="nav">
      <div className="nav-brand">📸 Postinsta</div>
      <nav>
        {items.map((item) => (
          <button
            key={item.key}
            className={item.key === page ? "nav-link active" : "nav-link"}
            onClick={() => onNavigate(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
