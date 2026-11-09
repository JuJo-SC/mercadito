# Verificación de las vistas con sesión

Diseño privado aprobado por el propietario el 21 de octubre de 2026. Se integró en los componentes reales; no se despliegan el servidor, las rutas simuladas ni los datos de la maqueta.

## Alcance

- Explorar: encabezado agrupado, tarjetas blancas y explicación de filtros en un desplegable.
- Mensajes: encabezado con ayuda compacta y un panel para Ventas, Compras y conversaciones.
- Publicar y editar: panel alineado con el título, tres pasos existentes, campos claros y fotografías sobre verde suave.
- Mis publicaciones: un panel por grupo, Editar visible y Más acciones con todos los cambios de estado existentes.
- Hilo: producto, aviso de prueba y ayuda dentro del contexto; mensajes desplazables y compositor encima de la navegación móvil.
- Perfil: paneles separados para nombre público, facultad y datos privados.
- Movimiento breve y finito; respeto de movimiento reducido. Los desplegables compartidos cierran al pulsar fuera o con Escape.

No cambia el esquema, las API, la autenticación, el aislamiento por campus ni la lógica de publicación, edición o envío. Las cuatro introducciones públicas conservan su diseño.

## Comprobaciones reproducibles en Oracle

Además de lint y typecheck según CONTRIBUTING.md:

```sh
docker build --target runner -t mercadito-web:sesion-candidato ./web
docker build --target migrator -t mercadito-migrator:sesion-candidato ./web
python3 infra/uat/test-session-surfaces.py
```

El script crea una red interna temporal, PostgreSQL en tmpfs, dos identidades sintéticas y sesiones de base de datos mediante el mismo mecanismo que usa Auth.js. Aplica las migraciones solo a esa base y ejecuta la imagen real candidata, sin secretos, volúmenes ni redes de producción. Al terminar retira exclusivamente los contenedores y la red que acaba de crear.

Se revisan seis pantallas en 1440, 390 y 320 px: respuesta correcta, ausencia de desbordamiento horizontal, errores JavaScript, solicitudes fallidas o conexiones externas y movimiento reducido. El hilo comprueba además que Enviar quede dentro del área visible sobre la navegación móvil. Las capturas se inspeccionan en escritorio y celular.

Las interacciones cubren categoría, búsqueda, ficha y Escape; ayuda y Escape; Ventas/Compras; Shift+Enter y envío por Enter; menú de disponibilidad y cambio a Apartado; edición con datos precargados y publicación completa en tres pasos. La última burbuja presenta una animación de 180 ms y una sola iteración, sin bucles.

La prueba HTTP verifica que el catálogo y el hilo sigan restringidos sin sesión, las introducciones públicas respondan correctamente y cada identidad vea únicamente su propio nombre completo, con no-store, sin filtrarlo al catálogo, a la API de publicaciones ni a la sesión. No se usa ninguna cuenta real de alumno para estas pruebas.

En la primera revisión visual se detectó que el aviso externo del campus de prueba desplazaba el compositor bajo la barra móvil. Se integró en el panel del contexto y se añadió la comprobación de geometría antes de desplegar.

Los registros y las capturas permanecen en `.opendesign/artifacts/session-surfaces/`, fuera de Git. La imagen de producción compila con OpenSSL; el contenedor básico de typecheck conserva el aviso conocido de detección de OpenSSL sin impedir la generación ni los tipos.

## Resultado previo al despliegue

Lint, tipos y compilación de producción correctos. Las 18 combinaciones de pantalla y tamaño devolvieron 200, sin desbordamiento horizontal, errores JavaScript, respuestas fallidas ni solicitudes externas. La segunda pasada confirmó el botón de envío visible por encima de la barra inferior. Pasaron las interacciones y las comprobaciones HTTP de privacidad con dos sesiones sintéticas.

DNS y certificados público y de origen vigentes; Caddy y Compose válidos, sin modificaciones de infraestructura.

## Despliegue

Validar Compose y Caddy, resolver DNS y verificar los certificados de HTTPS público y de origen. Publicar el commit revisado y etiquetar la imagen candidata con ese commit. Reemplazar únicamente web con `compose.yml` e `infra/uat/activation.compose.yml`, sin ejecutar migraciones sobre producción. Confirmar salud, registros y respuestas HTTP/HTTPS desde fuera de Oracle.
