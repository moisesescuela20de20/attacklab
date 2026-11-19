import { useState, type FormEvent } from "react";
import { api } from "../api";
import { FlagBox } from "../components/FlagBox";

export function WeakPasswordLab({ onFlag }: { onFlag: (f: string) => void }) {
  const [password, setPassword] = useState("");
  const [tries, setTries] = useState(0);
  const [result, setResult] = useState<{ success: boolean; message: string; flag?: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTries((t) => t + 1);
    try { setResult(await api("POST", "/labs/weak-password/login", { username: "admin", password })); }
    catch (err) { setResult({ success: false, message: (err as Error).message }); }
  }

  return (
    <div className="lab">
      <div className="lab-window">
        <div className="lab-bar"><span className="dot" /><span className="dot" /><span className="dot" /> gamertalk.local/login</div>
        <form className="lab-body" onSubmit={submit}>
          <h3>GamerTalk · Ingresar</h3>
          <label className="field"><span>Usuario</span><input value="admin" readOnly /></label>
          <label className="field"><span>Contraseña</span><input value={password} onChange={(e) => setPassword(e.target.value)} maxLength={120} autoComplete="off" /></label>
          <button className="btn primary">Ingresar</button>
          <p className="muted small">Intentos: {tries}</p>
        </form>
      </div>
      {result && <div className={`alert ${result.success ? "ok" : "warn"}`}>{result.message}</div>}
      {result?.flag && <FlagBox flag={result.flag} onUse={onFlag} />}
    </div>
  );
}
