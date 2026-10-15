# Acceso institucional breve y centrado

- Pantalla /ingresar con tarjeta de hasta 480px, texto y botón centrados. Título «Entra al mercadito», descripción sobre la cuenta institucional y botón «Iniciar sesión». Aviso de privacidad visible; sin referencias a una universidad en el contenido principal.
- Se conservan la acción institucional existente, el cierre de sesión previo, la validación de destinos y las condiciones de acceso, prueba y sesión activa. No hay cambios en Keycloak, permisos ni datos.
- Lint, tipos y compilación de producción correctos. Detector Impeccable sin hallazgos en los archivos de la pantalla.
- Vista previa privada de la imagen compilada con configuración externa vigente, sin publicar puertos. Chromium en 1440x900, 390x844 y 320x740: tarjeta centrada, contenido principal sin UAT, botón de 50px, enlace de privacidad, foco de teclado, destino /mensajes conservado, sin errores del navegador ni desbordamientos. Un destino externo se normaliza a /mercadito.
- Capturas en `.qa/access-1440.png`, `.qa/access-390.png` y `.qa/access-320.png`, fuera de Git; escritorio y móvil inspeccionados visualmente.
- DNS y certificado HTTPS del origen verificados antes del despliegue. El despliegue reemplaza solo el servicio web y conserva la configuración UAT activa.
