# Mercadito

Mercadito es una aplicación web progresiva para descubrir y publicar artículos entre estudiantes de una sola universidad. La comunidad habilitada en esta etapa es UMAN, con cuentas y datos de prueba. Cada cuenta, publicación y consulta conserva su vínculo con el campus para permitir una ampliación futura.

El MVP no procesa pagos. La comunidad coordina el intercambio directamente y las ofertas de demostración se identifican como ficticias; no representan inventario ni ventas reales.

## Tecnología

- Next.js App Router, React, TypeScript y Tailwind CSS.
- PWA instalable desde el navegador, con un aviso estático ante fallos de conexión o disponibilidad; no almacena publicaciones ni conversaciones offline.
- Cada publicación admite hasta cinco fotos WebP con compresión adaptativa; cada archivo de entrada puede pesar hasta 8 MB y la carga total hasta 20 MB. Las imágenes solo se entregan a estudiantes autenticados del mismo campus.
- Auth.js con Keycloak como intermediario OIDC para los proveedores institucionales.
- PostgreSQL y Prisma ORM.
- Docker Compose y Caddy para ejecución y HTTPS.

## Estructura

- web/: aplicación Next.js, endpoints y esquema de Prisma.
- database/init/: creación inicial de las bases de datos y roles separados.
- keycloak.Dockerfile: imagen de Keycloak.
- compose.yml: servicios privados del proyecto y conexión al proxy compartido edge.
- PRODUCT.md: alcance, decisiones y datos que faltan para habilitar instituciones reales.

## Acceso institucional

El procedimiento de integración y el contrato exacto de claims están en [docs/identidad-universidades.md](docs/identidad-universidades.md).

El inicio de sesión requiere que una universidad esté activada y que su proveedor OIDC o SAML se configure en Keycloak. Cada institución debe proporcionar sus metadatos y un claim verificable que identifique el estado activo del alumno. Mercadito verifica el identificador de universidad y ese claim; no considera suficiente el dominio del correo.

El realm inicial es mercadito y el cliente web es mercadito-web. La URI de retorno configurada es https://mercadito.291006.xyz/api/auth/callback/keycloak. No hay un proveedor de identidad institucional real conectado. En el servidor existe un campus de prueba UMAN con cinco cuentas locales sintéticas en Keycloak para recorrer la publicación; no equivalen a una validación institucional. El acceso de alumnos de campus reales permanece deshabilitado hasta configurar el proveedor y sus claims. Las credenciales de prueba se entregaron directamente al operador y no deben subirse a Git.

Keycloak expone los metadatos del realm desplegado en estos endpoints públicos:

- OIDC discovery: https://auth.291006.xyz/realms/mercadito/.well-known/openid-configuration
- Descriptor SAML: https://auth.291006.xyz/realms/mercadito/protocol/saml/descriptor

Estos describen el realm de Keycloak de Mercadito; no sustituyen la URL de metadatos OIDC/SAML ni los claims que debe proporcionar cada universidad. Ambos endpoints se verificaron por HTTPS y devuelven metadatos válidos.

## Una sola comunidad

La configuración en `/srv/secrets/mercadito/app.env` define la única comunidad admitida:

- `ACTIVE_UNIVERSITY_SLUG=uman`: slug exacto del registro University permitido.
- `ACTIVE_UNIVERSITY_NAME=UMAN`: nombre corto visible en la portada y el acceso.

El servidor aplica esta restricción en el inicio de sesión, en las sesiones existentes y en las consultas de productos, fotos, publicaciones y mensajes. Una cuenta de otro campus no puede usar estos recorridos aunque tenga una sesión anterior. La portada pública no entrega productos. `/api/universities` devuelve únicamente los datos públicos del campus configurado; `/universidades` redirige al acceso. El registro de otras comunidades está cerrado: `/api/universities/register` devuelve 403 aunque la antigua variable `ENABLE_UNIVERSITY_APPLICATIONS` estuviera habilitada.

Para pasar de UMAN a una universidad real, seguir [docs/comunidad-unica.md](docs/comunidad-unica.md). Se cambia la configuración y se conecta la identidad real; no se deben reutilizar las cuentas sintéticas ni cambiarles el campus. El modelo conserva los registros existentes, pero solo admite el campus configurado.

## Despliegue en el servidor

El proyecto se ejecuta en /srv/apps/mercadito. Requiere Docker Compose, la red Docker externa edge, DNS para mercadito.291006.xyz y auth.291006.xyz, y Caddy como proxy HTTPS.

Los archivos de entorno viven fuera del repositorio, en /srv/secrets/mercadito/:

- database.env: usuario administrador y claves para los roles de aplicación.
- keycloak.env: conexión de Keycloak a su base de datos y credenciales de administración inicial.
- app.env: conexión de la aplicación, Auth.js y cliente OIDC de Keycloak.

Mantener los tres archivos con permisos restrictivos. Nunca guardar valores secretos en Git. Antes de recibir alumnos reales, completar y publicar el aviso de privacidad aprobado por la persona responsable del servicio. El registro público de otras universidades permanece cerrado durante esta etapa.

Con los secretos, DNS y configuración de Caddy listos, desde la carpeta del proyecto:

    docker compose up -d --build
    docker compose ps
    docker compose logs --tail=100 web keycloak database

Compose espera a que PostgreSQL y Keycloak estén saludables y ejecuta prisma migrate deploy antes de iniciar la aplicación. El endpoint /api/health comprueba la conexión a la base de datos.

Antes de habilitar un campus real, registrar en Keycloak su proveedor institucional y configurar en el registro de la universidad los valores identityKey, studentStatusClaim y studentStatusValue proporcionados por esa institución. No se deben sustituir con un dominio de correo supuesto.

## Datos de demostración

La base inicial contiene una comunidad y publicaciones sintéticas de demostración. En el servidor UMAN está registrada por separado como campus de prueba, con cuentas locales de Keycloak para revisar el flujo de publicación. isDemo distingue los ejemplos sintéticos e isTest identifica campus de prueba; la interfaz debe etiquetar ambos. El antiguo campus demo permanece guardado, pero no es accesible desde la web ni la API de productos. No guardar las credenciales de prueba en este repositorio.

## Desarrollo y cambios

El entorno oficial de desarrollo y despliegue de este proyecto es el servidor definido por las instrucciones de operación del propietario. Trabajar allí y evitar copias de fuentes, dependencias, compilaciones, secretos o datos de producción en el directorio de entrada local.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo LICENSE.
