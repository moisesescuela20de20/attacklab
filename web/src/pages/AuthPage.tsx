import { useState, type FormEvent } from "react";
import { api, ApiError, type User } from "../api";

type Mode = "login" | "register";

export function AuthPage({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", courseCode: "" });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setFieldErrors({});
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login" ? { email: form.email, password: form.password } : form;
      const r = await api<{ token: string; user: User }>("POST", path, body);
      onLogin(r.token, r.user);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(Object.fromEntries((err.details ?? []).map((d) => [d.field, d.message])));
      } else setError("No se pudo conectar con el servidor.");
    } finally { setBusy(false); }
  }

  const field = (k: keyof typeof form, label: string, type = "text", extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={form[k]} onChange={set(k)} required {...extra} />
      {fieldErrors[k] && <small className="error-text">{fieldErrors[k]}</small>}
    </label>
  );

  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="brand big"><span className="logo">⛨</span> AttackLab</div>
        <h1>Aprendé seguridad <span className="accent">atacando</span>, sin romper nada real.</h1>
        <p className="muted">Retos de inyección SQL, XSS, contraseñas débiles y control de acceso sobre aplicaciones simuladas y aisladas. Cada reto termina explicando cómo se corrige la vulnerabilidad.</p>
        <ul className="hero-list">
          <li>🧪 Laboratorios vulnerables a propósito, sin acceso a sistemas reales</li>
          <li>💡 Pistas progresivas que restan puntos</li>
          <li>🏆 Ranking del curso y panel para el docente</li>
        </ul>
      </section>
      <form className="card auth-card" onSubmit={submit}>
        <div className="tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Ingresar</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Crear cuenta</button>
        </div>
        {mode === "register" && field("name", "Nombre", "text", { maxLength: 60, autoComplete: "name" })}
        {field("email", "Correo", "email", { autoComplete: "email" })}
        {field("password", "Contraseña", "password", { minLength: mode === "register" ? 8 : undefined, autoComplete: mode === "login" ? "current-password" : "new-password" })}
        {mode === "register" && field("courseCode", "Código de curso (te lo da tu docente)", "text")}
        {error && <div className="alert error">{error}</div>}
        <button className="btn primary block" disabled={busy}>{busy ? "Procesando…" : mode === "login" ? "Ingresar" : "Crear cuenta"}</button>
        {mode === "login" && <p className="muted small demo">Demo: <code>moises@attacklab.test</code> / <code>Alumno#2026</code></p>}
      </form>
    </div>
  );
}
