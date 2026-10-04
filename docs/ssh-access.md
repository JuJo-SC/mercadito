# Acceso administrativo por HTTPS

La entrada `ssh.291006.xyz` transporta SSH mediante WebSocket cifrado sobre HTTPS en el puerto público 443. Permite administrar Oracle desde redes que bloquean el puerto 22, siempre que permitan el dominio y WebSocket. El puerto interno de SSH sigue siendo 22.

Desde la carpeta local de administración del equipo Windows autorizado:

```powershell
ssh -F ./ssh-https.config oracle-https
```

La conexión usa el cliente nativo de Windows y la llave privada existente, que permanece exclusivamente en el equipo. El certificado HTTPS y la identidad SSH del servidor se verifican. La herramienta cliente es wstunnel 11.0.0. Sus credenciales se guardan fuera de Git con permisos limitados al usuario y SYSTEM.

## Servicio del servidor

- Compose activo: `/srv/apps/ssh-access/compose.yml`.
- Proxy: `/srv/infra/caddy/sites/ssh-access.caddy`.
- Secretos: `/srv/secrets/ssh-access/`, fuera de Git.
- Imagen oficial wstunnel 11.0.0, fijada por digest.
- Contenedor `ssh-access`, conectado a la red `edge`, sin publicar puertos adicionales.
- Reinicio automático `unless-stopped`, comprobación de salud, sistema de archivos de solo lectura y capacidades eliminadas.
- Solo permite TCP a `172.18.0.1:22`; otros destinos, puertos, UDP y túneles inversos quedan rechazados.
- El archivo de restricciones tiene modo 640 y grupo 1001; el contenedor utiliza UID 1000 y grupo adicional 1001 para leerlo. La credencial del cliente tiene modo 600 y el directorio modo 700.
- Mantener la autenticación SSH por llave, sin contraseñas ni acceso root.

Las copias de Compose y Caddy en `infra/ssh-access/` documentan la configuración desplegada. Al modificarlas, actualizar sus ubicaciones activas. El ejemplo de restricciones contiene solo un marcador: generar el prefijo aleatorio privado fuera de Git.

## Validación del 4 de octubre de 2026

Se inició una sesión real desde el equipo Windows hasta Oracle por HTTPS 443 con la llave existente. El túnel rechazó el puerto 5432 y un prefijo incorrecto. HTTPS respondió 200, HTTP redirigió con 308 y Mercadito respondió 200. Caddy recargó mediante SIGUSR1 sin reiniciar su contenedor. La red de la universidad requiere una prueba desde allí.

Documentación oficial: [wstunnel](https://github.com/erebe/wstunnel) y [recarga de Caddy](https://caddyserver.com/docs/command-line#signals).
