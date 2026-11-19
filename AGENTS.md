# AGENTS.md — AttackLab

## Project
Laboratorio web educativo de seguridad informática. Ver `SPEC.md`. Una parte del sistema es
vulnerable **a propósito** (`src/server/labs/`); el resto debe ser seguro.

## Commands
- Instalar: `npm install`
- Desarrollo: `npm run dev:api` y `npm run dev:web`
- Tests: `npm test` · Tipos: `npm run typecheck` · Build: `npm run build`

## Code Style
- Código en inglés; textos para el usuario en español.
- TypeScript estricto. Prohibido `any`.
- Arquitectura en capas: routes → controllers → services → repositories. SQL solo en repositories.
- Funciones cortas, una responsabilidad por función.

## Agent Behavior
**Puede:** proponer y aplicar refactorings con tests, agregar tests, mejorar la interfaz.

**No puede sin permiso:**
- Tocar `src/server/labs/` (las vulnerabilidades son intencionales; cambiar el aislamiento es crítico).
- Cambiar reglas de puntaje, la derivación de banderas o la forma de guardar contraseñas.
- Agregar dependencias.
- Desactivar o relajar validaciones, límites de intentos o permisos.
