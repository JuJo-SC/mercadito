# Verificación de la interfaz de aplicación

Fecha: 6 de octubre de 2026.

## Alcance

Marco compartido con cabecera fija, navegación lateral en escritorio y barra inferior en móvil. Catálogo y portada en cuadrícula, estado de ruta activa, precio destacado, filtros de tablet, acceso compacto y estilo de conversación.

## Comprobaciones realizadas en Oracle

- Compose válido, lint, TypeScript y compilación de producción correctos.
- Detector de diseño sobre los archivos modificados: sin hallazgos en el pase inicial. Las correcciones posteriores responden a la revisión visual.
- Chromium con anchos emulados de 320, 390, 820 y 1440px: sin desbordamiento horizontal de documento en las vistas revisadas.
- Portada y acceso con la imagen final de producción, usando exclusivamente contenido público.
- Catálogo, publicación, inventario, bandeja y conversación con los componentes reales y datos ficticios en un contenedor privado de desarrollo, sin credenciales ni conexión a la base de datos. Todas las llamadas API se interceptan; no se crean publicaciones ni mensajes.
- Apertura y cierre del panel de filtros y ficha de producto en móvil.
- Selección de navegación en catálogo, publicación, inventario, bandeja y subruta de conversación.
- Conservación del destino Publicar al pedir acceso desde navegación pública.
- Segundo lote visual confirma la corrección de filtros en tablet, formulario, acceso y burbujas de conversación; sin errores de consola en el entorno aislado.
- DNS y HTTPS vigentes comprobados antes del despliegue. La versión desplegada debe comprobar además healthcheck, logs y HTTP/HTTPS exteriores.

## Límites

La revisión responsive usa Chromium y tamaños emulados; no es una prueba física en Safari/iPhone o Android. No se recorre el inicio de sesión real ni se usan sesiones de estudiantes. La comprobación privada valida presentación e interacción de componentes con fixtures; no sustituye pruebas de autenticación ni persistencia de mensajes.

Las fixtures, capturas y reportes se guardan solo en .impeccable/review/ (ignorado por Git) y nunca forman parte de la imagen de producción.
