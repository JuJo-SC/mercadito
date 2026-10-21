# Verificacion de las vistas publicas

Cambio aprobado por el propietario el 21 de octubre de 2026. La propuesta de OpenDesign Cloud se adapto a componentes React; no se incrusto la maqueta como una pagina ajena ni se reemplazaron la autenticacion o las pantallas con sesion.

## Alcance

- Portada: panel de bienvenida y un unico recorrido Asi funciona, con textos junto a cada ilustracion y resaltado breve de los pasos.
- Mensajes, Publicar y Mis publicaciones sin sesion: paneles con titulo, explicacion, nota e ilustracion; sin botones introductorios de acceso ni etiquetas visibles de ejemplo.
- Ilustraciones sinteticas estaticas, entregadas en el HTML, sin solicitudes al catalogo ni a fotografias privadas.
- Estilos limitados al contenido publico y a su marco; las rutas y componentes de operacion autenticada conservan su comportamiento.

## Comprobaciones

- ESLint y comprobacion de tipos correctos. La comprobacion inicial con usuario 1001 no pudo regenerar archivos Prisma existentes de root; el comando documentado, sin forzar otro usuario, termino correctamente. El contenedor basico de herramientas aviso de OpenSSL; la imagen de produccion incluye OpenSSL y compilo sin ese aviso.
- Compilacion de produccion correcta con Next.js 16.3.6.
- Chromium en Oracle: cuatro vistas por 1440, 390 y 320 px, todas HTTP 200, sin desbordamiento horizontal ni errores JavaScript. Se inspeccionaron las capturas de escritorio y movil y se confirmaron en una segunda pasada las correcciones de tokens y marco publico.
- El enlace Como funciona llega al recorrido desde otra ruta. El boton principal lleva a /ingresar?returnTo=%2Fmercadito y muestra el acceso institucional existente.
- Con movimiento reducido no hay animaciones activas; el recorrido normal termina sin pasos activos ni bucles.
- No hubo solicitudes a /api/listings desde las vistas publicas. Sin sesion, /api/listings conserva respuesta 404 y /mercadito redirige con 307 al acceso.
- DNS publico vigente, certificado HTTPS publico y de origen validos; Caddy valido sin cambios de configuracion.

Las capturas y el registro detallado permanecen fuera de Git en .opendesign/artifacts/public-implementation/. La propuesta de las pantallas con sesion sigue pendiente de saldo y aprobacion; esta entrega solo aplica la parte publica ya aprobada.
