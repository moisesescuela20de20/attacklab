// Cliente de la API. El token se guarda en sessionStorage: se borra al cerrar la pestaña.
export interface User { id: number; name: string; role: "student" | "teacher" }
export interface ChallengeSummary { id: string; title: string; category: string; difficulty: string; points: number; totalHints: number; solved: boolean }
export interface ChallengeDetail extends ChallengeSummary {
  mission: string;
  hints: { position: number; text: string; penalty: number }[];
  nextHintPenalty: number | null;
  potentialPoints: number;
  explanation: string | null;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: { field: string; message: string }[]) { super(message); }
}

const TOKEN_KEY = "attacklab_token";
export const session = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (t: string) => sessionStorage.setItem(TOKEN_KEY, t),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = session.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    const err = (data as { error?: { message?: string; details?: { field: string; message: string }[] } }).error;
    throw new ApiError(res.status, err?.message ?? "Error de conexión.", err?.details);
  }
  return data as T;
}

export const CATEGORY_LABEL: Record<string, string> = {
  "sql-injection": "Inyección SQL", xss: "XSS", passwords: "Contraseñas", "access-control": "Control de acceso",
};
export const DIFFICULTY_LABEL: Record<string, string> = { easy: "Fácil", medium: "Media", hard: "Difícil" };
