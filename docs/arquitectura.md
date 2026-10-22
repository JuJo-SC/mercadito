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

## Verificación UAT restringida

infra/keycloak/uat-provider contiene el autenticador, el cliente HTTP, el validador de matrícula/situación, el formulario y las pruebas aisladas. infra/uat reúne configuración operativa, la definición del gateway privado y la compilación candidata. El código del scraper privado permanece fuera de este repositorio, en /srv/apps/scrap-uat-service.

features/auth/lib/uat-access.ts centraliza el cierre por defecto del acceso UAT; los claims, el acceso estudiantil y la página de ingreso respetan esa configuración. UAT es la comunidad activa del piloto y solo admite las matrículas autorizadas en la configuración externa de Keycloak. UMAN conserva sus datos, realm y cliente originales. Consultar [integracion-uat.md](integracion-uat.md) para administrar participantes y revisar los pendientes antes de ampliar el acceso.


`infra/keycloak/uat-provider/PortalDisplayName` reduce el nombre del portal validado a un nombre y una inicial antes de emitir `uat_display_name`. `features/auth/lib/uat-display-name.ts` valida ese claim específico; Auth.js guarda y actualiza el nombre abreviado que ya consumen cuenta, publicaciones y conversaciones. Consultar la política y las verificaciones en [integracion-uat.md](integracion-uat.md#nombre-del-estudiante-verificado).


`StudentPrivateProfile` conserva el nombre completo separado de `User.name`, que sigue siendo la presentación pública. `features/auth/lib/private-profile.ts` obtiene solo el perfil propio mediante la sesión; `/perfil` muestra el nombre público y permite desplegar el completo. Las consultas de vendedores y conversaciones no seleccionan la relación privada. `infra/uat/test-private-profile.py` comprueba aislamiento y presentación con dos sesiones ficticias, migraciones y contenedores temporales.


`PortalFaculty` extrae la facultad del programa validado; el claim `uat_faculty_name` se valida en `features/auth/lib/uat-faculty.ts` y se sincroniza en `User.facultyName`. Las consultas del catálogo seleccionan la facultad del vendedor para la ficha de publicación. El nombre completo sigue aislado en `StudentPrivateProfile`.


`features/conversations/lib/submit-message-on-enter.ts` comparte el manejo de teclado entre `start-conversation-form.tsx` y `message-thread.tsx`. Usa `requestSubmit()` para conservar validación y el flujo de envío existente; ignora composición, repetición, texto vacío y solicitudes pendientes. Ver [verificacion-envio-enter.md](verificacion-envio-enter.md).


## Pantalla de acceso

`app/ingresar/page.tsx` conserva la acción de autenticación, la validación de returnTo y las condiciones de sesión, disponibilidad y privacidad. `app/ingresar/sign-in.css`, importado por esa ruta, centra la tarjeta de acceso y limita sus estilos a las clases sign-in. Ver [verificacion-acceso-centrado.md](verificacion-acceso-centrado.md).

## Publicaciones con sesión

La portada pública solo consulta la configuración de comunidad, sin consultar publicaciones ni generar miniaturas. Se retiraron el componente y la consulta de vista previa. El catálogo y sus API conservan la validación de estudiante activo y campus; el detalle valida la sesión antes de consultar el artículo y no admite excepciones públicas por ser un campus de demostración. No se devuelve el campo heredado imageUrl: las fotos y miniaturas usan exclusivamente la ruta privada de fotos.

Las respuestas de publicaciones usan private, no-store y Vary: Cookie. Next.js sirve las páginas dinámicas sin caché compartida. El service worker solo almacena offline.html, sin publicaciones ni imágenes privadas. Ver [verificacion-publicaciones-privadas.md](verificacion-publicaciones-privadas.md).


## Presentación autenticada

`web/src/app/session-surfaces.css` extiende el sistema de superficies después del acceso. `components/task-page-heading.tsx` comparte título, descripción, ayuda y avisos; `components/dismissible-details.tsx` añade cierre por Escape y pulsación exterior al desplegable nativo. Los módulos de publicaciones y conversaciones conservan sus solicitudes y estado. Las pruebas aisladas y su ejecución están en [verificacion-vistas-con-sesion.md](verificacion-vistas-con-sesion.md).


## Ficha y presentación de publicaciones

features/listings/lib/listing-presentation.ts reúne el tipo de resumen, los nombres de condición y el formato de precio y fechas del catálogo. features/listings/components/listing-detail-dialog.tsx contiene la ficha, la galería y la ampliación de fotos; marketplace.tsx conserva búsqueda, paginación y selección. app/listing-detail.css, cargado después del sistema de sesión, limita los nuevos estilos a las tarjetas del catálogo y al detalle refinado.

La animación ajusta el marco de la foto y recorta una superposición sobre un espacio reservado; el contenido mantiene su geometría. Los listeners se retiran al desmontar. La variante compact del formulario inicial cambia solo la presentación del contacto en la ficha. Las consultas, rutas de fotos, autorización y envío permanecen en sus módulos originales.

La prueba aislada infra/uat/check-listing-details.cjs reutiliza el entorno sintético de test-session-surfaces.py; las opciones MERCADITO_TEST_IMAGE, MERCADITO_TEST_OUTPUT y MERCADITO_CHECK_LISTING_DETAILS permiten seleccionar la imagen candidata, la carpeta de resultados y las fotos de prueba sin acceder a producción.

### Catálogo compacto

marketplace.tsx presenta únicamente foto, precio y título en las tarjetas. El título de página permanece accesible sin panel visual, y el catálogo no muestra contadores; la paginación mantiene initialTotal, hasMore y nextCursor. listing-detail.css reúne el contorno de la foto y los espacios del catálogo; no se cambian consultas, API ni el componente de ficha. Ver [verificación del catálogo compacto](verificacion-catalogo-compacto.md).

### Ficha amplia y contacto compacto

listing-detail-dialog.tsx dispone descripción, fecha, contacto y datos del vendedor en ese orden. start-conversation-form.tsx conserva el envío y la idempotencia y presenta su variante compact como campo y botón lateral con nombre accesible. La galería y los límites de la hoja se ajustan en listing-detail.css; no cambian API, permisos ni almacenamiento de fotos. Ver [verificación de ficha amplia](verificacion-ficha-amplia.md).

### Reducción con recorrido corto

listing-detail-dialog.tsx mide el recorrido expandido al abrir la ficha y cuando cambia el contenido, tamaño o preferencia de movimiento. Un ResizeObserver del contenido invalida esa medida sin observar los márgenes animados. requestAnimationFrame actualiza la foto y --detail-collapse-extra; listing-detail.css compensa el margen del contenido y la altura máxima de la ficha con el mismo valor. Así se conserva el rango nativo sin una banda vacía. La reducción completa requiere hasta 80px o el recorrido disponible, y no se activa si todo cabe o el usuario prefiere movimiento reducido. Ver [verificación de animación corta](verificacion-animacion-corta.md).
