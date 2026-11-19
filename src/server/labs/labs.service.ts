// Laboratorios: las aplicaciones vulnerables SIMULADAS de cada reto.
// Son vulnerables a propósito, pero cada una trabaja con datos ficticios y aislados.
import { timingSafeEqual } from "node:crypto";
import { runSandboxQuery } from "./sql-sandbox";
import { flagFor } from "../flags";
import { validationError, notFound } from "../errors";

const MAX_INPUT = 120;

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length > MAX_INPUT) {
    throw validationError([{ field, message: `Debe ser texto de hasta ${MAX_INPUT} caracteres.` }]);
  }
  return value;
}

// Contraseña del admin del reto "Contraseña débil" (está en las listas de más usadas).
const WEAK_ADMIN_PASSWORD = "dragon";

// Datos ficticios de la red social del reto IDOR. El 7 es "el perfil del alumno".
const PROFILES: Record<number, { name: string; username: string; bio: string; privateNote?: string }> = {
  1: { name: "Administrador", username: "admin", bio: "Cuenta oficial de ChatUp.", privateNote: "__FLAG__" },
  2: { name: "Lucía Pérez", username: "lu_perez", bio: "Fan de los juegos de ritmo." },
  3: { name: "Tomás Ríos", username: "tomi", bio: "Programo bots de Discord." },
  4: { name: "Sofía Díaz", username: "sofi_d", bio: "Dibujo pixel art." },
  5: { name: "Bruno Sosa", username: "bsosa", bio: "Speedrunner." },
  6: { name: "Valen Ruiz", username: "valen", bio: "Estudiante de sistemas." },
};
export const OWN_PROFILE_ID = 7;

/** Detecta si el texto reflejado se ejecutaría como código en el navegador. */
const EXECUTABLE_HTML = /<\s*script\b|\bon[a-z]+\s*=|javascript:/i;

export function createLabsService(getSecret: () => string) {
  const flag = (id: string) => flagFor(getSecret(), id);

  return {
    /** Reto 1: login que arma el SQL pegando texto (vulnerable a propósito). */
    async sqliLogin(username: unknown, password: unknown) {
      const u = requireText(username, "username");
      const p = requireText(password, "password");
      const query = `SELECT id, username, role FROM users WHERE username = '${u}' AND password = '${p}'`;
      const result = await runSandboxQuery(query);
      if (!result.ok) return { success: false, query, message: `Error de la base de datos: ${result.error}` };
      const rows = result.rows ?? [];
      if (rows.length === 0) return { success: false, query, message: "Usuario o contraseña incorrectos." };
      const first = rows[0] as { username: string; role: string };
      if (first.role !== "admin") {
        return { success: false, query, message: `Entraste como "${first.username}", pero el panel es solo para administradores.` };
      }
      return { success: true, query, message: "Bienvenido al panel de administración.", flag: flag("sqli-login") };
    },

    /** Reto 2: buscador que refleja la búsqueda sin escapar. Devuelve el HTML para un iframe aislado. */
    xssSearch(q: unknown) {
      const text = requireText(q ?? "", "q");
      const executed = EXECUTABLE_HTML.test(text);
      const banner = executed
        ? `<div style="margin-top:16px;padding:12px;border-radius:8px;background:#e6f6ef;color:#14532d;font-family:monospace">XSS detectado: tu búsqueda se ejecutó como código.<br>Bandera: ${flag("xss-search")}</div>`
        : "";
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;padding:16px;color:#1f2433}h2{margin:0 0 8px}</style></head>
<body><h2>PixelShop · Buscador</h2><p>Resultados para: ${text}</p><p style="color:#777">No encontramos productos.</p>${banner}</body></html>`;
      return { html, executed };
    },

    /** Reto 3: login del admin con una contraseña de diccionario. */
    weakPassword(username: unknown, password: unknown) {
      const u = requireText(username, "username").trim().toLowerCase();
      const p = requireText(password, "password");
      const ok = u === "admin" && p.length === WEAK_ADMIN_PASSWORD.length &&
        timingSafeEqual(Buffer.from(p), Buffer.from(WEAK_ADMIN_PASSWORD));
      if (!ok) return { success: false, message: "Usuario o contraseña incorrectos." };
      return { success: true, message: "Bienvenido, admin.", flag: flag("weak-password") };
    },

    /** Reto 4: devuelve perfiles por número SIN verificar el dueño (vulnerable a propósito). */
    idorProfile(id: string, requesterName: string) {
      const n = Number(id);
      if (!Number.isInteger(n) || n < 1) throw validationError([{ field: "id", message: "El id debe ser un número entero positivo." }]);
      if (n === OWN_PROFILE_ID) return { id: n, name: requesterName, username: "vos", bio: "Este es tu perfil." };
      const profile = PROFILES[n];
      if (!profile) throw notFound("Perfil");
      const { privateNote, ...visible } = profile;
      return privateNote ? { id: n, ...visible, privateNote: `Nota privada: la bandera es ${flag("idor-profile")}` } : { id: n, ...visible };
    },
  };
}
export type LabsService = ReturnType<typeof createLabsService>;
