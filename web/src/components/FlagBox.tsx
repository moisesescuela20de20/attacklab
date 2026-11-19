import { useState } from "react";

/** Muestra una bandera encontrada con un botón para usarla. */
export function FlagBox({ flag, onUse }: { flag: string; onUse: (flag: string) => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(flag); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* sin portapapeles */ }
  };
  return (
    <div className="flagbox">
      <span>🚩 Bandera encontrada:</span>
      <code>{flag}</code>
      <div className="row gap">
        <button type="button" className="btn small" onClick={copy}>{copied ? "Copiada" : "Copiar"}</button>
        <button type="button" className="btn primary small" onClick={() => onUse(flag)}>Usar esta bandera</button>
      </div>
    </div>
  );
}
