---
version: 1
slug: "web-src-app-publicar-page-tsx"
primary_target: "web/src/app/publicar/page.tsx"
related_targets: ["web/src/components/listing-form.tsx","web/src/components/manage-listings.tsx","web/src/app/globals.css"]
---

# Superficie: publicar y editar un aviso

MODE: Operate

SEED_KEY: dc2d0cbd (heredada de La Gaceta de Intercambio).

## Direction contract

THESIS: Publicar un clasificado debe sentirse tan directo como completar una ficha para la gaceta del campus; editarlo no debe alterar su disponibilidad.

OWN-WORLD: La Gaceta de Intercambio: papel cálido, tipografía editorial, tinta oscura, reglas finas y acento lima reservado a la pertenencia del campus de prueba. Formularios planos, jerarquía clara y controles táctiles cómodos; sin tarjetas de tienda genéricas.

STORY: El flujo separa el reconocimiento del artículo, sus detalles y la revisión. Desde Mis avisos, el estudiante puede abrir Editar, corregir los mismos campos y guardar. La API confirma propiedad y campus, mantiene el estado actual del aviso y rechaza ediciones simultáneas para evitar que una sobrescriba a otra. El éxito lleva al índice personal.

FIRST VIEWPORT: En móvil, el título del paso, su instrucción y los campos actuales deben aparecer sin desplazamiento innecesario. La barra de tres pasos, los botones y las opciones de condición conservan blancos táctiles de 44px, foco visible y una jerarquía legible.

FORM: Página operativa /publicar con tres pasos: Artículo, Detalles y Revisar. /publicar?editar=id precarga el aviso propio del alumno autenticado. El editor conserva estado y fecha original, no acepta publicaciones de demostración y no revela si un aviso ajeno existe. Los controles permiten volver a pasos anteriores; los errores ofrecen una recuperación concreta.

SCOPE: El chat de interés entre comprador y vendedor se construirá como parte del recorrido de coordinación. Mercadito será intermediario y no procesará ni resguardará pagos; cualquier pago se acuerda fuera de la plataforma. El chat no forma parte de esta superficie de edición.

FINISH: build, review the actual mobile and desktop surfaces, run Impeccable's detector on changed UI targets, and preserve the existing editorial system without changing DESIGN.md.
