# Introducciones públicas por apartado

Este ajuste sustituye las explicaciones que se habían añadido al lateral. El propietario corrigió la ubicación: las ayudas deben aparecer en la pantalla al pulsar cada apartado.

## Resultado

- Portada, lateral y barra inferior recuperan su composición compacta.
- Sin sesión, Mensajes, Publicar y Mis publicaciones muestran una explicación breve y un ejemplo visual amplio dentro de su propia ruta.
- Cada botón de acceso conserva el destino en `returnTo`. Publicar permite abrir su demostración.
- Con sesión se conserva la función operativa. Las API permanecen protegidas; no se habilita registro público ni se modifica el proveedor de identidad.

## Verificación

- Compose, lint, tipos y compilación Docker correctos; detector Impeccable en los objetivos modificados.
- Revisión de las tres introducciones a 320, 390, 820 y 1440px, sin desbordamiento horizontal.
- Navegación activa correcta, ejemplos identificados, acceso de al menos 44px, foco de teclado y destino del login verificados.
- Portada sin ayudas en lateral ni sección móvil añadida. Demostración y acceso para edición conservados.
- Conversaciones y fotos devuelven 401 sin sesión; el catálogo devuelve 404 sin exponer datos. Introducción visible también sin JavaScript.
- Sin errores de JavaScript ni solicitudes de escritura a las API durante la revisión.
- DNS, certificado del origen, HTTP/HTTPS, healthcheck y logs verificados antes y después del despliegue según corresponde.

Evidencia operativa fuera de Git en `.impeccable/review/feature-intros/`.
