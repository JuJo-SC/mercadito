# Envío de mensajes con Enter

Cambio: Enter envía tanto el primer mensaje desde una publicación como las respuestas de un hilo. Shift+Enter conserva la escritura de varias líneas. Ambos campos muestran una ayuda asociada mediante aria-describedby.

## Verificaciones realizadas

- Pruebas de `web/tests/submit-message-on-enter.test.mjs`: Enter, Shift+Enter, otras teclas, composición IME y keyCode 229 de Safari, tecla sostenida, solicitud pendiente y texto vacío.
- Lint, generación de tipos y TypeScript correctos; imagen de producción compilada con Docker Compose.
- Chromium con los dos componentes React reales, enlace y navegación de Next.js adaptados, y respuestas de API simuladas sin acceder a datos de producción. Anchos de 320, 390 y 1440px: Enter, salto de línea, composición, repetición, bloqueo mientras envía, conservación del texto ante fallo, reintento con el mismo clientRequestId y respuesta correcta. Sin desbordamiento horizontal ni errores del navegador.
- Capturas móvil y escritorio generadas en `.qa/`, fuera de Git; revisión visual de la ayuda en ambos formularios. Detector Impeccable sin hallazgos en los componentes modificados.
- DNS público, redirección HTTP a HTTPS y certificado del origen verificados antes de desplegar.

Para repetir las pruebas de teclado desde el servidor:

```sh
docker run --rm -v /srv/apps/mercadito/web:/app -w /app node:24-bookworm-slim node --test tests/submit-message-on-enter.test.mjs
```

Las pruebas de navegador usan respuestas simuladas; no se enviaron mensajes a estudiantes. No requiere migraciones ni cambios de proxy. El despliegue conserva `infra/uat/activation.compose.yml` y reemplaza únicamente el servicio web.
