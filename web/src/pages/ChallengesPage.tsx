import { useEffect, useMemo, useState } from "react";
import { api, CATEGORY_LABEL, DIFFICULTY_LABEL, type ChallengeSummary } from "../api";

export function ChallengesPage() {
  const [items, setItems] = useState<ChallengeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  useEffect(() => { api<ChallengeSummary[]>("GET", "/challenges").then(setItems).catch((e: Error) => setError(e.message)); }, []);

  const filtered = useMemo(() => (items ?? []).filter((c) =>
    (category === "all" || c.category === category) &&
    (difficulty === "all" || c.difficulty === difficulty) &&
    c.title.toLowerCase().includes(q.trim().toLowerCase())), [items, q, category, difficulty]);

  const solved = items?.filter((c) => c.solved).length ?? 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Retos</h1>
          <p className="muted">Elegí un reto, encontrá la bandera en el laboratorio y enviala para sumar puntos.</p>
        </div>
        {items && <div className="progress-pill">{solved} / {items.length} resueltos</div>}
      </div>
      <div className="filters">
        <input placeholder="Buscar por título…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoría">
          <option value="all">Todas las categorías</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Dificultad">
          <option value="all">Todas las dificultades</option>
          {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {error && <div className="alert error">{error}</div>}
      {!items && !error && <p className="muted">Cargando retos…</p>}
      <div className="grid">
        {filtered.map((c) => (
          <a key={c.id} href={`#/retos/${c.id}`} className={`card challenge-card ${c.solved ? "solved" : ""}`}>
            <div className="row between">
              <span className={`tag cat-${c.category}`}>{CATEGORY_LABEL[c.category] ?? c.category}</span>
              {c.solved ? <span className="tag ok">✓ Resuelto</span> : <span className={`tag diff-${c.difficulty}`}>{DIFFICULTY_LABEL[c.difficulty]}</span>}
            </div>
            <h3>{c.title}</h3>
            <div className="row between muted small">
              <span>{c.points} puntos</span>
              <span>{c.totalHints} {c.totalHints === 1 ? "pista" : "pistas"}</span>
            </div>
          </a>
        ))}
      </div>
      {items && filtered.length === 0 && <p className="muted">No hay retos con esos filtros.</p>}
    </>
  );
}
