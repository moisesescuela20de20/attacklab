// Las banderas no están escritas en el código: se derivan de un secreto propio de cada
// instalación, generado al azar la primera vez y guardado en la base.
import { createHash, createHmac } from "node:crypto";
import type { Database } from "./db/database";

export const FLAG_SLUGS: Record<string, string> = {
  "sqli-login": "comillas_peligrosas",
  "xss-search": "script_reflejado",
  "weak-password": "diccionario_gana",
  "idor-profile": "cambia_el_id",
};

export function getFlagSecret(db: Database): string {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'flag_secret'").get() as { value: string } | undefined;
  if (!row) throw new Error("La base no tiene secreto de banderas.");
  return row.value;
}

export function flagFor(secret: string, challengeId: string): string {
  const slug = FLAG_SLUGS[challengeId] ?? challengeId;
  const suffix = createHmac("sha256", secret).update(challengeId).digest("hex").slice(0, 8);
  return `FLAG{${slug}_${suffix}}`;
}

export const sha256Hex = (text: string): string => createHash("sha256").update(text).digest("hex");
