---
name: Mercadito
description: "Clasificados universitarios para comparar y publicar artículos con claridad."
colors:
  ink-carbon: "#18252D"
  warm-paper: "#FAF9F4"
  paper-secondary: "#F0EEE5"
  paper-quiet: "#E8E6DC"
  muted-ink: "#4B5960"
  ink-rule: "rgba(24, 37, 45, 0.2)"
  signal-lime: "#D6FA45"
  editorial-coral: "#EA5845"
  error-oxblood: "#7B271F"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(3.1rem, 7.2vw, 6.15rem)"
    fontWeight: 500
    lineHeight: 0.96
    letterSpacing: "-0.032em"
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(3rem, 7vw, 5.5rem)"
    fontWeight: 500
    lineHeight: 0.99
    letterSpacing: "-0.032em"
  title:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(2.15rem, 4vw, 3.1rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.026em"
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.045em"
rounded:
  square: "0px"
  fine: "2px"
  circular: "50%"
components:
  button-primary:
    backgroundColor: "{colors.ink-carbon}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.square}"
    padding: "12px 16px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.signal-lime}"
    textColor: "{colors.ink-carbon}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink-carbon}"
    rounded: "{rounded.square}"
  input-search:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.ink-carbon}"
    rounded: "{rounded.square}"
    height: "52px"
  category-tab-selected:
    backgroundColor: "transparent"
    textColor: "{colors.ink-carbon}"
    rounded: "{rounded.square}"
    height: "46px"
  button-search:
    backgroundColor: "{colors.ink-carbon}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.square}"
    padding: "11px 16px"
    height: "52px"
  navigation-link:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.square}"
  classified-entry:
    backgroundColor: "transparent"
    textColor: "{colors.ink-carbon}"
    rounded: "{rounded.square}"
    padding: "12.8px 0"
    height: "88px"
  demo-banner:
    backgroundColor: "{colors.signal-lime}"
    textColor: "{colors.ink-carbon}"
    rounded: "{rounded.square}"
    padding: "12px 14.4px"
  publish-progress:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.square}"
  classified-preview:
    backgroundColor: "transparent"
    textColor: "{colors.ink-carbon}"
    rounded: "{rounded.square}"
    padding: "16px 0 17.6px"
---

# Design System: Mercadito

## Overview

**Creative North Star: "La Gaceta de Intercambio"**

Mercadito convierte los intercambios del campus en clasificados que se pueden recorrer y comparar de un vistazo. La estructura toma de una gaceta estudiantil su cabecera, jerarquía tipográfica y reglas impresas; conserva la agilidad de una aplicación en los controles, la búsqueda y la publicación.

Newsreader da carácter a titulares y precios; DM Sans mantiene legibles los campos, metadatos y acciones. El papel cálido y la tinta carbón dominan la superficie. La lima señala selección y avance; el coral queda reservado para foco, énfasis editorial y señales de error. Las publicaciones ficticias deben identificarse como ejemplos.

**Key Characteristics:**
- Jerarquía editorial breve, con títulos serif y controles sans serif.
- Clasificados ordenados para comparar título, condición y precio antes de abrir detalles.
- Superficies planas, reglas finas y acentos cromáticos con significado funcional.
- Interacción cómoda desde 320 px y formularios progresivos en móvil.

## Colors

La paleta combina papel ligeramente cálido y carbón azulado con una lima activa y un coral de énfasis; cada acento tiene un trabajo distinto.

### Primary
- **Carbón de imprenta** (#18252D): texto principal, cabecera, reglas estructurales y acciones de mayor jerarquía.

### Secondary
- **Lima de señal** (#D6FA45): selección de categorías, progreso completado y avisos de demostración que deben distinguirse de contenido real.

### Tertiary
- **Coral editorial** (#EA5845): foco visible, separadores de metadatos y énfasis interactivo.
- **Oxblood de error** (#7B271F): texto de error y advertencias que requieren una lectura explícita.

### Neutral
- **Papel cálido** (#FAF9F4): fondo principal y superficie de lectura.
- **Papel secundario** (#F0EEE5): paneles suaves, fondos de aviso y pista del progreso.
- **Papel quieto** (#E8E6DC): estado inactivo del progreso.
- **Tinta secundaria** (#4B5960): texto auxiliar y metadatos.
- **Regla de tinta** (rgba(24, 37, 45, 0.2)): divisores que ordenan los clasificados sin encerrar cada artículo en una tarjeta.

**The Two-Accent Rule.** La lima indica selección, avance o demostración; el coral indica foco o énfasis. No intercambies sus funciones.

## Typography

**Display Font:** Newsreader (with Georgia, serif fallback)

**Body Font:** DM Sans (with Arial, sans-serif fallback)

**Label/Mono Font:** DM Sans; no hay una familia monoespaciada dedicada.

**Character:** Newsreader aporta tono impreso y contraste a los titulares y precios. DM Sans conserva una lectura directa en etiquetas, formularios y metadatos densos.

### Hierarchy
- **Display** (500, `clamp(3.1rem, 7.2vw, 6.15rem)`, line-height 0.96): titular principal de portada.
- **Headline** (500, `clamp(3rem, 7vw, 5.5rem)`, line-height 0.99): introducciones de formularios y superficies de acceso.
- **Title** (500, `clamp(2.15rem, 4vw, 3.1rem)`, line-height 1.05): cabeceras de sección.
- **Body** (400, 16px, line-height 1.55): texto corriente; descripciones largas mantienen una medida cómoda, hasta 72ch en avisos.
- **Label** (700, 0.75rem, letter-spacing 0.045em, mayúsculas solo para encabezados de índice): etiquetas cortas, encabezados de columna y estado.

**The Two-Voice Rule.** Reserva Newsreader para titulares, nombre de marca, precios y encabezados; conserva DM Sans para datos que la gente necesita escanear o editar.

## Layout

El contenido usa un ancho fluido con margen lateral adaptable y máximo de 80rem. En la portada, búsqueda y categorías preceden a un índice de clasificados con reglas horizontales; la retícula reduce columnas en pantallas estrechas y oculta metadatos secundarios antes de perder legibilidad. Las categorías se desplazan horizontalmente en anchos intermedios y se compactan en una retícula en pantallas estrechas.

La interfaz admite un ancho mínimo de 320px. Hasta 760px la navegación y los formularios pasan a una composición compacta; hasta 540px baja ligeramente el cuerpo y se compacta la cabecera. En publicación, el recorrido Artículo → Detalles → Revisar mantiene los campos en contexto: la acción de Artículo sigue a categoría y condición, mientras las acciones posteriores pueden permanecer a mano sobre el borde inferior. Respeta el área segura inferior del dispositivo.

## Elevation & Depth

El sistema es plano por defecto. Las reglas, el cambio tonal entre superficies y el espacio separan secciones; los artículos no flotan en tarjetas con sombra. La única sombra estructural observada acompaña el panel de instrucciones de instalación (`0 12px 24px rgba(24, 37, 45, 0.14)`).

**The Flat-By-Default Rule.** Reserva la elevación para un popover que se superpone al contenido; no añadas sombras a filas o formularios.

## Shapes

La geometría es cuadrada y de bordes precisos: la mayoría de botones, avisos, campos y paneles no tiene radio. Los campos de formularios institucionales usan un radio fino de 2px; círculos pequeños quedan para puntos de registro y marcas de estado. Las divisiones de los clasificados son reglas de 1px, no contornos alrededor de cada fila.

## Components

### Buttons
- **Primary:** bloque carbón con texto papel, altura mínima de 48px y padding de 12px 16px; el hover cambia a lima.
- **Text action:** enlace subrayado por una regla inferior; el hover mueve borde y texto al coral/oxblood.
- **Focus:** contorno coral de 3px, desplazado 3px, visible con teclado.

### Chips
- **Category tabs:** pestañas transparentes en una banda desplazable; la seleccionada conserva tinta carbón y recibe una regla inferior lima de 3px.
- **Condition options:** opciones rectangulares de al menos 48px, con fondo de papel secundario al seleccionarse y acento de foco coral.

### Cards / Containers
- **Classified entry:** fila de índice con número, título, categoría, condición, vendedor, precio y disclosure; una regla inferior separa las filas. Al abrirla, descripción, vendedor y fecha aparecen debajo de una regla superior.
- **Preview:** la vista previa de publicación usa regla carbón superior de 2px e inferior fina, con nombre y precio en primer plano.
- **Demo / campus de prueba:** franja de lima con texto carbón y etiqueta explícita para distinguir ejemplos ficticios y campus de prueba de comunidades reales; en UMAN recuerda usar datos ficticios.

### Inputs / Fields
- **Search:** campo sobre papel con borde tenue, alto de 52px y foco coral alrededor del contenedor.
- **Form fields:** superficie clara, borde fino, alto mínimo de 50px; las áreas de texto admiten cambio vertical de tamaño.
- **Price:** símbolo monetario y campo comparten una sola caja para mantener moneda y cantidad alineadas.

### Navigation
La navegación de escritorio usa enlaces sans serif en tinta secundaria. Hover y foco suben el contraste y subrayan en coral. En vista móvil la cabecera se compacta y la navegación principal se sustituye por una banda de tres enlaces.

### Publication flow
El progreso muestra tres etapas. La etapa activa se marca con tinta carbón, las completadas con lima y las futuras con papel quieto. La revisión final conserva título, categoría, condición, precio y descripción antes de confirmar.

## Do's and Don'ts

### Do:
- **Do** mantener visibles título, condición y precio antes de expandir un clasificado.
- **Do** usar la lima para estados activos o contenido de demostración, acompañado de una etiqueta textual.
- **Do** conservar el indicador de foco coral y su separación del control.
- **Do** mantener el primer botón de publicación debajo de sus campos en pantallas móviles estrechas.
- **Do** usar reglas, tipografía y contraste tonal para estructurar la página.

### Don't:
- **Don't** convertir cada aviso en una tarjeta flotante redondeada con sombra.
- **Don't** usar coral como estado seleccionado ni lima como indicador de foco.
- **Don't** presentar contenido ficticio como una oferta real.
- **Don't** colocar una acción fija sobre un control del formulario o sobre el área segura del teléfono.
