// Hilo aislado para el reto de inyección SQL.
// Cada ejecución crea una base NUEVA en memoria con datos ficticios, ejecuta la consulta
// vulnerable y termina. Nunca tiene acceso a la base real de AttackLab.
import { parentPort, workerData } from "node:worker_threads";
import { createRequire } from "node:module";

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite");

const db = new DatabaseSync(":memory:");
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT);
  INSERT INTO users VALUES (1, 'admin', 'Zx9!qL2#vB7$', 'admin');
  INSERT INTO users VALUES (2, 'vendedor', 'Pixel2026', 'staff');
  INSERT INTO users VALUES (3, 'invitado', 'invitado', 'guest');
`);

try {
  const rows = db.prepare(workerData.query).all();
  parentPort.postMessage({ ok: true, rows });
} catch (err) {
  parentPort.postMessage({ ok: false, error: String(err && err.message ? err.message : err) });
} finally {
  db.close();
}
