# Confirmación y ficha de publicaciones

## Cambios

- La confirmación de creación, edición y demostración conserva su contenido y acciones, con una superficie blanca en lugar del antiguo fondo verde intenso. El texto secundario y los enlaces vuelven a tener contraste legible; los controles tienen al menos 44px de altura.
- En la ficha del catálogo, la descripción aparece después del título y el precio, antes de condición, autor y fecha.
- Se omite Campus únicamente en la ficha. No se modifica la autenticación, el aislamiento de datos por universidad ni se incorporan facultades.

## Verificaciones

- Compose válido, lint, tipos y compilación Docker.
- Detector Impeccable sin hallazgos en los objetivos modificados.
- Recorrido de demostración completo a 320, 390, 820 y 1440px; casos con y sin foto, reinicio del formulario, foco de teclado, sin desbordamiento horizontal ni errores de JavaScript. Contraste mínimo observado de 5.06:1 en textos y acciones.
- Ficha del componente real con datos sintéticos en un contenedor interno de revisión a 320, 390 y 1440px: descripción antes de los detalles, ausencia del campo Campus, condición/autor/fecha conservados, sin desbordamiento, Escape y retorno del foco.
- Las revisiones visuales no guardan publicaciones ni envían mensajes. Creación y edición reales comparten los mismos estilos de confirmación; no se repite una escritura en producción para comprobar un cambio de presentación.
- DNS y certificado del origen verificados antes del despliegue; HTTP, HTTPS, healthcheck y logs comprobados tras reemplazar exclusivamente el servicio web.

Evidencia operativa fuera de Git en `.impeccable/review/publish-success/`.
