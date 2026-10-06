# Verificación de Mensajes y Mis publicaciones

Fecha: 6 de octubre de 2026. Cambio de interfaz: `580e71f`, rama `feat/mensajes-publicaciones`.

## Alcance

La navegación móvil conserva Mis publicaciones. Mensajes identifica primero el producto y separa Ventas de Compras según el rol del estudiante, manteniendo turno de respuesta, actividad y sin leer. Mis publicaciones añade fotos propias, controles de 44px en dos columnas y grupos En venta, Borradores, Archivadas y Vendidas, con actualización de grupo sin recargar.

Apartar conserva su comportamiento de disponibilidad: pausa catálogo y nuevos hilos, mantiene conversaciones existentes y no registra una persona beneficiaria ni pagos. Las fotos privadas siguen restringidas por sesión y campus; los resúmenes construyen la URL a partir de la posición de la primera foto, sin incorporar sus bytes.

## Verificaciones previas al despliegue

- Lint, comprobación de tipos, compilación, `git diff --check` y validación de Compose completados correctamente.
- Detector de Impeccable ejecutado una vez en los objetivos modificados: resultado `[]`.
- Revisión independiente de las superficies, seguida de la corrección puntual del contraste de la etiqueta Publicado. La revisión de esa corrección confirmó una relación de contraste de 6.19:1 y disposición para publicar dentro del alcance revisado.
- Pruebas aisladas con los componentes reales y datos ficticios a 320px, 390px y 1440px: cambio Ventas/Compras, pertenencia de hilos por rol, enlace Editar, apartar, quitar apartado, vender, volver a publicar y archivar.
- Comprobado movimiento entre grupos sin recargar, conservación del estado ante una respuesta fallida, ausencia de desbordamiento horizontal y controles de al menos 44px.

## Límites de la revisión aislada

Las pruebas aisladas no utilizaron cuentas reales, no enviaron mensajes reales y no verificaron el endpoint privado de fotos mediante una sesión real de comprador. La autorización de ese endpoint se revisó en código; esa revisión no sustituye una prueba de sesión de extremo a extremo.

La página de revisión está en `.impeccable/review/accounts`, ignorada por Git. Usa datos ficticios y los indicadores de desarrollo se desactivaron únicamente en ese entorno de revisión. No se cambiaron base de datos ni infraestructura.

## Verificación posterior al despliegue

Resultados confirmados por el agente que realizó el despliegue del cambio `580e71f`:

- Servicio web reemplazado con la imagen `mercadito-web:580e71f` y healthcheck saludable. PostgreSQL y Keycloak continuaron saludables, con nueve días de actividad; Caddy permaneció intacto.
- Desde el exterior en Windows, HTTP respondió 308 hacia HTTPS; HTTPS respondió 200 con validación TLS correcta. `/api/health` devolvió `status: ok` y `database: ok`. El acceso HTTPS al origen respondió 200.
- Sin sesión, `/mensajes` respondió 307 hacia el acceso con `returnTo`; `/api/conversations` y `/api/listings/prueba/photo` respondieron 401.
- Logs de inicio normales y comprobación en el navegador de producción, tras recargar, de la etiqueta móvil Mis publicaciones.

Las respuestas sin sesión confirman ese límite de acceso; no cubren la autorización de fotos con una sesión real de comprador. Este documento registra el despliegue de la interfaz; el commit de documentación se publicará por separado.
