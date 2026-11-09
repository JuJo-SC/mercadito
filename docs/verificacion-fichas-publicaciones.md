# Verificación de tarjetas y ficha de publicaciones

El propietario aprobó la propuesta privada y su refinamiento móvil el 21 de octubre de 2026 y solicitó aplicarlos a la web. La implementación conserva catálogo, permisos, fechas, galería y contacto reales.

## Alcance

- Tarjeta con precio, título, condición y fila de autor/fecha; sin etiquetas repetidas.
- Ficha con descripción completa, condición única y datos secundarios desplegables.
- Foto móvil de 220px (284px con galería) que se reduce a 72px al desplazar, con miniatura ampliable.
- Movimiento reducido con foto compacta fija, alternativa sin fotos y ampliación accesible mediante diálogo nativo.
- Formulario inicial compacto que conserva validación, contador, Enter, Shift+Enter y la protección de reintentos.

## Comprobaciones en Oracle

~~~sh
docker compose -f compose.yml -f infra/uat/activation.compose.yml config --quiet
docker run --rm -v /srv/apps/mercadito/web:/app -w /app node:24-bookworm-slim npm run lint
docker run --rm -v /srv/apps/mercadito/web:/app -w /app node:24-bookworm-slim npm run typecheck
docker build --target runner -t mercadito-web:fichas-candidato ./web
MERCADITO_TEST_IMAGE=mercadito-web:fichas-candidato MERCADITO_TEST_OUTPUT=listing-details-implementation MERCADITO_CHECK_LISTING_DETAILS=1 python3 infra/uat/test-session-surfaces.py
~~~

La prueba usa red Docker interna, PostgreSQL temporal y sesiones ficticias. Las fotos PNG se generan en memoria solo para esa base. Revisa la imagen real candidata en escritorio, móvil, móvil corto, 320px y movimiento reducido. Comprueba geometría estable al desplazar y volver, ampliación, Escape, cinco fotos, falta de fotos, datos secundarios y composición de mensajes. El recorrido existente conserva filtros, publicación, edición, conversaciones y privacidad de perfiles.

Los registros y capturas se guardan en .opendesign/artifacts/listing-details-implementation/, fuera de Git. No hay cambios de esquema ni migraciones nuevas. La imagen básica de typecheck conserva el aviso conocido de OpenSSL; la compilación de producción utiliza su dependencia instalada.

## Resultado

Lint, tipos, Compose y compilación de producción correctos. La suite aislada pasó las 18 combinaciones de pantalla y tamaño de las superficies con sesión, los recorridos de filtros, publicación, edición y mensajes, y las verificaciones HTTP de privacidad.

La ficha pasó cinco variantes: escritorio, móvil de 390px, móvil de poca altura, 320px y movimiento reducido. Se comprobaron cinco fotos, ampliación y Escape, falta de fotos, apertura de información secundaria y composición de mensajes. En la pantalla corta la foto alcanzó exactamente 48px y regresó a 196px al volver arriba, sin desbordamientos ni errores JavaScript. El título compacto no se superpone a la imagen durante la transición.

La revisión visual confirmó la ficha en escritorio y móvil. Se corrigió la interceptación del clic por la capa de las flechas; el cierre nativo se verifica esperando su evento y desmontaje. La fecha usa America/Mexico_City para mantener la misma representación entre servidor y navegador. El detector de diseño local no se ejecuta sobre el código porque este proyecto solo admite herramientas y pruebas en Oracle; se verificaron directamente contraste, foco, geometría, controles táctiles y movimiento reducido.

La petición del propietario incluye aplicar los cambios a la web. El despliegue reemplaza únicamente el servicio web con la imagen candidata validada, sin migraciones ni cambios en las redes, secretos, Caddy o autenticación.


## Corrección de fidelidad al ejemplo

El propietario indicó que la ficha publicada dejaba demasiado espacio vacío y una foto pequeña. La versión anterior fijaba la foto móvil en 196px y forzaba una hoja de toda la altura de la pantalla. La corrección recupera la tarjeta acotada del ejemplo, deja que la altura dependa del contenido y adapta el ancho de la foto al espacio disponible. Conserva la reducción a 48px, la ampliación y el contenido aprobado. El escritorio conserva la presentación previa.

La prueba añade imágenes de 800x400 y 400x800, además de las cuadradas, y comprueba el caso de una publicación propia sin formulario. Verifica que la ficha no reserve espacio vacío al final y que el marco de la foto aproveche el ancho del contenido. Los resultados de esta corrección se guardan en .opendesign/artifacts/photo-fidelity-fix/.

Resultado de la corrección: lint, tipos, compilación, las 18 superficies/tamaños y las cinco variantes de ficha pasaron. La prueba adicional con foto vertical y publicación propia también pasó, sin espacio final forzado ni errores JavaScript. En 390px la foto dispone de un marco de 342px de ancho, frente a los 196px anteriores; se reduce hasta 48px y recupera su ancho al regresar arriba. Se mantienen HTTPS, restricciones anónimas y privacidad. El propietario confirmó que el problema era en el celular; el escritorio se conserva.
