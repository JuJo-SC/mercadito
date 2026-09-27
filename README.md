# Mercadito

Mercadito es una aplicación web progresiva para descubrir y publicar artículos entre comunidades universitarias. La instalación contempla varias universidades: cada cuenta, publicación y consulta pertenece a un campus activo.

El MVP no procesa pagos. La comunidad coordina el intercambio directamente y las ofertas de demostración se identifican como ficticias; no representan inventario ni ventas reales.

## Tecnología

- Next.js App Router, React, TypeScript y Tailwind CSS.
- PWA optimizada para móvil e instalación desde el navegador.
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

El inicio de sesión requiere que una universidad esté activada y que su proveedor OIDC o SAML se configure en Keycloak. Cada institución debe proporcionar sus metadatos y un claim verificable que identifique el estado activo del alumno. Mercadito verifica el identificador de universidad y ese claim; no considera suficiente el dominio del correo.

El realm inicial es mercadito y el cliente web es mercadito-web. La URI de retorno configurada es https://mercadito.291006.xyz/api/auth/callback/keycloak. No hay un proveedor de identidad institucional real conectado. En el servidor existe un campus de prueba UMAN con cinco cuentas locales sintéticas en Keycloak para recorrer la publicación; no equivalen a una validación institucional. El acceso de alumnos de campus reales permanece deshabilitado hasta configurar el proveedor y sus claims. Las credenciales de prueba se entregaron directamente al operador y no deben subirse a Git.

Keycloak expone los metadatos del realm desplegado en estos endpoints públicos:

- OIDC discovery: https://auth.291006.xyz/realms/mercadito/.well-known/openid-configuration
- Descriptor SAML: https://auth.291006.xyz/realms/mercadito/protocol/saml/descriptor

Estos describen el realm de Keycloak de Mercadito; no sustituyen la URL de metadatos OIDC/SAML ni los claims que debe proporcionar cada universidad. Ambos endpoints se verificaron por HTTPS y devuelven metadatos válidos.

La recepción de solicitudes universitarias está deshabilitada hasta publicar el aviso de privacidad aprobado y el canal de atención. La página no envía ni almacena datos mientras está cerrada; la API devuelve 503 y solo se habilita con ENABLE_UNIVERSITY_APPLICATIONS=true en /srv/secrets/mercadito/app.env. Una solicitud habilitada pasaría a revisión y no activaría automáticamente una universidad ni sus cuentas. La vista pública muestra únicamente datos ficticios de demostración; una sesión estudiantil activa solo puede consultar las publicaciones de su propia universidad.

## Despliegue en el servidor

El proyecto se ejecuta en /srv/apps/mercadito. Requiere Docker Compose, la red Docker externa edge, DNS para mercadito.291006.xyz y auth.291006.xyz, y Caddy como proxy HTTPS.

Los archivos de entorno viven fuera del repositorio, en /srv/secrets/mercadito/:

- database.env: usuario administrador y claves para los roles de aplicación.
- keycloak.env: conexión de Keycloak a su base de datos y credenciales de administración inicial.
- app.env: conexión de la aplicación, Auth.js y cliente OIDC de Keycloak.

Mantener los tres archivos con permisos restrictivos. Nunca guardar valores secretos en Git. Antes de recibir solicitudes reales, completar y publicar el aviso de privacidad aprobado por la persona responsable del servicio. La API mantiene deshabilitada la recepción hasta que la variable ENABLE_UNIVERSITY_APPLICATIONS=true esté definida en /srv/secrets/mercadito/app.env; mantenerla en false mientras falte ese aviso o el canal de atención.

Con los secretos, DNS y configuración de Caddy listos, desde la carpeta del proyecto:

    docker compose up -d --build
    docker compose ps
    docker compose logs --tail=100 web keycloak database

Compose espera a que PostgreSQL y Keycloak estén saludables y ejecuta prisma migrate deploy antes de iniciar la aplicación. El endpoint /api/health comprueba la conexión a la base de datos.

Antes de habilitar un campus real, registrar en Keycloak su proveedor institucional y configurar en el registro de la universidad los valores identityKey, studentStatusClaim y studentStatusValue proporcionados por esa institución. No se deben sustituir con un dominio de correo supuesto.

## Datos de demostración

La base inicial contiene una comunidad y publicaciones sintéticas de demostración. En el servidor UMAN está registrada por separado como campus de prueba, con cuentas locales de Keycloak para revisar el flujo de publicación. isDemo distingue los ejemplos públicos e isTest identifica campus de prueba; la interfaz debe etiquetar ambos. No guardar las credenciales de prueba en este repositorio.

## Desarrollo y cambios

El entorno oficial de desarrollo y despliegue de este proyecto es el servidor definido por las instrucciones de operación del propietario. Trabajar allí y evitar copias de fuentes, dependencias, compilaciones, secretos o datos de producción en el directorio de entrada local.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo LICENSE.
