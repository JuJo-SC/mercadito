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

Una experiencia universitaria fácil de recorrer y agradable de usar. La referencia de las apps de Apple se traduce en superficies luminosas, jerarquía tipográfica nítida, controles familiares, esquinas suaves y transiciones discretas. La identidad propia de Mercadito vive en el símbolo de tienda y el acento verde; el azul identifica el foco de teclado.

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
- Cabecera adhesiva translúcida con la marca y la universidad asociada. Se oculta al bajar para dar visibilidad a los productos y reaparece al subir.

## Catálogo

La portada pública explica el servicio y no muestra anuncios. El portal autenticado muestra el nombre del campus, la acción para publicar, el aviso de campus de prueba, búsqueda, filtros, orden y catálogo.

En móvil, un botón verde de «Filtros» permanece fijo en el costado inferior derecho, incluso después de recorrer el catálogo. Abre un panel desde la derecha con búsqueda, categorías, orden y avisos completos. El panel tiene desplazamiento independiente y protege el foco mediante un diálogo nativo. Cerrar o Escape recupera la posición del catálogo; buscar o elegir «Ver productos» vuelve al inicio de los resultados. El contador indica filtros activos. El catálogo conserva una indicación breve de campus de prueba junto al total. En escritorio, la barra lateral permanece fija durante todo el recorrido del catálogo, incluso junto a las últimas publicaciones. Su contenido puede desplazarse de forma independiente cuando supera la altura disponible, y se acomoda a la cabecera al ocultarse o reaparecer.

Las tarjetas forman tres columnas amplias, dos en tablet y dos compactas en móvil. La primera foto usa carga diferida; el contador solo aparece cuando existe una imagen. Fotos, precio, condición y estado permanecen legibles con texto.

Al seleccionar una publicación, el navegador abre un `<dialog>` modal centrado. Escritorio reparte fotos y datos en dos columnas. Móvil presenta una hoja a pantalla completa, con la galería arriba y los datos desplazables debajo. Escape, botón de cierre, flechas y puntos permiten salir y recorrer las fotos. La ficha informa título, precio, categoría, condición, descripción, campus, vendedor y fecha; las publicaciones ficticias mantienen su etiqueta.

## Publicación de fotos

Cada publicación permite hasta cinco fotos JPG, PNG o WebP. El formulario permite quitar fotos existentes, añadir otras y reconocer cuál será la principal. Cada archivo fuente pesa hasta 8 MB; la carga completa hasta 20 MB. El servidor corrige orientación y convierte a WebP de hasta 1280 px con calidad inicial 78. Si supera el objetivo de 700 KB, ajusta progresivamente calidad y resolución; conserva un límite de 1.2 MB por foto para casos difíciles sin rechazar imágenes útiles. En edición se conserva el orden de las fotos seleccionadas y las imágenes existentes permanecen en PostgreSQL.

El catálogo descarga únicamente la foto principal de cada tarjeta. Las imágenes restantes se solicitan al recorrer la galería del modal. Los datos de fotos se sirven con sesión del mismo campus y nunca se almacenan en la caché offline de la PWA.

## Navegación y superficies compartidas

El encabezado alinea el símbolo y nombre de Mercadito, la universidad asociada, las opciones del catálogo y el acceso a la cuenta. El campus aparece aquí, sin repetirse en la barra lateral. Publicar se mantiene como opción del encabezado sin añadir otro botón al costado. En escritorio y móvil, la cabecera se oculta al bajar y reaparece al subir; al abrir una sección desde su navegación, la página empieza arriba. En teléfono, una fila compacta da acceso a las tareas principales. Formularios, bandeja de mensajes, acceso institucional y pie de página usan el mismo fondo claro, la misma tipografía y radios suaves.

Mensajes, Mis publicaciones y Publicar usan títulos breves en una línea, con un tamaño de 1.35rem en escritorio y 1.15rem en móvil. La explicación y los avisos completos se consultan desde «Información», mediante un desplegable nativo. El campus de prueba mantiene una indicación breve visible. Las conversaciones, las publicaciones y los campos del formulario aparecen inmediatamente después; los títulos de los pasos de publicación también son compactos.

## Accesibilidad y adaptación

La página admite 320px de ancho, scroll horizontal de categorías, foco azul visible, texto con contraste alto y áreas táctiles de 44px o más. El modal mantiene el foco dentro del detalle y respeta Escape y `prefers-reduced-motion`. El texto nunca depende del color para distinguir condición, contenido de demostración o estado de publicación.

## Verdad del producto

Mercadito pertenece a una universidad activa. Las cuentas UMAN son sintéticas para recorrido; cualquier aviso asociado se etiqueta como ficticio. La plataforma no procesa pagos. La entrega y cualquier pago se acuerdan fuera de Mercadito.
