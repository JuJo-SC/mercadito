# Dirección visual del producto

THESIS: Mercadito vuelve cada intercambio del campus un catálogo que se puede comparar; la landing pública presenta el servicio y el portal autenticado funciona como marketplace.

OWN-WORLD: Gaceta estudiantil en carbón #18252D, papel cálido #FAF9F4, lima #D6FA45 y coral #EA5845. Newsreader sostiene titulares; DM Sans mantiene claros los controles.

STORY: Visitante entiende el servicio sin ver anuncios. Alumno entra con identidad institucional, Mercadito resuelve su universidad y le muestra el catálogo de su campus. Busca, filtra, compara, publica o inicia una conversación de texto. Los pagos se acuerdan fuera de Mercadito.

FIRST VIEWPORT: Landing sin inventario ni clasificados. Catálogo autenticado con nombre del campus, aviso de prueba si corresponde, acción para publicar, buscador, categorías, orden por actividad o fecha y lista de artículos.

TRENDING: La señal de interés es el número de conversaciones iniciadas por artículo. No se inspecciona ni comparte el contenido. Si no hay actividad, el orden inicial es por fecha reciente.

FORM: La Gaceta de Intercambio, recomendación de Impeccable aceptada por la persona usuaria con “Elige tú por mí”. Clave de semilla: dc2d0cbd (scope direction, mode experience); opción model-pick, kind pick.

## Revisión de entrega — 2026-09-28

**Veredicto:** la portada pública y el catálogo del campus están separados. En una sesión UMAN, /mercadito resolvió el campus desde la identidad del alumno y mostró avisos, búsqueda, categorías, orden por interés y acceso a publicar. /publicar conservó los tres pasos y ya ofrece Comida. El mercado indica que UMAN es de prueba y aclara que los pagos se acuerdan fuera.

**Rutas y servicio:** sin sesión, / devuelve HTTP 200 con la portada y sin artículos; /mercadito devuelve HTTP 307 hacia /ingresar?returnTo=%2Fmercadito. El healthcheck reporta aplicación y base de datos disponibles; HTTPS valida el certificado.

**Móvil:** revisé las composiciones CSS de portada y catálogo en los cortes de 920, 760 y 540 px y el ancho mínimo de 320 px definido por el sistema. No pude obtener una captura raster nueva desde Oracle: el servidor no tiene Chromium ni Playwright y el navegador disponible expuso el árbol de accesibilidad. Las capturas en review/capture-report.json corresponden a la portada anterior y se consideran obsoletas; no son evidencia visual de esta entrega.

**Evidencia raster:** ninguna captura nueva. La verificación visual por píxeles queda pendiente de un entorno con captura de navegador; no se afirma una aprobación raster.
