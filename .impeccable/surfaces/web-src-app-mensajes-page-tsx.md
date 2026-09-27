---
version: 1
slug: "web-src-app-mensajes-page-tsx"
primary_target: "web/src/app/mensajes/page.tsx"
related_targets: ["web/src/app/mensajes/[id]/page.tsx", "web/src/components/conversation-inbox.tsx", "web/src/components/message-thread.tsx", "web/src/components/start-conversation-form.tsx", "web/src/components/marketplace.tsx", "web/src/components/site-header.tsx", "web/src/app/globals.css"]
---

# Superficie: correspondencia del campus

MODE: Operate

SEED_KEY: 41089191

## Direction contract

THESIS: Cada conversación se encuentra por su actividad reciente y conserva el artículo a la vista para que ambas personas sepan qué intercambio están coordinando.

OWN-WORLD: La Gaceta de Intercambio: papel cálido, tipografía editorial, tinta oscura, reglas finas y acento lima reservado a la pertenencia del campus de prueba. Los hilos se ordenan como correspondencia; las filas planas reemplazan tarjetas genéricas.

STORY: El interés empieza desde un aviso publicado con un primer mensaje de texto. La bandeja ordena los hilos por actividad más reciente y muestra el artículo, la otra persona, el último mensaje, si te toca responder o esperar respuesta y si hay mensajes sin leer. Al abrir un hilo, la referencia del artículo permanece fija arriba y debajo se leen los mensajes en orden cronológico. Un alumno solo inicia conversaciones dentro de su universidad y no puede escribir a su propio aviso.

FIRST VIEWPORT: En móvil, el título de la conversación, el anuncio de referencia, el aviso de pagos fuera de Mercadito y los mensajes recientes quedan visibles antes del compositor. La referencia ocupa una franja editorial plana; el historial se desplaza por separado para que el artículo no desaparezca mientras se lee.

FORM: El compositor acepta texto de hasta 2,000 caracteres, muestra su cuenta de longitud y permite enviar con un control de 48px. No hay adjuntos. Los estados incluyen envío, límite, error de red, estado vacío y actualización periódica solo con la pestaña visible.

SCOPE: Mensajería textual de interés y coordinación en un campus activo. Mercadito no procesa, recibe ni resguarda pagos. Si ambas personas lo deciden, pueden continuar fuera de la plataforma.

FINISH: Ejecutar build y smoke test del servidor, detector Impeccable para los objetivos de UI cambiados y revisar las vistas reales móvil y escritorio una vez; corregir hallazgos visuales y confirmar en una segunda ronda si hubo cambios.
