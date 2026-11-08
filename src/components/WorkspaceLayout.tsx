import type { ReactNode } from "react";
import type { Profile } from "../types";

type WorkspaceLayoutProps = {
  profile: Profile;
  projectCount: number;
  myTaskCount: number;
  view: "projects" | "mine";
  pageTitle: string;
  children: ReactNode;
  onNavigate: (view: "projects" | "mine") => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
};

export function WorkspaceLayout({
  profile,
  projectCount,
  myTaskCount,
  view,
  pageTitle,
  children,
  onNavigate,
  onOpenProfile,
  onSignOut,
}: WorkspaceLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">с</span>
          <span>
            строй<span className="brand-soft">контроль</span>
          </span>
        </div>

        <div className="workspace-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav>
          <button
            className={view === "projects" ? "nav-item active" : "nav-item"}
            onClick={() => onNavigate("projects")}
          >
            <span>▦</span> Объекты{" "}
            <span className="nav-count">{projectCount}</span>
          </button>
          {profile.role === "executor" && (
            <button
              className={view === "mine" ? "nav-item active" : "nav-item"}
              onClick={() => onNavigate("mine")}
            >
              <span>✓</span> Мои задачи{" "}
              <span className="nav-count">{myTaskCount}</span>
            </button>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">
            {profile.full_name.slice(0, 1) || "П"}
          </div>
          <button
            className="profile-trigger"
            onClick={onOpenProfile}
            aria-label="Открыть профиль"
          >
            <div className="profile-meta">
              <b>{profile.full_name}</b>
              <small>
                {profile.role === "manager" ? "Постановщик" : "Исполнитель"}
              </small>
            </div>
          </button>
          <button
            className="signout"
            onClick={onSignOut}
            title="Выйти из приложения"
          >
            ↗ <span>Выйти</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="crumb">Рабочее пространство</span>
            <span className="crumb-sep">/</span>
            <strong>{pageTitle}</strong>
          </div>
          <div className="top-right">
            <span className="online-dot" /> Все системы работают
            <button
              className="top-avatar"
              onClick={onOpenProfile}
              aria-label="Открыть профиль"
            >
              {profile.full_name.slice(0, 1) || "П"}
            </button>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
