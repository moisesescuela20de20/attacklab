import { useEffect, useState } from "react";
import { api } from "../api";

export function RankingPage() {
  const [rows, setRows] = useState<{ userId: number; name: string; total: number }[] | null>(null);
  useEffect(() => { api<typeof rows>("GET", "/ranking").then(setRows).catch(() => setRows([])); }, []);
  return (
    <>
      <div className="page-head"><div><h1>Ranking del curso</h1><p className="muted">Puntos de los retos resueltos. Las pistas restan puntos.</p></div></div>
      <div className="card">
        {!rows ? <p className="muted">Cargando…</p> : rows.length === 0 ? <p className="muted">Todavía nadie resolvió un reto. ¡Podés ser el primero!</p> : (
          <table className="table">
            <thead><tr><th>#</th><th>Alumno</th><th className="num">Puntos</th></tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={r.userId}><td>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td><td>{r.name}</td><td className="num">{r.total}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
