# Mercadito

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegado y aceptado por la persona usuaria: Next.js con TypeScript y Tailwind, PWA, Keycloak para federar identidad institucional (OIDC para la app; OIDC o SAML con la universidad), PostgreSQL con Prisma y despliegue con Docker Compose y Caddy.

## Users

- Confirmado: estudiantes que inician sesión con una cuenta institucional.
- Etapa actual confirmada: una sola comunidad universitaria, UMAN como campus de prueba.
- Inferencia a partir del pedido de una PWA: el uso desde teléfonos móviles es prioritario.

## Product Purpose

Un espacio de compra y venta para estudiantes de una sola universidad. En esta etapa UMAN es la única comunidad habilitada, con cuentas y datos de prueba. Después se configurará una universidad real; la incorporación de varias universidades queda para una mejora futura.

## Positioning

La pertenencia a una universidad define el acceso al mercadito de esa comunidad. La asociación debe provenir de la configuración de identidad institucional; una coincidencia de dominio de correo, por sí sola, no demuestra matrícula activa.

## Operating Context

- Confirmado: los alumnos usan sus credenciales institucionales para iniciar sesión.
- Confirmado: las opciones de registrar o elegir otras universidades se retiran durante esta etapa.
- Inferencia provisional: descubrimiento y publicación de artículos ocurren principalmente desde el teléfono y dentro de la comunidad universitaria.
- Confirmado: el comprador y el vendedor podrán iniciar la coordinación mediante chat dentro de Mercadito; si ambos lo deciden, podrán continuar por otro medio.
- Confirmado: Mercadito será intermediario y no procesará, recibirá ni resguardará pagos; cualquier pago se acordará fuera de la plataforma.

## Capabilities and Constraints

- Requerido en esta etapa: una universidad configurada, acceso restringido a sus cuentas autorizadas y experiencia web instalable en dispositivos móviles. El registro de otras universidades está cerrado tanto en la interfaz como en la API.
- Elección de stack: Keycloak aceptará proveedores institucionales OIDC o SAML y ofrecerá OIDC a la aplicación.
- Dato pendiente: cada universidad debe facilitar los datos de su proveedor de identidad y aclarar qué información permite verificar que alguien es alumno activo.
- Alcance confirmado para el MVP: publicar y explorar artículos, conversar por chat para coordinar el interés, sin procesar pagos.
- Los estudiantes pueden consultar y editar sus propias publicaciones dentro de su campus. Mis publicaciones muestra sus fotos y agrupa En venta (publicadas y apartadas), Borradores, Archivadas y Vendidas, con acciones según el estado que actualizan el grupo sin recargar.
- Apartar retira temporalmente el artículo del catálogo e impide iniciar nuevas conversaciones; los hilos existentes continúan abiertos. No reserva para una persona ni registra pagos. Quitar apartado vuelve al estado publicado.
- Mensajes separa Ventas y Compras por el papel del estudiante como vendedor o comprador, aunque cambie el último emisor. La foto y el título del producto preceden al nombre de la otra persona; se conservan actividad, disponibilidad, Por responder/Esperando respuesta y mensajes sin leer.
- El chat del MVP permite mensajes de texto entre estudiantes del mismo campus; no admite adjuntos.
- Cada aviso puede incluir hasta cinco fotos JPG, PNG o WebP. Cada archivo de entrada pesa como máximo 8 MB; la suma de la carga no supera 20 MB. Las fotos se convierten a WebP de hasta 1280 px, con un objetivo de 700 KB y un límite de 1.2 MB por imagen, se guardan como filas vinculadas al aviso y sus originales solo se entregan a estudiantes activos del mismo campus; la portada puede mostrar miniaturas reducidas de anuncios publicados. El recorrido de demostración previsualiza las fotos, pero no guarda publicaciones.
- Las fotos privadas requieren una sesión estudiantil activa del mismo campus. El vendedor puede ver las fotos de sus publicaciones en cualquier estado; un comprador con un hilo existente conserva la referencia visual cuando el artículo está apartado, vendido o archivado. Los resúmenes de conversaciones y publicaciones seleccionan solo la posición de la primera foto y construyen su URL; los bytes se solicitan al endpoint privado y no se envían en el resumen.
- Si una navegación falla por red o disponibilidad, la PWA muestra una página estática; no almacena ni reenvía publicaciones, mensajes o datos privados.

- Actualizado por petición del usuario: sin sesión se muestran nombre, precio y miniatura de hasta ocho productos publicados de la comunidad activa. Las tarjetas llevan al acceso; no se exponen vendedores, conversaciones ni fotos originales. Una cuenta estudiantil activa solo puede acceder si pertenece a la única universidad configurada. Los antiguos registros de demostración se conservan, pero no se exponen en el catálogo público.

## Evidence on Hand

El brief de producto proviene de la persona usuaria. Aún no hay proveedor institucional conectado ni catálogo real. El servidor tiene UMAN como campus de prueba (isTest) y cuentas locales sintéticas de Keycloak para recorrer la publicación; no verifican matrícula. Sus anuncios de muestra y fotografías se identifican como contenido ficticio. Las credenciales no deben guardarse en Git.

## Pendiente antes de recibir alumnos reales

Aún se necesita el aviso de privacidad aprobado por quien operará el servicio, con identidad de la persona responsable, finalidades, conservación y medios de contacto para ejercer derechos. El registro de universidades está cerrado en esta etapa; antes del piloto real se necesita el aviso aplicable a las cuentas y los datos estudiantiles.

## Flujo del estudiante

1. La portada pública presenta el mercadito de la universidad configurada y su condición de prueba cuando corresponde. Muestra una cuadrícula estática de hasta ocho productos publicados, con foto, precio y nombre. No ofrece integrar otras comunidades.
2. Al iniciar sesión, Keycloak entrega los claims que permiten asociar la cuenta con la universidad activa configurada. Otra universidad se rechaza, incluso con claims válidos. El correo por sí solo no determina el campus.
3. El alumno entra a /mercadito, donde ve el catálogo de su universidad, busca por texto o categoría y compara publicaciones.
4. El catálogo empieza por publicaciones con más conversaciones iniciadas cuando hay actividad suficiente; si no, muestra las más recientes. Mercadito no procesa pagos.

Las cuentas UMAN son sintéticas para recorrido de prueba. Sus correos se mantienen en el entorno de identidad y no se documentan como credenciales reales.

## Product Principles

- El acceso y los datos de cada comunidad deben quedar asociados a su universidad.
- La verificación institucional debe depender del proveedor de identidad configurado, no únicamente del sufijo del correo.
- Las tareas principales deben ser cómodas en una pantalla móvil.
- No presentar datos de demostración como ofertas reales.

## Configuración de esta etapa

`ACTIVE_UNIVERSITY_SLUG` y `ACTIVE_UNIVERSITY_NAME` se definen fuera de Git. Por defecto se usa UMAN. Cambiar a una universidad real requiere su propio registro e identidad institucional, conservando las cuentas y publicaciones de prueba aisladas. El modelo por campus se mantiene para una mejora futura; no existe selección ni recepción de solicitudes de otras universidades en el producto actual.

## Experiencia de aplicación

Confirmado por el propietario: conservar una página web con apariencia y navegación de aplicación en escritorio y móvil; tomar Facebook Marketplace como referencia. El escritorio tiene menú lateral permanente y el móvil barra inferior para Explorar, Mensajes, Publicar y Mis publicaciones. Se conserva el estilo claro y verde de Mercadito y sus restricciones de acceso.


## Orientación pública

Confirmado: las explicaciones de Mensajes, Publicar y Mis publicaciones permanecen visibles en el lateral de la portada, con poco texto y ejemplos visuales. El chat permite coordinar con compradores y vendedores sin tener que compartir un teléfono; compartirlo es voluntario. Publicar presenta artículos sin uso, ropa y productos de emprendimientos, conforme al reglamento. Mis publicaciones presenta la consulta y administración de los artículos propios. En móvil estas ayudas aparecen en la portada sin ampliar la barra inferior; los accesos continúan requiriendo login.
