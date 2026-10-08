---
name: Mercadito
description: "Un mercado universitario ligero y claro, con una interfaz cuidada como una app nativa."
colors:
  paper: "#F5F5F7"
  paper-alt: "#FFFFFF"
  paper-quiet: "#E8E8ED"
  surface: "#FFFFFF"
  ink: "#1D1D1F"
  muted: "#6E6E73"
  rule: "rgba(29, 29, 31, 0.13)"
  signal: "#167D62"
  signal-soft: "#E7F4EE"
  coral: "#087FF5"
  error: "#A4262C"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.15rem)"
    fontWeight: 680
    lineHeight: 1.04
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif"
    fontSize: "clamp(1.65rem, 3vw, 2.25rem)"
    fontWeight: 680
    lineHeight: 1.08
    letterSpacing: "-0.042em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif"
    fontSize: "1.2rem"
    fontWeight: 680
    lineHeight: 1.3
    letterSpacing: "-0.035em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  control: "12px"
  field: "15px"
  card: "16px"
  dialog: "25px"
  pill: "999px"
components:
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "#FFFFFF"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "54px"
  category-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
  listing-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    photoRatio: "1.25"
  listing-detail-dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    maxWidth: "66rem"
---

# Mercadito — sistema visual

## Idea central

Una experiencia universitaria fácil de recorrer y agradable de usar. La referencia elegida por el propietario es Facebook Marketplace: navegación permanente, productos al centro y controles familiares. Mercadito conserva sus superficies luminosas, tipografía del sistema y acento verde. La identidad propia de Mercadito vive en el símbolo de tienda y el acento verde; el azul identifica el foco de teclado.

El catálogo ayuda a descubrir y comparar productos con rapidez. Cada publicación muestra primero foto, nombre, condición y precio. Al abrirla, una ficha modal reúne galería, descripción, campus, fecha, vendedor y acceso a la conversación.

## Color

- **Fondo** (#F5F5F7): lienzo general con contraste suave frente a las superficies.
- **Superficie** (#FFFFFF): cabecera, formularios, campos, tarjetas y ficha de producto.
- **Tinta** (#1D1D1F): títulos, precios y acciones principales.
- **Texto secundario** (#6E6E73): fechas, categorías y ayuda.
- **Regla** (rgba(29, 29, 31, 0.13)): divisores y bordes de bajo contraste.
- **Verde Mercadito** (#167D62): acción principal, categoría seleccionada y enlaces de acción.
- **Verde suave** (#E7F4EE): señal de campus de prueba y superficies de apoyo.
- **Azul de foco** (#087FF5): foco visible y teclado.
- **Rojo de error** (#A4262C): errores con texto que explica cómo recuperarse.

## Tipografía

La pila del sistema usa SF Pro en dispositivos Apple y sus equivalentes nativos en otras plataformas. Los títulos y precios emplean un peso firme y tracking corto; los datos y descripciones conservan un tamaño cómodo y altura de línea generosa. Los números de precio mantienen cifras tabulares.

## Geometría y profundidad

- Campos: 15px de radio y 54px de alto en búsqueda.
- Botones: 12–13px, al menos 44px de zona interactiva.
- Tarjetas: 16px, borde tenue y sombra corta que aparece al pasar el cursor.
- Ficha de detalle: 25px en escritorio; ocupa la pantalla del teléfono como una hoja modal.
- Cabecera blanca fija de 64px con marca, universidad y acciones de cuenta. En escritorio identifica la sección activa; en móvil deja las tareas principales a la barra inferior.

## Catálogo

La portada pública muestra una introducción compacta y una cuadrícula estática de hasta ocho productos: foto, precio y nombre. Mantiene las etiquetas de ejemplo y el acceso protegido; no muestra vendedores ni fotos originales. Las tarjetas llevan al inicio de sesión. El catálogo autenticado conserva búsqueda, categorías, orden y fichas completas. El precio precede visualmente al título, y la fotografía ocupa una superficie cuadrada con radio de 12px.

En móvil, un botón verde de «Filtros» permanece fijo en el costado inferior derecho, incluso después de recorrer el catálogo. Abre un panel desde la derecha con búsqueda, categorías, orden y avisos completos. El panel tiene desplazamiento independiente y protege el foco mediante un diálogo nativo. Cerrar o Escape recupera la posición del catálogo; buscar o elegir «Ver productos» vuelve al inicio de los resultados. El contador indica filtros activos. El catálogo conserva una indicación breve de campus de prueba junto al total. En escritorio, los filtros se integran debajo de las cuatro tareas principales en el mismo lateral fijo de 280px (248px en tablet). Tienen desplazamiento independiente y dejan libre la identificación de comunidad al pie.

La cuadrícula usa columnas fluidas de al menos 200px en escritorio y dos columnas en tablet y móvil. La primera foto usa carga diferida; el contador solo aparece cuando existe una imagen. Fotos, precio, condición y estado permanecen legibles con texto.

Al seleccionar una publicación, el navegador abre un `<dialog>` modal centrado. Escritorio reparte fotos y datos en dos columnas. Móvil presenta una hoja a pantalla completa, con la galería arriba y los datos desplazables debajo. Escape, botón de cierre, flechas y puntos permiten salir y recorrer las fotos. La ficha informa título, precio, categoría, descripción, condición, vendedor y fecha; las publicaciones ficticias mantienen su etiqueta.

La ficha presenta la descripción inmediatamente después del título y el precio. Debajo quedan la condición, quién publicó y la fecha; se omite el campus porque esta etapa usa una sola universidad. Este ajuste no incorpora facultades ni modifica el aislamiento por universidad.

Al finalizar una publicación o edición, la confirmación usa una superficie blanca, texto oscuro y un icono verde sobre verde suave. Los enlaces conservan el verde de acción con contraste legible y al menos 44px de altura; en móvil se apilan para facilitar su uso.

## Publicación de fotos

Cada publicación permite hasta cinco fotos JPG, PNG o WebP. El formulario permite quitar fotos existentes, añadir otras y reconocer cuál será la principal. Cada archivo fuente pesa hasta 8 MB; la carga completa hasta 20 MB. El servidor corrige orientación y convierte a WebP de hasta 1280 px con calidad inicial 78. Si supera el objetivo de 700 KB, ajusta progresivamente calidad y resolución; conserva un límite de 1.2 MB por foto para casos difíciles sin rechazar imágenes útiles. En edición se conserva el orden de las fotos seleccionadas y las imágenes existentes permanecen en PostgreSQL.

El catálogo descarga únicamente la foto principal de cada tarjeta. Las imágenes restantes se solicitan al recorrer la galería del modal. Los datos de fotos se sirven con sesión del mismo campus y nunca se almacenan en la caché offline de la PWA.

## Navegación y superficies compartidas

La navegación compartida ofrece Explorar, Mensajes, Publicar y Mis publicaciones en el lateral de escritorio. En móvil, una barra inferior de 70px más el área segura muestra las mismas tareas y conserva la etiqueta completa «Mis publicaciones». Iconos Lucide de 22px y etiquetas identifican cada sección. La sección activa combina texto, verde suave y aria-current, incluyendo conversaciones y edición de avisos. El contador de mensajes sin leer sigue actualizándose.

La cabecera, el lateral y la barra inferior permanecen visibles durante el recorrido. El contenido reserva su espacio, los filtros flotantes quedan encima de la barra inferior y los diálogos nativos se presentan sobre toda la interfaz. La portada usa el mismo marco de aplicación; los accesos privados conservan returnTo al pedir sesión. Las pantallas autenticadas prescinden del pie promocional. Formularios y chat conservan sus flujos; la bandeja distingue Ventas y Compras según el papel del estudiante en cada conversación. Al cambiar de sección, la página empieza arriba.

Mensajes, Mis publicaciones y Publicar usan títulos breves en una línea, con un tamaño de 1.35rem en escritorio y 1.15rem en móvil. La explicación y los avisos completos se consultan desde «Información», mediante un desplegable nativo. El campus de prueba mantiene una indicación breve visible. Las conversaciones, las publicaciones y los campos del formulario aparecen inmediatamente después; los títulos de los pasos de publicación también son compactos.

## Mensajes y Mis publicaciones

Estas superficies extienden el mismo sistema claro, con superficies blancas, tipografía del sistema, verde de acción y foco azul. Las miniaturas de producto permiten reconocer el artículo; cuando falta la foto o su carga falla, aparece «Sin foto» con un icono. Las etiquetas de estado conservan texto y contraste legible.

Mensajes abre en Ventas y permite cambiar a Compras mediante dos controles de al menos 44px, con selección y contadores visibles. Ventas reúne conversaciones donde el estudiante es vendedor; Compras, donde es comprador. El último emisor modifica «Por responder» o «Esperando respuesta», sin cambiar esa pertenencia. Cada sección conserva el orden por actividad reciente. La fila presenta foto y título antes del nombre de la otra persona, además de precio, último mensaje, actividad, disponibilidad y mensajes sin leer. En móvil la miniatura se reduce a 72px y la flecha se oculta para dar espacio al contenido.

Mis publicaciones presenta la foto propia junto a estado, fecha, título, precio, categoría y condición. Las secciones aparecen en este orden: En venta (publicadas y apartadas), Borradores, Archivadas y Vendidas; las vacías se omiten. Las tarjetas forman una columna y pasan a dos desde 1200px. Editar y las acciones disponibles para cada estado se distribuyen en una cuadrícula de dos columnas, con controles de al menos 44px. Una respuesta correcta mueve la publicación a su grupo sin recargar; durante el guardado se indica actividad y un fallo conserva el estado anterior con su explicación.

Apartar pausa el catálogo y la apertura de nuevos hilos, mientras las conversaciones existentes continúan. No implica reserva para una persona ni pago. «Quitar apartado» vuelve a publicar el artículo. La explicación completa permanece en «Información» y el índice conserva una ayuda breve junto a las acciones.

## Accesibilidad y adaptación

La página admite 320px de ancho, scroll horizontal de categorías, foco azul visible, texto con contraste alto y áreas táctiles de 44px o más. El modal mantiene el foco dentro del detalle y respeta Escape y `prefers-reduced-motion`. El texto nunca depende del color para distinguir condición, contenido de demostración o estado de publicación.

## Verdad del producto

Mercadito pertenece a una universidad activa. Las cuentas UMAN son sintéticas para recorrido; cualquier aviso asociado se etiqueta como ficticio. La plataforma no procesa pagos. La entrega y cualquier pago se acuerdan fuera de Mercadito.
