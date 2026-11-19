import { useEffect, useState } from "react";
import { api } from "../api";

export function IdorLab() {
  const [id, setId] = useState("7");
  const [response, setResponse] = useState<string>("");

  async function load(target: string) {
    try { setResponse(JSON.stringify(await api("GET", `/labs/idor-profile/profiles/${encodeURIComponent(target)}`), null, 2)); }
    catch (err) { setResponse(`Error: ${(err as Error).message}`); }
  }
  useEffect(() => { void load("7"); }, []);

  return (
    <div className="lab">
      <p className="muted small">ChatUp carga tu perfil con este pedido. Podés modificarlo:</p>
      <form className="row gap request" onSubmit={(e) => { e.preventDefault(); void load(id); }}>
        <code>GET /api/labs/idor-profile/profiles/</code>
        <input className="id-input" value={id} onChange={(e) => setId(e.target.value)} aria-label="Número de perfil" />
        <button className="btn primary small">Enviar</button>
      </form>
      <span className="muted small">Respuesta del servidor:</span>
      <pre className="code">{response || "…"}</pre>
    </div>
  );
}
