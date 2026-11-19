# Decisiones de seguridad de AttackLab

AttackLab tiene una particularidad: **una parte del sistema es vulnerable a propósito** (los laboratorios). Por eso el diseño separa con cuidado lo que se puede atacar de lo que no.

## 1. Laboratorios aislados

| Laboratorio | Riesgo si no se aislara | Cómo se aísla |
| --- | --- | --- |
| Inyección SQL | La consulta inyectada podría leer o borrar la base real, o colgar el servidor con una consulta infinita | Se ejecuta en un `Worker` (hilo separado) con una base `:memory:` nueva y datos ficticios. Tiempo máximo: 300 ms, memoria máxima: 32 MB. Al terminar, el hilo se destruye. |
| XSS | El script del alumno podría robar la sesión de AttackLab | El HTML se muestra en un `iframe` con `sandbox="allow-scripts"` y **sin** `allow-same-origin`: corre en un origen aislado y no accede a `sessionStorage`, cookies ni al DOM de la app. |
| Contraseña débil | Ninguno: es una cuenta ficticia | La comparación es en tiempo constante; el laboratorio tiene límite de pedidos. |
| IDOR | Exponer datos reales | Los perfiles son datos ficticios en memoria; el laboratorio no consulta la tabla `users`. |

Todos los laboratorios exigen sesión iniciada y tienen un límite de 120 pedidos por minuto por usuario.

## 2. Banderas

- **No están escritas en el código.** Cada instalación genera un secreto aleatorio de 256 bits la primera vez y cada bandera se deriva con HMAC-SHA256 del secreto y el id del reto.
- En la tabla `challenges` solo se guarda el **hash SHA-256** de la bandera.
- La comparación al enviar una bandera es en **tiempo constante** (`timingSafeEqual`).
- El listado y el detalle de retos nunca devuelven banderas ni hashes (hay un test que lo verifica).

## 3. Autenticación

- Contraseñas con **scrypt** y sal aleatoria. La verificación es **asíncrona**, para no bloquear el servidor.
- **Bloqueo tras 5 intentos fallidos** por correo durante 15 minutos (respuesta 429 con `Retry-After`).
- Si el correo no existe, igual se calcula un hash de relleno: **el tiempo de respuesta no revela qué correos existen**.
- Tokens de sesión aleatorios de 256 bits, que vencen a las 8 horas. El logout los invalida de inmediato y las sesiones vencidas se limpian cada 10 minutos.
- El token se guarda en `sessionStorage`, así que se borra al cerrar la pestaña. React escapa todo lo que muestra; el único HTML sin escapar es el del laboratorio XSS, que está aislado en su `iframe`.
- Registro solo con **código de curso**, con límite de 10 registros por hora por IP.

## 4. Permisos

- El servidor lleva la cuenta de las pistas usadas. Si el cliente envía `hintsUsed`, se ignora (esta decisión se documentó en la Actividad de la Clase 4).
- El panel docente exige rol `teacher` (respuesta 403 para alumnos, verificada por tests).

## 5. Datos y despliegue

- Todas las consultas a la base real son **parametrizadas** y están solo en `repositories/`.
- La carga inicial corre dentro de una **transacción**: si se corta, no queda una base a medias.
- Índice en `attempts (user_id, challenge_id, correct)` para que las consultas no recorran toda la tabla.
- Por defecto el servidor escucha solo en `127.0.0.1`. Para abrirlo a la red hay que configurar `HOST` explícitamente.
- Los usuarios demo se desactivan en producción (`NODE_ENV=production`). El docente inicial se configura con variables de entorno.
- Cuerpo de los pedidos limitado a 10 kb y encabezados `X-Content-Type-Options`, `X-Frame-Options` y `Referrer-Policy`.

## Pendientes conocidos

- Las sesiones y los límites de intentos viven en memoria: al reiniciar el servidor hay que volver a iniciar sesión, y no sirve para varias instancias.
- No hay HTTPS propio. En un despliegue real debe ir detrás de un proxy con TLS.
- El panel docente es de solo lectura; crear y editar retos desde la interfaz queda como mejora futura.
