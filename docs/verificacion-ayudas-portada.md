# Ayudas breves en la portada pública

## Resultado

Mensajes, Publicar y Mis publicaciones muestran explicaciones permanentes junto a la navegación lateral de escritorio, como solicitó el propietario. Las muestras ilustran una conversación, tipos de productos y un artículo en venta. En móvil, las mismas ayudas aparecen en «Así funciona»; la barra inferior conserva su altura.

Los textos explican el chat con compradores y vendedores, el teléfono opcional, artículos sin uso, ropa, emprendimientos sujetos al reglamento y administración de las publicaciones. Se mantiene el acceso al login con el destino seleccionado. Este cambio no habilita registro público de cuentas ni modifica la configuración de identidad del campus de prueba.

## Verificación

- Compose válido, lint, tipos y compilación Docker correctos.
- Detector Impeccable sin hallazgos en los cinco objetivos de interfaz.
- Revisión con Chromium de la imagen compilada a 320, 390, 820, 1024 y 1440px, incluyendo escritorio de 600px de alto: tres explicaciones visibles en la superficie correspondiente, sin desbordamiento horizontal en página o lateral.
- En móvil, navegación inferior menor de 100px; ayudas fuera de la barra.
- Mensajes, Publicar y Mis publicaciones llevan al login con `returnTo` correcto, incluido el campo del formulario. El botón general conserva el destino al catálogo.
- Las ayudas solo aparecen en la portada pública: no se incorporan al login ni a la demostración de publicación; la navegación autenticada conserva su rama anterior.
- Sin errores de JavaScript, publicaciones, mensajes ni solicitudes de escritura durante la revisión.
- DNS, HTTPS público y certificado del origen verificados antes del despliegue. Servicio web, logs, healthcheck y acceso HTTP/HTTPS comprobados después.

Evidencia de revisión fuera de Git en `.impeccable/review/landing-guide/`.
