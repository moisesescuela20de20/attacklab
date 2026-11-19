import { useEffect, useState } from "react";
import { api, session, setUnauthorizedHandler, type User } from "./api";
import { useRoute, go } from "./router";
import { AuthPage } from "./pages/AuthPage";
import { ChallengesPage } from "./pages/ChallengesPage";
import { ChallengePage } from "./pages/ChallengePage";
import { RankingPage } from "./pages/RankingPage";
import { TeacherPage } from "./pages/TeacherPage";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(session.get()));
  const route = useRoute();

  useEffect(() => {
    setUnauthorizedHandler(() => { session.clear(); setUser(null); });
    if (!session.get()) return;
    api<User>("GET", "/auth/me").then(setUser).catch(() => session.clear()).finally(() => setLoading(false));
  }, []);

  const onLogin = (token: string, u: User) => { session.set(token); setUser(u); go(u.role === "teacher" ? "/docente" : "/retos"); };
  const logout = async () => { await api("POST", "/auth/logout").catch(() => {}); session.clear(); setUser(null); go("/"); };

  if (loading) return <div className="center muted">Cargando…</div>;
  if (!user) return <AuthPage onLogin={onLogin} />;

  const [section = "retos", id] = route;
  const nav = (path: string, label: string, key: string) => (
    <a href={`#${path}`} className={section === key ? "active" : ""}>{label}</a>
  );

  return (
    <div className="shell">
      <header className="topbar">
        <a href="#/retos" className="brand"><span className="logo">⛨</span> AttackLab</a>
        <nav>
          {nav("/retos", "Retos", "retos")}
          {nav("/ranking", "Ranking", "ranking")}
          {user.role === "teacher" && nav("/docente", "Panel docente", "docente")}
        </nav>
        <div className="userbox">
          <span className="muted">{user.name}{user.role === "teacher" ? " · Docente" : ""}</span>
          <button className="btn ghost small" onClick={logout}>Salir</button>
        </div>
      </header>
      <main className="content">
        {section === "retos" && !id && <ChallengesPage />}
        {section === "retos" && id && <ChallengePage key={id} id={id} />}
        {section === "ranking" && <RankingPage />}
        {section === "docente" && (user.role === "teacher" ? <TeacherPage /> : <p>No tenés acceso a esta sección.</p>)}
      </main>
      <footer className="footer muted">AttackLab · Todos los ataques son simulados y aislados. Practicá solo en entornos autorizados.</footer>
    </div>
  );
}
