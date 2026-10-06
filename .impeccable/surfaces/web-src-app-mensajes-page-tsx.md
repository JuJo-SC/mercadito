---
version: 1
slug: "web-src-app-mensajes-page-tsx"
primary_target: "web/src/app/mensajes/page.tsx"
related_targets: ["web/src/app/mensajes/[id]/page.tsx", "web/src/features/conversations/components/conversation-inbox.tsx", "web/src/features/conversations/components/message-thread.tsx", "web/src/features/conversations/components/start-conversation-form.tsx", "web/src/features/conversations/lib/conversations.ts", "web/src/features/listings/components/product-thumbnail.tsx", "web/src/app/api/listings/[id]/photo/route.ts", "web/src/components/site-header.tsx", "web/src/app/account-pages.css"]
---

# Superficie: Mensajes del campus

MODE: Operate

## Direction contract

THESIS: Cada conversación se reconoce primero por su producto y se encuentra en Ventas o Compras según el papel del estudiante; el turno de respuesta sigue visible dentro del hilo correspondiente.

OWN-WORLD: Extiende la interfaz clara de Mercadito: fondo gris suave, superficies blancas, tipografía del sistema, radios cómodos y verde para acciones. Conserva los tokens compartidos y el foco azul. Las fotos y los títulos llevan la jerarquía compacta del catálogo a la bandeja.

STORY: El interés empieza desde un aviso publicado con un primer mensaje de texto. La bandeja abre en Ventas (sellerId del estudiante) y permite cambiar a Compras (buyerId del estudiante), conservando el orden por actividad reciente dentro de cada sección. Cambiar el último emisor no mueve el hilo de sección: solo actualiza Por responder o Esperando respuesta. Cada fila muestra primero foto y título del producto; después nombre de la otra persona y precio, último mensaje, actividad, disponibilidad y mensajes sin leer. Los controles de sección incluyen total de hilos y mensajes sin leer. Al abrir un hilo, la referencia del artículo permanece fija arriba y debajo se leen los mensajes en orden cronológico. Un alumno solo inicia conversaciones dentro de su universidad y no puede escribir a su propia publicación.

FIRST VIEWPORT: En la bandeja móvil, los controles Ventas y Compras de 44px preceden a la lista; la foto de 72px y el título identifican cada producto sin desplazar el nombre de la persona al primer nivel. Los estados vacíos ofrecen Ver mis publicaciones o Explorar productos según la sección. En el hilo, el título, la referencia del anuncio, el aviso de pagos fuera de Mercadito y los mensajes recientes preceden al compositor; el historial se desplaza por separado.

FORM: El compositor acepta texto de hasta 2,000 caracteres, muestra su cuenta de longitud y permite enviar con un control de 48px. No hay adjuntos. La bandeja actualiza cada 12 segundos solo con la pestaña visible, conserva su sección y ofrece reintento si falla. Las miniaturas usan ProductThumbnail, con Sin foto ante ausencia o fallo; el resumen consulta solo position de la primera foto y entrega una URL, sin bytes de imagen.

SCOPE: Mensajería textual de interés y coordinación en un campus activo. Las fotos exigen sesión y campus; un comprador con un hilo existente conserva la referencia cuando el producto está apartado, vendido o archivado. Apartar impide nuevos hilos y conserva los existentes. Mercadito no procesa, recibe ni resguarda pagos; ambas personas pueden continuar por otro medio si lo deciden.

FINISH: Revisar móvil de 320 y 390px y escritorio de 1440px, cambio de sección, pertenencia estable por rol, jerarquía del producto, actividad y sin leer. Ejecutar el detector en los objetivos UI modificados, conservar los tokens y documentar los límites en docs/verificacion-mensajes-publicaciones.md.
