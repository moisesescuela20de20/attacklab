import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError, CATEGORY_LABEL, DIFFICULTY_LABEL, type ChallengeDetail } from "../api";
import { SqliLab } from "../labs/SqliLab";
import { XssLab } from "../labs/XssLab";
import { WeakPasswordLab } from "../labs/WeakPasswordLab";
import { IdorLab } from "../labs/IdorLab";

interface SubmitResult { correct: boolean; points: number; message: string; explanation?: string }

export function ChallengePage({ id }: { id: string }) {
  const [c, setC] = useState<ChallengeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flag, setFlag] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reload = useCallback(() => api<ChallengeDetail>("GET", `/challenges/${id}`).then(setC).catch((e: Error) => setError(e.message)), [id]);
  useEffect(() => { void reload(); }, [reload]);

  async function revealHint() {
    if (!c || c.nextHintPenalty === null) return;
    if (!window.confirm(`Esta pista resta ${c.nextHintPenalty} puntos. ¿La querés ver?`)) return;
    await api("POST", `/challenges/${id}/hints`);
    await reload();
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setSubmitError(null);
    try {
      const r = await api<SubmitResult>("POST", `/challenges/${id}/submissions`, { flag });
      setResult(r);
      if (r.correct) await reload();
    } catch (err) { setSubmitError(err instanceof ApiError ? err.message : "No se pudo enviar."); }
  }

  const applyFlag = (f: string) => { setFlag(f); document.getElementById("flag-input")?.focus(); };

  if (error) return <div className="alert error">{error} <a href="#/retos">Volver a los retos</a></div>;
  if (!c) return <p className="muted">Cargando reto…</p>;

  return (
    <>
      <a href="#/retos" className="back">← Retos</a>
      <div className="page-head">
        <div>
          <div className="row gap">
            <span className={`tag cat-${c.category}`}>{CATEGORY_LABEL[c.category]}</span>
            <span className={`tag diff-${c.difficulty}`}>{DIFFICULTY_LABEL[c.difficulty]}</span>
            {c.solved && <span className="tag ok">✓ Resuelto</span>}
          </div>
          <h1>{c.title}</h1>
        </div>
        <div className="points"><strong>{c.solved ? "✓" : c.potentialPoints}</strong><span className="muted small">{c.solved ? "resuelto" : `de ${c.points} pts`}</span></div>
      </div>

      <div className="layout">
        <section>
          <div className="card mission"><h2>Misión</h2><p>{c.mission}</p></div>
          <div className="card">
            <h2>Laboratorio</h2>
            {id === "sqli-login" && <SqliLab onFlag={applyFlag} />}
            {id === "xss-search" && <XssLab />}
            {id === "weak-password" && <WeakPasswordLab onFlag={applyFlag} />}
            {id === "idor-profile" && <IdorLab />}
          </div>
          {c.explanation && <div className="card explanation"><h2>🛡️ Cómo se corrige</h2><p>{c.explanation}</p></div>}
        </section>

        <aside>
          <form className="card" onSubmit={submit}>
            <h2>Enviar bandera</h2>
            <input id="flag-input" placeholder="FLAG{...}" value={flag} onChange={(e) => setFlag(e.target.value)} maxLength={200} required />
            <button className="btn primary block">Enviar</button>
            {submitError && <div className="alert error">{submitError}</div>}
            {result && <div className={`alert ${result.correct ? "ok" : "warn"}`}>{result.message}</div>}
          </form>
          <div className="card">
            <h2>Pistas</h2>
            {c.hints.length === 0 && <p className="muted small">Todavía no usaste pistas.</p>}
            <ol className="hints">{c.hints.map((h) => <li key={h.position}>{h.text} <span className="muted small">(−{h.penalty})</span></li>)}</ol>
            {c.nextHintPenalty !== null && !c.solved
              ? <button className="btn ghost block" onClick={revealHint}>Ver pista {c.hints.length + 1} de {c.totalHints} (−{c.nextHintPenalty} pts)</button>
              : <p className="muted small">{c.solved ? "Reto resuelto." : "No quedan pistas."}</p>}
          </div>
        </aside>
      </div>
    </>
  );
}
