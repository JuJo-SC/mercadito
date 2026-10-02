---
version: 1
slug: "web-src-app-mercadito-page-tsx"
primary_target: "web/src/app/mercadito/page.tsx"
related_targets: ["web/src/components/marketplace.tsx", "web/src/components/site-header.tsx", "web/src/app/globals.css", "web/src/app/api/listings/[id]/photo/route.ts"]
---

# Superficie: catálogo del campus

MODE: Operate

## Direction contract

THESIS: El estudiante encuentra, compara y revisa artículos de su universidad antes de iniciar una conversación.

OWN-WORLD: Interfaz clara de app nativa: fondo gris muy tenue, superficies blancas, tipografía del sistema, radios suaves y un acento verde propio de Mercadito. El catálogo prioriza fotografía, precio, condición y lectura rápida.

STORY: La comunidad autenticada entra a su campus, busca productos, filtra por categoría o fecha y abre un aviso cuando quiere ver todas sus características. La ficha muestra galería, descripción, vendedor, campus, condición, fecha y precio; desde allí puede iniciar conversación. Mercadito no procesa pagos.

FIRST VIEWPORT: Cabecera compacta con marca y universidad a la izquierda y opciones de catálogo/publicación junto a ella. La identidad no se repite en la barra lateral. El aviso de prueba, búsqueda y categorías preceden a la cuadrícula. En 320px siguen visibles dos tarjetas con imagen, título, condición y precio.

NAVIGATION: Al elegir una sección desde la cabecera, la página abre desde arriba. La cabecera se oculta al bajar y reaparece al subir, tanto en escritorio como en móvil.

FORM: Tarjetas de catálogo con foto principal de carga diferida. Un `<dialog>` modal protege el foco y deja recorrer hasta cinco fotos con flechas o indicadores; en teléfono se convierte en una hoja de pantalla completa. Los estados de error, carga y catálogo vacío ofrecen una acción de recuperación.

SCOPE: La identidad universitaria define acceso y datos. Las publicaciones y fotos solo se entregan a estudiantes activos del mismo campus. Los avisos de UMAN son ejemplos ficticios.

FINISH: revisar una vista móvil y otra amplia, ejecutar el detector de Impeccable en los archivos UI modificados y actualizar DESIGN.md junto con su archivo de tokens; verificar healthcheck y HTTPS después del despliegue.
