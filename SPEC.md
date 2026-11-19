# SPEC — AttackLab

**Objetivo:** laboratorio web donde estudiantes practican técnicas de ataque y defensa sobre aplicaciones vulnerables **simuladas y aisladas**, de forma legal, guiada y medible.

**Usuarios:** alumnos de escuelas técnicas (resuelven retos) y docentes (siguen el progreso del curso).

## Funcionalidades
1. Registro de alumnos con código de curso; inicio y cierre de sesión con roles.
2. Catálogo de retos con búsqueda y filtros por categoría y dificultad.
3. Cuatro laboratorios simulados: inyección SQL, XSS reflejado, contraseña débil e IDOR.
4. Envío de bandera: se compara su hash SHA-256 con el guardado.
5. Pistas progresivas con penalización; el servidor lleva la cuenta.
6. Explicación defensiva al resolver.
7. Ranking del curso y panel docente con el progreso de cada alumno.

## Reglas de puntaje
- Bandera vacía o de más de 200 caracteres: se rechaza sin registrar intento.
- Bandera incorrecta: se registra el intento fallido y no suma.
- Bandera correcta: puntos del reto menos la penalización de cada pista desbloqueada; nunca menos del 20 %.
- Un reto ya resuelto no vuelve a sumar puntos.

## Restricciones
- Ningún laboratorio puede afectar la base real ni hacer pedidos de red.
- Banderas y contraseñas solo como hash; las banderas no están en el código.
- TypeScript estricto, sin `any`. Consultas parametrizadas fuera de los laboratorios.
- Interfaz en español, usable desde el navegador del aula.

## Tecnología
TypeScript · Node.js 22 + Express · SQLite (`node:sqlite`) · React + Vite · Vitest.
