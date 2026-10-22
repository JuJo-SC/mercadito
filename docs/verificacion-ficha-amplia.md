# Verificación de la ficha amplia

## Alcance aprobado

El propietario aprobó la propuesta privada de fotografía ampliada, fecha discreta, contacto compacto y estudiante/categoría/facultad al final y pidió aplicarla a la web. Se mantienen título, precio, descripción, condición, ampliación, navegación de fotos y estilo existente.

El formulario compacto tiene campo de 44px y botón lateral de solo icono, con etiqueta accesible y estado de envío. Conserva el límite de 2,000 caracteres, Enter/Shift+Enter, prevención de duplicados y errores; sus ayudas y contador no se muestran. No se habilita enviar a una publicación propia ni a una ficticia. La fecha usa el formato existente en America/Mexico_City; los datos del vendedor ya eran visibles para la comunidad.

## Comprobaciones

Compose, lint, tipos y compilación correctos. Las 18 combinaciones de superficie/tamaño y los recorridos existentes de filtros, publicación, edición, mensajes y privacidad pasaron en una red Docker interna con PostgreSQL temporal y sesiones ficticias.

La prueba de ficha se adaptó al diseño aprobado y pasó escritorio, móvil de 390px, pantalla corta, 320px y movimiento reducido. Comprueba fecha, orden y visibilidad de datos, campo y flecha de 44px alineados, ausencia de contador y ayuda, cinco fotos, ampliación, Escape, falta de foto, imágenes horizontales y verticales y publicación propia. La prueba envía un primer mensaje con el icono a un vendedor ficticio, abre su conversación y confirma una única copia del mensaje. Ningún mensaje de prueba se envía desde producción.

Foto móvil: marco de 342x342px en 390px de ancho, frente a 342x240px anteriores; galería de escritorio de unos 626px frente a 490px. Sin errores JavaScript ni desbordamientos. Artefactos privados en .opendesign/artifacts/detail-expanded-implementation-20261022/.

El protocolo exige ejecutar código y pruebas en Oracle; no se usa el detector local de Impeccable sobre código remoto. Se revisan geometría, foco, etiquetas accesibles, controles táctiles y preferencias de movimiento directamente en la aplicación candidata.

## Animación con poco contenido

La versión inicial conservó el recorrido original y dejó una alternativa privada pendiente de elección. El propietario aprobó después la animación corta. La actualización completa la reducción en hasta 80px o en el recorrido disponible si es menor; sincroniza el desplazamiento de contenido y la altura de la ficha para evitar un hueco. Conserva la foto grande cuando todo cabe y respeta movimiento reducido. Los resultados de esta actualización están en [verificación de animación corta](verificacion-animacion-corta.md).

## Despliegue

Se reemplaza únicamente web con la imagen validada, sin migraciones ni cambios de datos, Caddy, redes o credenciales. Commit e imagen se registran en el deployment.json privado de esta tarea.

La presentación vigente retira la reducción de la foto y compacta espacios. Ver [ficha estática](verificacion-ficha-estatica.md).
