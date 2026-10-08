# Organización del proyecto

Mercadito usa una sola aplicación Next.js con módulos por función. Esta organización facilita encontrar el código y permite mover archivos sin alterar las URL públicas.

```text
mercadito/
├── AGENTS.md                  # reglas para agentes y mantenimiento
├── CONTRIBUTING.md            # ramas, commits, revisión y verificaciones
├── README.md                  # presentación y operación
├── PRODUCT.md                 # alcance del producto
├── DESIGN.md                  # decisiones visuales
├── compose.yml                # servicios del proyecto
├── database/init/             # inicialización de PostgreSQL
├── infra/
│   ├── keycloak/Dockerfile    # imagen del proveedor de identidad
│   └── ssh-access/            # configuración versionada del túnel
├── docs/                      # arquitectura y guías operativas
└── web/
    ├── prisma/                # esquema y migraciones
    ├── public/                # recursos estáticos y service worker
    └── src/
        ├── app/               # páginas, API, layouts, estilos y metadatos
        ├── features/
        │   ├── auth/          # Auth.js y validación del alumno
        │   ├── community/     # comunidad activa e integración institucional
        │   ├── conversations/ # bandeja, hilos y acceso a mensajes
        │   ├── listings/      # catálogo, publicaciones, portada y fotos
        │   └── pwa/           # instalación de la aplicación
        ├── components/        # navegación y estructura compartidas
        ├── lib/               # cliente de base de datos compartido
        ├── types/             # declaraciones compartidas
        └── generated/         # cliente Prisma generado, fuera de Git
```

## Dónde colocar un archivo

- **Ruta o endpoint:** `app/`. Mantener las convenciones de Next.js y la validación de entrada en los límites HTTP. Extraer lógica cuando sea reutilizable o cuando simplifique la ruta; no crear capas vacías.
- **Componente de una función:** `features/<modulo>/components/`. Por ejemplo, el formulario de un aviso pertenece a `listings`; el hilo de mensajes pertenece a `conversations`.
- **Lógica de una función:** `features/<modulo>/lib/`. Funciones de acceso a conversaciones, límites de fotos y selección de comunidad viven junto a su módulo.
- **Código compartido:** `components/` para estructura visual usada entre funciones y `lib/` para infraestructura común. Antes de mover algo aquí, comprobar que tiene consumidores de varias funciones.
- **Datos:** esquema y nuevas migraciones en `prisma/`; inicialización del motor en `database/init/`. Nunca colocar datos de producción en estas carpetas.
- **Infraestructura:** `infra/<servicio>/`. Mantener `compose.yml` en la raíz para operar el proyecto desde un solo punto. Los archivos activos de Caddy permanecen fuera del repositorio, en `/srv/infra/caddy/sites/`.
- **Documentación:** guías en `docs/`; documentos de entrada, producto y diseño en la raíz para conservar referencias existentes.

## Dependencias y nombres

Usar el alias `@/` para importaciones entre carpetas y rutas explícitas a cada archivo. Los nombres de archivos y carpetas usan `kebab-case`; los componentes exportados usan `PascalCase`. Crear subcarpetas solo cuando existan archivos que agrupen una responsabilidad real.

Un módulo puede consumir otro cuando la función lo necesita; por ejemplo, el catálogo usa el formulario para iniciar una conversación. El código compartido de navegación puede integrar módulos del producto. Evitar ciclos y extraer una dependencia común solo si realmente se comparte.

Los componentes con `"use client"` solo importan código apto para el navegador. Prisma, autenticación, secretos y consultas deben permanecer en el servidor. No agrupar exportaciones de servidor y cliente en un `index.ts` común. `features/auth/auth.ts` centraliza Auth.js; `lib/prisma.ts` centraliza el cliente de base de datos.

## Alcance de esta organización

No cambiar nombres de rutas, tablas, migraciones, volúmenes o servicios para acomodar carpetas. Mantener actualizadas las importaciones, el contexto de Docker, los README y las referencias de diseño cuando se mueve un archivo. `web/src/generated/`, `.next/` y `node_modules/` son artefactos y no se reorganizan ni versionan.

## Marco de aplicación

La estructura compartida vive en web/src/components/site-header.tsx, app-navigation.tsx y site-header-interactions.tsx. El encabezado conserva autenticación e instalación; el lateral y la barra inferior consumen el mismo proveedor de mensajes sin leer. Los enlaces reconocen la ruta activa, incluidas sus subrutas. web/src/app/app-shell.css, cargado después de globals.css, reúne la distribución responsive del marco y del catálogo, sin duplicar las páginas ni cambiar permisos.

## Mensajes y publicaciones propias

- `web/src/app/mis-avisos/page.tsx` consulta las publicaciones del estudiante y su campus; `features/listings/components/manage-listings.tsx` presenta los grupos de estado y aplica las acciones después de una respuesta correcta, sin recargar. La URL `/mis-avisos` se conserva y la interfaz usa «Mis publicaciones», también en móvil.
- `features/conversations/lib/conversations.ts` construye el resumen de los hilos y deriva Ventas de `sellerId` y Compras de `buyerId`, sin depender del último emisor. `features/conversations/components/conversation-inbox.tsx` presenta el selector, las referencias del artículo, el turno de respuesta, la actividad y los contadores.
- `features/listings/components/product-thumbnail.tsx` comparte la presentación de fotos entre publicaciones propias y conversaciones, con «Sin foto» tanto para ausencia como para fallo de carga. Permanece en el módulo de publicaciones porque representa un producto y no contiene lógica de conversaciones.
- Ambos resúmenes consultan solo `position` de la primera foto, con orden ascendente y `take: 1`, para construir `/api/listings/[id]/photo?position=…`. La ruta `web/src/app/api/listings/[id]/photo/route.ts` comprueba sesión y campus antes de entregar bytes con `private, no-store`: permite publicaciones visibles, fotos propias en cualquier estado y referencias del comprador de un hilo existente aunque el artículo esté apartado, vendido o archivado.
- `web/src/app/account-pages.css` reúne los estilos de estas superficies y de las miniaturas; `web/src/app/layout.tsx` lo importa después de `globals.css` y `app-shell.css`. Reutiliza los tokens compartidos y mantiene las reglas responsive de cuenta separadas del marco y del catálogo.

Las verificaciones y los límites del cambio están en [verificacion-mensajes-publicaciones.md](verificacion-mensajes-publicaciones.md). No requiere migraciones ni cambios de infraestructura.


## Introducciones públicas por apartado

`components/public-feature-guide.tsx` presenta Mensajes, Publicar y Mis publicaciones antes de iniciar sesión. Cada ruta comprueba primero la cuenta: sin estudiante activo muestra esta introducción; con sesión conserva su función real. `publicar?demo=1` y las solicitudes de edición mantienen sus recorridos específicos. El lateral enlaza a cada ruta y conserva su presentación compacta; el botón de la introducción lleva al login con el `returnTo` correspondiente.

`app/public-feature-pages.css` reúne los estilos de estas pantallas y se importa desde el layout raíz. Las muestras son HTML e iconos Lucide con datos ilustrativos, sin consultas a conversaciones ni artículos privados. Las API siguen requiriendo autorización.
