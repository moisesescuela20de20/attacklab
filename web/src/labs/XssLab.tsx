import { useState, type FormEvent } from "react";
import { api } from "../api";

export function XssLab() {
  const [q, setQ] = useState("");
  const [html, setHtml] = useState<string | null>(null);
  const [executed, setExecuted] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await api<{ html: string; executed: boolean }>("GET", `/labs/xss-search/search?q=${encodeURIComponent(q)}`);
    setHtml(r.html); setExecuted(r.executed);
  }

  return (
    <div className="lab">
      <form className="row gap" onSubmit={submit}>
        <input className="grow" placeholder="Buscar productos en PixelShop…" value={q} onChange={(e) => setQ(e.target.value)} maxLength={120} />
        <button className="btn primary">Buscar</button>
      </form>
      {html !== null && (
        <>
          <p className="muted small">Resultado (se muestra en un marco aislado: lo que se ejecute ahí no puede acceder a AttackLab):</p>
          {/* sandbox sin allow-same-origin: la página vulnerable corre en un origen aislado. */}
          <iframe className="lab-frame" title="Resultado del buscador" sandbox="allow-scripts" srcDoc={html} />
          {executed && <div className="alert ok">¡Tu búsqueda se ejecutó como código! Copiá la bandera que aparece en el resultado.</div>}
        </>
      )}
    </div>
  );
}
