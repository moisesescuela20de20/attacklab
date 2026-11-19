// Hash de contraseñas con scrypt (módulo crypto de Node, sin dependencias externas).
// La verificación es asíncrona para no bloquear el servidor mientras calcula.
import { randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const KEY_LENGTH = 64;
const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

/** Versión síncrona: solo para la carga inicial de datos, al arrancar. */
export function hashPasswordSync(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, KEY_LENGTH).toString("hex")}`;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await scryptAsync(password, salt, KEY_LENGTH)).toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await scryptAsync(password, salt, KEY_LENGTH);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Hash de relleno: se verifica contra él cuando el correo no existe, para que el tiempo
 *  de respuesta no revele qué correos están registrados. */
export const DUMMY_HASH = hashPasswordSync(randomBytes(16).toString("hex"));
