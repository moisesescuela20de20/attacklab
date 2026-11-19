import { useState, type FormEvent } from "react";
import { api } from "../api";
import { FlagBox } from "../components/FlagBox";

interface Result { success: boolean; query: string; message: string; flag?: string }

export function SqliLab({ onFlag }: { onFlag: (f: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try { setResult(await api<Result>("POST", "/labs/sqli-login/login", { username, password })); }
    catch (err) { setResult({ success: false, query: "", message: (err as Error).message }); }
    finally { setBusy(false); }
  }

  return (
    <div className="lab">
      <div className="lab-window">
        <div className="lab-bar"><span className="dot" /><span className="dot" /><span className="dot" /> pixelshop.local/admin</div>
        <form className="lab-body" onSubmit={submit}>
          <h3>PixelShop · Panel de administración</h3>
          <label className="field"><span>Usuario</span><input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={120} /></label>
          <label className="field"><span>Contraseña</span><input value={password} onChange={(e) => setPassword(e.target.value)} maxLength={120} type="text" /></label>
          <button className="btn primary" disabled={busy}>{busy ? "Ingresando…" : "Ingresar"}</button>
        </form>
      </div>
      {result && (
        <div className="lab-output">
          {result.query && <><span className="muted small">Consulta que ejecutó el servidor:</span><pre className="code">{result.query}</pre></>}
          <div className={`alert ${result.success ? "ok" : "warn"}`}>{result.message}</div>
          {result.flag && <FlagBox flag={result.flag} onUse={onFlag} />}
        </div>
      )}
    </div>
  );
}
