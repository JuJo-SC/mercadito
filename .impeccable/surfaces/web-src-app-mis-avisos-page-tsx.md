---
version: 1
slug: "web-src-app-mis-avisos-page-tsx"
primary_target: "web/src/app/mis-avisos/page.tsx"
related_targets: ["web/src/components/manage-listings.tsx","web/src/app/globals.css","web/src/components/site-header.tsx"]
---

# Superficie: mis avisos

MODE: Operate

SEED_KEY: dc2d0cbd (heredada de la dirección aprobada, scope direction, mode experience).

## Direction contract

THESIS: El estudiante conserva el control de los clasificados que publica y puede reflejar con claridad cuándo están disponibles, apartados, vendidos o archivados.

OWN-WORLD: Extiende La Gaceta de Intercambio: índice de filas planas, jerarquía editorial breve, reglas de tinta y estados textuales; la lima identifica disponibilidad publicada.

STORY: Desde la confirmación de publicación, el estudiante llega a su índice personal. Cada fila conserva título, precio, categoría, condición y fecha; sus acciones actualizan el estado sin borrar el aviso ni afectar a publicaciones ajenas. El índice vacío lleva a publicar el primer artículo. En UMAN, una franja lima recuerda que el campus es de prueba.

FIRST VIEWPORT: En móvil, el título, el conteo, la primera publicación o el estado vacío, y su siguiente acción aparecen antes de abrir menús o navegar a otra sección. Las acciones permanecen dentro del flujo y respetan focos visibles y blancos táctiles de 44px.

FORM: Página operativa /mis-avisos, accesible solo con sesión estudiantil activa; la API verifica propiedad, universidad y estado al mutar. Las transiciones permitidas evitan que una actualización concurrente sobrescriba otro cambio.

OPEN: Este recorrido solo cambia disponibilidad; contacto, lugar de intercambio y pagos siguen pendientes.

FINISH: build, review and document the inherited system extension without changing DESIGN.md.
