# Verificación de la animación corta

## Solicitud

El propietario aprobó expresamente aplicar la animación de animacion-corta.html después de revisar la propuesta privada. Esta actualización traslada ese comportamiento a la ficha real; mantiene el diseño amplio, contacto compacto, datos y catálogo publicados.

## Comportamiento

En móvil la foto llega a una miniatura de 48px en hasta 80px de desplazamiento, usando el recorrido nativo disponible cuando es menor. Al volver arriba recupera el tamaño inicial. Si el contenido cabe completo, no se fuerza desplazamiento ni reducción. Escritorio y movimiento reducido conservan la foto estática.

La compensación del margen del contenido y de la altura visible mantiene estable el recorrido de scroll y evita una banda vacía. ResizeObserver recalcula la base cuando cambia el tamaño del contenido; también se atienden cambios de viewport y preferencias. Los listeners, observer y frames se retiran al desmontar la ficha.

## Validación en Oracle

Compose, lint, tipos y compilación de producción correctos. La suite aislada pasó las 18 combinaciones de superficie y tamaño, los recorridos de filtros, publicación, edición y mensajes y las restricciones de sesión y privacidad.

La prueba de ficha pasó escritorio, móvil, pantalla corta, 320px y movimiento reducido. Con 16px de recorrido móvil y 8px en 320px, la foto alcanzó exactamente 48px y recuperó 342px y 272px al volver arriba. Con la pantalla corta también alcanza 48px. Movimiento reducido conserva 342px. No hubo desbordamientos ni errores JavaScript.

Se verificó una descripción larga añadida en el navegador de prueba: recalcular el rango, reducir en 80px, mantener estable el scroll y alcanzar el pie sin espacio vacío. También se comprobó el caso propio que cabe completo, la ampliación, Escape, cinco fotos y envío del primer mensaje con el botón de icono en una sesión ficticia.

Los artefactos quedan en .opendesign/artifacts/short-motion-implementation-20261022/, fuera de Git. No se utilizan datos ni credenciales de producción. El protocolo del servidor impide ejecutar el detector local sobre el código remoto; se verifican directamente la geometría, accesibilidad y comportamiento en Oracle.

## Publicación

Se reemplaza únicamente web con la imagen validada, sin migraciones ni cambios en datos, Caddy, redes, autenticación o secretos. Commit, imagen, comprobaciones exteriores y estado final se registran en el deployment.json privado.
