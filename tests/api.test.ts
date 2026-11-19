// Tests de integración: levantan la API real (base SQLite en memoria) y le hacen pedidos HTTP.
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/server/app";
import { openDatabase, type Database } from "../src/server/db/database";
import { flagFor, getFlagSecret } from "../src/server/flags";

let server: Server;
let db: Database;
let base = "";
let token = "";

async function api(method: string, path: string, body?: unknown, auth = token) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
}
const login = async (email: string, password: string) => (await api("POST", "/auth/login", { email, password }, "")).body.token as string;

beforeAll(async () => {
  db = openDatabase(":memory:");
  server = createApp({ db, courseCode: "TEST-123" }).app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
afterAll(() => server.close());

describe("Autenticación", () => {
  test("login con contraseña incorrecta responde 401 y no da token", async () => {
    const r = await api("POST", "/auth/login", { email: "moises@attacklab.test", password: "mal" }, "");
    expect(r.status).toBe(401);
    expect(r.body.token).toBeUndefined();
  });

  test("login correcto devuelve un token de sesión", async () => {
    const r = await api("POST", "/auth/login", { email: "moises@attacklab.test", password: "Alumno#2026" }, "");
    expect(r.status).toBe(200);
    expect(r.body.user).toMatchObject({ name: "Moises Martinez", role: "student" });
    token = r.body.token;
  });

  test("después de 5 intentos fallidos el login se bloquea (429), incluso con la contraseña correcta", async () => {
    for (let i = 0; i < 5; i++) await api("POST", "/auth/login", { email: "ana@attacklab.test", password: `x${i}` }, "");
    const r = await api("POST", "/auth/login", { email: "ana@attacklab.test", password: "Alumna#2026" }, "");
    expect(r.status).toBe(429);
    expect(r.headers.get("retry-after")).toBeTruthy();
  });

  test("registro con código de curso incorrecto responde 400", async () => {
    const r = await api("POST", "/auth/register", { name: "Leo", email: "leo@test.com", password: "segura1234", courseCode: "OTRO" }, "");
    expect(r.status).toBe(400);
    expect(r.body.error.details.map((d: { field: string }) => d.field)).toContain("courseCode");
  });

  test("registro correcto crea la cuenta y devuelve sesión; repetir el correo da 409", async () => {
    const data = { name: "Leo", email: "leo@test.com", password: "segura1234", courseCode: "TEST-123" };
    const r = await api("POST", "/auth/register", data, "");
    expect(r.status).toBe(201);
    expect(r.body.user.role).toBe("student");
    expect((await api("POST", "/auth/register", data, "")).status).toBe(409);
  });

  test("sin token, los retos no se pueden ver (401)", async () => {
    expect((await api("GET", "/challenges", undefined, "")).status).toBe(401);
  });
});

describe("Retos", () => {
  test("el listado nunca incluye banderas ni hashes", async () => {
    const r = await api("GET", "/challenges");
    expect(r.body).toHaveLength(4);
    expect(JSON.stringify(r.body)).not.toMatch(/flag|FLAG\{/i);
  });

  test("el detalle muestra la misión y no la explicación hasta resolverlo", async () => {
    const r = await api("GET", "/challenges/sqli-login");
    expect(r.body.mission).toMatch(/PixelShop/);
    expect(r.body.explanation).toBeNull();
    expect(r.body.potentialPoints).toBe(100);
  });

  test("bandera vacía responde 400", async () => {
    expect((await api("POST", "/challenges/sqli-login/submissions", { flag: "  " })).status).toBe(400);
  });

  test("las banderas no están en el código: cada base genera las suyas", () => {
    const otra = openDatabase(":memory:");
    expect(flagFor(getFlagSecret(db), "sqli-login")).not.toBe(flagFor(getFlagSecret(otra), "sqli-login"));
  });
});

describe("Laboratorio: inyección SQL", () => {
  test("credenciales incorrectas no dan acceso y muestran la consulta ejecutada", async () => {
    const r = await api("POST", "/labs/sqli-login/login", { username: "admin", password: "1234" });
    expect(r.body.success).toBe(false);
    expect(r.body.query).toContain("WHERE username = 'admin'");
  });

  test("una comilla rompe la consulta y se ve el error de SQL (parte de la lección)", async () => {
    const r = await api("POST", "/labs/sqli-login/login", { username: "'", password: "x" });
    expect(r.body.message).toMatch(/Error de la base de datos/);
  });

  test("la inyección ' OR '1'='1' -- entra como admin y entrega la bandera", async () => {
    const r = await api("POST", "/labs/sqli-login/login", { username: "' OR '1'='1' --", password: "x" });
    expect(r.body.success).toBe(true);
    expect(r.body.flag).toMatch(/^FLAG\{comillas_peligrosas_[a-f0-9]{8}\}$/);
  });

  test("intentar borrar tablas no afecta a la base real de AttackLab", async () => {
    await api("POST", "/labs/sqli-login/login", { username: "x'; DROP TABLE users; --", password: "x" });
    expect((await api("GET", "/challenges")).status).toBe(200);
    expect(db.prepare("SELECT COUNT(*) AS n FROM users").get()).toMatchObject({ n: 4 });
  });

  test("una consulta infinita se corta por tiempo y el servidor sigue respondiendo", async () => {
    const payload = "' UNION SELECT 1,2,3 FROM (WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM r) SELECT n FROM r) --";
    const r = await api("POST", "/labs/sqli-login/login", { username: payload, password: "x" });
    expect(r.body.success).toBe(false);
    expect(r.body.message).toMatch(/tardó demasiado/);
    expect((await api("GET", "/health")).status).toBe(200);
  });
});

describe("Laboratorios: XSS, contraseña débil e IDOR", () => {
  test("XSS: texto normal no ejecuta nada; un onerror sí y muestra la bandera", async () => {
    const plain = await api("GET", "/labs/xss-search/search?q=" + encodeURIComponent("mouse"));
    expect(plain.body.executed).toBe(false);
    const xss = await api("GET", "/labs/xss-search/search?q=" + encodeURIComponent("<img src=x onerror=alert(1)>"));
    expect(xss.body.executed).toBe(true);
    expect(xss.body.html).toMatch(/FLAG\{script_reflejado_/);
  });

  test("contraseña débil: una incorrecta falla y 'dragon' entra", async () => {
    expect((await api("POST", "/labs/weak-password/login", { username: "admin", password: "123456" })).body.success).toBe(false);
    const ok = await api("POST", "/labs/weak-password/login", { username: "admin", password: "dragon" });
    expect(ok.body.flag).toMatch(/^FLAG\{diccionario_gana_/);
  });

  test("IDOR: el perfil propio (7) no tiene la nota; el 1 la expone", async () => {
    expect((await api("GET", "/labs/idor-profile/profiles/7")).body.privateNote).toBeUndefined();
    expect((await api("GET", "/labs/idor-profile/profiles/1")).body.privateNote).toMatch(/FLAG\{cambia_el_id_/);
  });
});

describe("Flujo completo y ranking", () => {
  test("la pista la cuenta el servidor y la bandera del laboratorio suma los puntos", async () => {
    const hint = await api("POST", "/challenges/sqli-login/hints");
    expect(hint.body.penalty).toBe(30);
    const flag = (await api("POST", "/labs/sqli-login/login", { username: "' OR 1=1 --", password: "" })).body.flag;
    const r = await api("POST", "/challenges/sqli-login/submissions", { flag, hintsUsed: 0 });
    expect(r.body).toMatchObject({ correct: true, points: 70 });
    expect(r.body.explanation).toMatch(/parametrizadas/);
  });

  test("resolver otra vez no vuelve a sumar y el ranking lo refleja", async () => {
    const flag = (await api("POST", "/labs/sqli-login/login", { username: "' OR 1=1 --", password: "" })).body.flag;
    expect((await api("POST", "/challenges/sqli-login/submissions", { flag })).body.points).toBe(0);
    expect((await api("GET", "/ranking")).body[0]).toMatchObject({ name: "Moises Martinez", total: 70 });
  });

  test("un alumno no puede ver el panel docente (403); el docente sí", async () => {
    expect((await api("GET", "/teacher/progress")).status).toBe(403);
    const teacher = await login("docente@attacklab.test", "Docente#2026");
    const r = await api("GET", "/teacher/progress", undefined, teacher);
    expect(r.status).toBe(200);
    expect(r.body.find((s: { name: string }) => s.name === "Moises Martinez")).toMatchObject({ points: 70, solved: 1 });
  });

  test("después del logout el token deja de servir", async () => {
    expect((await api("POST", "/auth/logout")).status).toBe(204);
    expect((await api("GET", "/challenges")).status).toBe(401);
  });
});
