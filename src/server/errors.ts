// Errores de la aplicación: cada uno sabe qué código HTTP le corresponde.
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: { field: string; message: string }[],
    public readonly retryAfter?: number,
  ) {
    super(message);
  }
}

export const validationError = (details: { field: string; message: string }[]): AppError =>
  new AppError(400, "VALIDATION_ERROR", "Los datos enviados no son válidos.", details);
export const unauthorized = (message = "Tenés que iniciar sesión."): AppError =>
  new AppError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "No tenés permiso para hacer esto."): AppError =>
  new AppError(403, "FORBIDDEN", message);
export const notFound = (what: string): AppError => new AppError(404, "NOT_FOUND", `${what} no encontrado.`);
export const conflict = (message: string): AppError => new AppError(409, "CONFLICT", message);
export const tooManyRequests = (retryAfter: number): AppError =>
  new AppError(429, "TOO_MANY_REQUESTS", `Demasiados intentos. Probá de nuevo en ${retryAfter} segundos.`, undefined, retryAfter);
