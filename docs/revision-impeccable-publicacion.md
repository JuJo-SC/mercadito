# Revisión Impeccable: publicación de avisos

## Veredicto

**Apto para continuar el recorrido de publicación en el campus de prueba UMAN.** La superficie conserva La Gaceta de Intercambio y presenta una secuencia reconocible: identificar el artículo, describirlo y revisar el aviso antes de publicarlo. Esta revisión no certifica una integración universitaria real.

La revisión corresponde al código desplegado en `7770361` y a `/publicar`, `ListingForm` y sus estilos compartidos. `DESIGN.md` continúa siendo la fuente de tokens y dirección visual; no requirió cambios.

## Evidencia observada

- La sesión de prueba UMAN abre `/publicar` y ve la franja que pide usar datos ficticios antes de empezar.
- Los tres pasos permiten volver al contenido anterior. En el recorrido de demostración, los valores se conservaron al retroceder.
- La vista final mostró el mismo título, categoría, condición, precio y descripción introducidos.
- El cierre explica que solo estudiantes activos de la universidad podrán ver el aviso, que el interés se coordina por chat y que Mercadito no procesa pagos.
- La revisión visual en escritorio no mostró desbordamiento. En el pase móvil anterior se comprobó la composición a 320 y 390 px sin desbordamiento horizontal.
- No se pulsó «Publicar aviso» en la sesión UMAN; no se creó ningún registro de prueba.

## Dirección visual preservada

Papel cálido, tinta carbón, titulares Newsreader, controles DM Sans, divisiones finas y lima para distinguir el campus de prueba. El formulario prioriza los campos sobre contenedores decorativos y deja la imagen como opción; no introduce fotos de stock ni ilustraciones genéricas.

## Procedencia de los activos raster

Los iconos estáticos aparecen por primera vez junto con `web/public/icons/mercadito-mark.svg` en el commit `6db7f44` (`feat: build university marketplace PWA`). El SVG del repositorio es una composición geométrica propia de Mercadito; el historial no registra un paquete de imágenes de terceros ni una herramienta de exportación concreta.

| Archivos | Evidencia de procedencia |
| --- | --- |
| `web/src/app/icon.png`, `web/public/icons/mercadito-512.png` | PNG idénticos; SHA-256 `73872ef9d131a245b83022dd3f69c7d52580ad52555d024f0498873a608eb1e4`. |
| `web/src/app/apple-icon.png`, `web/public/icons/mercadito-180.png` | PNG idénticos; SHA-256 `db82e03913bee16b0fa0953fe87f729219cb173397fdc5f08cb23690b82422f9`. |
| `web/public/icons/mercadito-192.png`, `web/public/icons/mercadito-maskable-512.png` | Variantes de la familia de iconos añadidas en el mismo commit que el SVG y los PNG anteriores; hashes `99d2efd9b0ac7573b63e33a8d5feb9a609e03dca0f4110af7741419e31ff3b2e` y `e01fd36c1d4014f6aefa1cedaeaae53c5c5388080bcd7e0367e2a6fe90a6fd86`. |

Las fotos de artículos son archivos que cada estudiante selecciona para su aviso, no activos visuales preincluidos en la interfaz.

## Límite pendiente

UMAN sigue siendo un campus de prueba. Activar una universidad real requiere sus metadatos y claims OIDC/SAML; abrir solicitudes públicas de integración requiere el aviso de privacidad aprobado y el canal de atención. Estos requisitos no impiden recorrer el flujo de demostración ni publicar dentro del campus sintético.
