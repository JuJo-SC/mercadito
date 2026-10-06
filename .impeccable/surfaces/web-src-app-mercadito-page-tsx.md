---
version: 1
slug: "web-src-app-mercadito-page-tsx"
primary_target: "web/src/app/mercadito/page.tsx"
related_targets: ["web/src/features/listings/components/marketplace.tsx", "web/src/components/site-header.tsx", "web/src/app/globals.css", "web/src/app/api/listings/[id]/photo/route.ts"]
---

# Superficie: catálogo del campus

MODE: Operate

## Direction contract

THESIS: El estudiante encuentra, compara y revisa artículos de su universidad antes de iniciar una conversación.

OWN-WORLD: Interfaz clara de app nativa: fondo gris muy tenue, superficies blancas, tipografía del sistema, radios suaves y un acento verde propio de Mercadito. El catálogo prioriza fotografía, precio, condición y lectura rápida.

STORY: La comunidad autenticada entra a su campus, busca productos, filtra por categoría o fecha y abre un aviso cuando quiere ver todas sus características. La ficha muestra galería, descripción, vendedor, campus, condición, fecha y precio; desde allí puede iniciar conversación. Mercadito no procesa pagos.

FIRST VIEWPORT: Cabecera fija de 64px con marca y universidad. En escritorio, lateral de 280px (248px en tablet) con Explorar, Mensajes, Publicar y Mis publicaciones; los filtros aparecen debajo en ese mismo lateral con scroll independiente. Los productos ocupan el resto de la pantalla. En móvil, barra inferior fija de 70px más área segura con las mismas cuatro tareas. El botón de filtros queda encima de esa barra. La cuadrícula muestra dos tarjetas por fila desde 320px; foto cuadrada, precio primero y nombre visible.

NAVIGATION: La sección activa se identifica con aria-current, texto firme y verde suave. Conversaciones y edición conservan la selección de su sección. Al elegir una sección, la página abre desde arriba. Las barras de aplicación permanecen visibles al desplazarse.

FORM: Tarjetas de catálogo con foto principal de carga diferida. Un `<dialog>` modal protege el foco y deja recorrer hasta cinco fotos con flechas o indicadores; en teléfono se convierte en una hoja de pantalla completa. Los estados de error, carga y catálogo vacío ofrecen una acción de recuperación.

SCOPE: La identidad universitaria define acceso y datos. Las publicaciones y fotos solo se entregan a estudiantes activos del mismo campus. Los avisos de UMAN son ejemplos ficticios.

FINISH: revisar una vista móvil y otra amplia, ejecutar el detector de Impeccable en los archivos UI modificados y actualizar DESIGN.md junto con su archivo de tokens; verificar healthcheck y HTTPS después del despliegue.
