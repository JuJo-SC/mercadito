# Publicaciones accesibles únicamente con sesión

## Cambio

La landing conserva bienvenida, pasos, navegación y botones de ingreso. No consulta publicaciones ni genera tarjetas o miniaturas incrustadas. Se retiraron la consulta, el componente público y sus estilos, conservando las reglas compartidas del catálogo.

El detalle exige estudiante activo antes de consultar el anuncio y filtra por campus activo. Desaparece la excepción pública de universidades demo. Los artículos de ejemplo solo se muestran en campus de prueba. Se conserva el acceso a fotos propias y a las referencias del comprador en conversaciones existentes.

No se devuelve el campo heredado imageUrl. Todas las imágenes de publicaciones y miniaturas usan el endpoint de fotos autorizado. El optimizador de Next.js solo admite iconos estáticos; rechaza las fotos privadas incluso mediante URLs directas de /_next/image.

## Caché

- HTML y RSC de las páginas dinámicas: private, no-cache, no-store, max-age=0, must-revalidate.
- API de publicaciones y fotos: private, no-store; las rutas de datos y fotos incluyen Vary: Cookie.
- Service worker revisado: solo almacena offline.html y no guarda páginas, publicaciones, fotos ni respuestas API.
- Caddy no configura caché de contenido; Cloudflare respondió DYNAMIC y sin Age en la landing revisada antes del despliegue.
- No hay fotos de publicaciones en public/ ni URLs externas de imagen almacenadas en los ocho registros revisados. Se preservan los registros y los datos.
- El cambio impide nuevas entregas públicas; no puede retirar copias que alguien hubiera guardado cuando la vista previa era pública.

## Verificaciones realizadas en Oracle

- Compose con overlays UAT: configuración válida sin imprimir variables.
- ESLint, generación Prisma, tipos Next.js/TypeScript y compilación Docker de producción correctos.
- 14 pruebas unitarias existentes correctas.
- python3 infra/uat/test-listing-privacy.py: migraciones actuales sobre PostgreSQL temporal en tmpfs, red interna y cuentas ficticias; sin conexión a producción.
- HTTP: se rechazan sesiones ausentes, inválidas, caducadas, de cuentas suspendidas, administradores, usuarios demo y de otro campus. HTML y RSC públicos no contienen títulos, precios ni imágenes de publicaciones.
- Catálogo, búsqueda, detalle, segunda foto y miniaturas funcionan con sesión válida. Aislamiento por campus, estados, propiedad y conversaciones existentes comprobados.
- Repetición anónima después de calentar las URLs con sesión, solicitudes condicionales y HEAD: no se entregan bytes privados. El optimizador devuelve 400.
- Sin isTest, las muestras quedan fuera del catálogo, detalle y fotos.
- Chromium en 1440x900, 390x844 y 320x740: bienvenida y tres pasos presentes, botón de 50px, foco y navegación correctos; cero tarjetas, imágenes privadas, solicitudes de fotos, errores de navegador o desbordamientos. Capturas en .qa/, fuera de Git.
- Detector visual sin hallazgos. Revisión del diff conserva las reglas responsive del catálogo.
- DNS público y certificado de origen vigentes; Caddy válido. No requiere migraciones ni cambios en Keycloak o Caddy.

## Despliegue y comprobación operativa

Promover la imagen mercadito-web:uat-candidate comprobada a la etiqueta del commit y a mercadito-web:uat. Reemplazar únicamente web con compose.yml e infra/uat/activation.compose.yml, usando --no-deps --no-build. Comprobar healthcheck, logs, /api/health, redirección HTTP, HTTPS, rutas directas y ausencia de publicaciones en la landing desde el exterior.

Las pruebas autenticadas usan sesiones sintéticas en el entorno aislado; no se introducen credenciales institucionales reales. La unificación visual de Auth.js y Keycloak queda fuera de este cambio.
