---
version: 1
slug: "web-src-app-mis-avisos-page-tsx"
primary_target: "web/src/app/mis-avisos/page.tsx"
related_targets: ["web/src/features/listings/components/manage-listings.tsx", "web/src/features/listings/components/product-thumbnail.tsx", "web/src/app/api/listings/[id]/photo/route.ts", "web/src/app/account-pages.css", "web/src/components/app-navigation.tsx", "web/src/components/site-header.tsx"]
---

# Superficie: Mis publicaciones

MODE: Operate

## Direction contract

THESIS: El estudiante reconoce sus productos por foto y título, conserva el control de su disponibilidad y encuentra primero lo que sigue en venta.

OWN-WORLD: Extiende la interfaz clara de Mercadito: fondo gris suave, superficies blancas, tipografía del sistema y radios cómodos. Los estados se escriben con palabras, el verde marca acciones y el foco azul conserva su función. No cambia los tokens compartidos.

STORY: Desde la confirmación de publicación, el estudiante llega a su índice personal. Las secciones aparecen en orden En venta (PUBLISHED y RESERVED), Borradores (DRAFT), Archivadas (ARCHIVED) y Vendidas (SOLD); las vacías se omiten. Cada tarjeta conserva foto, estado, fecha, título, precio, categoría, condición y descripción breve. Editar y las acciones permitidas cambian contenido o disponibilidad sin borrar la publicación ni afectar a otras cuentas. Una respuesta correcta actualiza el estado y mueve el artículo al grupo correspondiente sin recargar. Un error conserva el estado anterior. El índice vacío lleva a publicar el primer artículo y el campus de prueba mantiene su nota compacta.

FIRST VIEWPORT: En móvil se conserva el nombre completo Mis publicaciones en la navegación. El título, conteo y primer producto o estado vacío aparecen antes de abrir menús. Las tarjetas usan una columna, con miniatura de 88px en móvil y 104px en pantallas mayores; desde 1200px forman dos columnas. Los controles permanecen en una cuadrícula de dos columnas, dentro del flujo, con zona táctil mínima de 44px y foco visible.

FORM: Página operativa /mis-avisos, accesible con sesión estudiantil activa; la API verifica propiedad, universidad y estado al mutar. Las transiciones permitidas evitan que una actualización concurrente sobrescriba otro cambio. Los botones muestran Guardando durante la petición; el éxito se anuncia y el error explica cómo continuar. ProductThumbnail comparte la referencia del producto con Mensajes y muestra Sin foto ante ausencia o fallo. El vendedor conserva acceso a las fotos propias en cualquier estado; el resumen solicita solo la posición de la primera imagen para construir su URL privada.

SCOPE: Apartar ya es una transición de disponibilidad: pausa el catálogo y los nuevos hilos mientras continúan las conversaciones existentes. No reserva para una persona ni registra pagos. Quitar apartado devuelve PUBLISHED. Editar conserva el estado actual; publicar, volver a publicar, vender y archivar se ofrecen según el estado. La coordinación de entrega y cualquier pago permanecen fuera de Mercadito.

FINISH: Revisar 320 y 390px en móvil y 1440px en escritorio, acciones de 44px, enlace Editar, orden de grupos, cambios de estado sin recarga y conservación del estado ante fallo. Preservar DESIGN.md y sus tokens; registrar los resultados y sus límites en docs/verificacion-mensajes-publicaciones.md.
