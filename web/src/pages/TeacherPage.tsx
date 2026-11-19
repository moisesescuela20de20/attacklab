import { useEffect, useState } from "react";
import { api } from "../api";

interface Row { id: number; name: string; email: string; points: number; solved: number; attempts: number }

export function TeacherPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<Row[]>("GET", "/teacher/progress").then(setRows).catch((e: Error) => setError(e.message)); }, []);
  const total = rows?.length ?? 0;
  const active = rows?.filter((r) => r.attempts > 0).length ?? 0;
  return (
    <>
      <div className="page-head"><div><h1>Panel docente</h1><p className="muted">Progreso de cada alumno del curso.</p></div></div>
      {error && <div className="alert error">{error}</div>}
      {rows && (
        <div className="stats">
          <div className="card stat"><span className="muted small">Alumnos</span><strong>{total}</strong></div>
          <div className="card stat"><span className="muted small">Con actividad</span><strong>{active}</strong></div>
          <div className="card stat"><span className="muted small">Retos resueltos</span><strong>{rows.reduce((s, r) => s + r.solved, 0)}</strong></div>
        </div>
      )}
      <div className="card">
        {!rows ? <p className="muted">Cargando…</p> : (
          <table className="table">
            <thead><tr><th>Alumno</th><th>Correo</th><th className="num">Resueltos</th><th className="num">Intentos</th><th className="num">Puntos</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}><td>{r.name}</td><td className="muted">{r.email}</td><td className="num">{r.solved}</td><td className="num">{r.attempts}</td><td className="num">{r.points}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
