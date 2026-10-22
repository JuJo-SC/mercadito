# Verificación del catálogo compacto

## Solicitud y resultado

El propietario aprobó la tarjeta compacta, el contorno fino de la fotografía y los espacios reducidos. Después pidió retirar el panel de Explorar publicaciones y el contador y aplicar el conjunto a la web. La solicitud final autoriza la implementación y publicación de este alcance.

La fotografía define el contorno, sin marco ni padding exterior de tarjeta. Debajo quedan precio y título en una línea, con puntos suspensivos para títulos largos. Se retiran vendedor, fecha y condición del catálogo, conservándolos en la ficha. El h1 solo lo presentan los lectores de pantalla. No se muestran contadores y se conserva Cargar más publicaciones, filtros y estados de carga, error y vacío.

## Verificaciones

Compose, lint, tipos y compilación de producción correctos. La suite existente pasó las 18 combinaciones de superficie y tamaño, los recorridos de filtros, publicación, edición y mensajes y las restricciones HTTP y privacidad. La ficha pasó sus cinco variantes, fotos horizontales y verticales, ampliación, Escape y movimiento reducido.

La comprobación específica pasó en 1440, 768, 390 y 320px, sin errores JavaScript ni desbordamientos horizontales. Distancia medida entre cabecera y fotos: 11px en escritorio/tablet y 9px en móvil; cuadrícula de 10px entre filas y 8px/6px entre columnas. La foto ocupa el ancho de la tarjeta, con borde de 1px y sin borde ni padding exterior. La franja mide aproximadamente 30px en escritorio y 26px en móvil. El teclado abre la ficha y los títulos largos se recortan con puntos suspensivos.

La primera revisión detectó el margen superior heredado de la cuadrícula; se retiró y se repitieron compilación, suite funcional y comprobación geométrica. La revisión visual final confirmó móvil y escritorio. DNS, HTTPS exterior y certificado de origen verificados; Caddy valida su configuración. No se modificó su archivo.

Los artefactos privados quedan en .opendesign/artifacts/catalog-compact-implementation-20261022/, fuera de Git. El entorno de pruebas usa PostgreSQL temporal, sesiones y fotos ficticias, sin credenciales ni volúmenes de producción. No hay cambios de esquema ni migraciones.

Se revisan escritorio de 1440px, tablet de 768px y móviles de 390 y 320px: ausencia del panel, espacios, ancho completo de foto, borde de 1px, franja compacta, teclado y título largo. Las pruebas existentes revisan filtros, publicación, edición, mensajes, ficha, ampliación, cinco fotos, falta de fotos, movimiento reducido, permisos y privacidad.

El protocolo del servidor impide transferir código o ejecutar pruebas de aplicación en Windows. Por ello no se ejecuta el detector local de Impeccable sobre los archivos remotos; se verifica directamente el resultado de la imagen de producción en Oracle y la sesión real.

## Publicación

El despliegue reemplaza solo web con la imagen candidata validada. Preserva base de datos, Keycloak, redes, secretos y Caddy. El hash publicado y desplegado se registra en el artefacto privado deployment.json.
