# Soluciones de los retos (para el docente)

> ⚠️ **Spoilers.** Este archivo resuelve todos los retos. Las banderas no aparecen acá porque cambian en cada instalación.

## Inyección SQL en un login falso (100 pts)
En **Usuario** escribir `' OR '1'='1' --` y cualquier cosa en **Contraseña**. La consulta queda
`... WHERE username = '' OR '1'='1' --' AND password = '...'`: la condición siempre es verdadera, el resto queda comentado y la primera fila es la del admin.

## XSS reflejado en un buscador (150 pts)
Buscar `<img src=x onerror=alert(1)>` (o `<script>alert(1)</script>`). El texto se inserta sin escapar y el navegador lo ejecuta dentro del marco aislado; el resultado muestra la bandera.

## Contraseña débil (80 pts)
La contraseña del usuario `admin` es `dragon`, una de las más usadas según las listas anuales.

## Control de acceso roto en perfiles (120 pts)
El pedido carga el perfil 7 (el propio). Cambiar el número a `1` muestra el perfil del administrador con su nota privada, que contiene la bandera.
