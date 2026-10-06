# Contribuir a Mercadito

## Entorno y estructura

El desarrollo, las pruebas y el despliegue se realizan en `/srv/apps/mercadito` en Oracle mediante SSH. El directorio local de administración no contiene código, dependencias ni artefactos. El repositorio es `JuJo-SC/mercadito`, la rama principal es `main` y la aplicación está en https://mercadito.291006.xyz.

Consultar [docs/arquitectura.md](docs/arquitectura.md) antes de crear carpetas. Las decisiones de producto y diseño siguen en [PRODUCT.md](PRODUCT.md) y [DESIGN.md](DESIGN.md).

## Preparar un cambio

1. Comprobar `git status --short`, `git branch --show-current` y `docker compose ps`. Revisar los cambios existentes y no incluir trabajo ajeno.
2. Para tareas nuevas, usar una rama corta: `feat/<descripcion>`, `fix/<descripcion>`, `refactor/<descripcion>` o `docs/<descripcion>`. Evitar mezclar objetivos distintos en una rama. Un mantenimiento directo en `main` debe ser pequeño, autorizado y revisado con las mismas verificaciones.
3. Mantener cada cambio centrado en un objetivo. Separar movimientos de archivos de cambios de comportamiento y evitar reformatear archivos ajenos al objetivo.
4. Mantener el lockfile con las dependencias. No editar migraciones ya aplicadas; crear una migración nueva cuando cambie el esquema.

## Commits y revisión

Usar `tipo(alcance): descripción breve` con un verbo en infinitivo y texto en español. Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `build` y `chore`. Alcances habituales: `listings`, `conversations`, `community`, `auth`, `pwa`, `web`, `infra` y `repo`.

Ejemplos:

```text
feat(listings): permitir ordenar los avisos por precio
fix(conversations): evitar mensajes duplicados al reintentar
refactor(web): agrupar el código por función
docs(repo): documentar el flujo de contribución
```

El cuerpo explica el motivo y cualquier consecuencia relevante. Registrar en la revisión qué cambió, cómo se verificó y qué limitaciones quedan. No reescribir el historial publicado para normalizar commits antiguos.

Antes de cada commit, revisar `git diff`, `git diff --cached` y `git diff --check`. Añadir archivos o carpetas concretos con `git add <rutas>`; evitar incluir todo el directorio sin revisión. No incluir secretos, bases de datos, archivos generados ni datos de producción. Enviar cambios con `git push origin <rama>` usando el acceso existente; añadir una nueva llave o permisos persistentes requiere confirmación del propietario.

## Verificaciones

Desde la raíz del repositorio, validar Compose sin mostrar variables resueltas:

```sh
docker compose config --quiet
```

Si están instaladas las dependencias de `web/`, ejecutar las revisiones en un contenedor de herramientas en el servidor:

```sh
docker run --rm -v /srv/apps/mercadito/web:/app -w /app node:24-bookworm-slim npm run lint
docker run --rm -v /srv/apps/mercadito/web:/app -w /app node:24-bookworm-slim npm run typecheck
```

Si faltan dependencias, preparar ese mismo directorio remoto con `npm ci --ignore-scripts` dentro del contenedor. `typecheck` regenera el cliente de Prisma y los tipos de rutas de Next.js antes de comprobar TypeScript. La configuración de Prisma usa una conexión ficticia cuando no se proporciona `DATABASE_URL`; esta generación no consulta ni modifica la base de datos. Nunca copiar credenciales a Git. La compilación de Docker instala dependencias y genera Prisma con su propia configuración de prueba:

```sh
docker compose build web
```

Lint, tipos y compilación deben pasar. Para cambios de comportamiento, comprobar los casos afectados y añadir pruebas cuando aporten cobertura real. Una reorganización debe conservar rutas, permisos y comportamiento. No desactivar reglas globalmente para esconder errores; cualquier excepción puntual debe explicar una restricción concreta.

Consultar [docs/mantenimiento-pendiente.md](docs/mantenimiento-pendiente.md) para los hallazgos de dependencias que requieren un cambio independiente.

## Publicación y despliegue

Una revisión debe describir el problema y el resultado, las verificaciones realizadas y las migraciones o acciones operativas necesarias. Usar la plantilla de pull request cuando corresponda. Para cambios web sin esquema ni dependencias operativas nuevas, reconstruir la imagen y reemplazar únicamente el servicio web:

```sh
docker compose build web
docker compose up -d --no-deps web
docker compose ps
docker compose logs --tail=100 web
```

Si hay migraciones, revisar primero su efecto sobre los datos y usar el flujo completo documentado en [README.md](README.md). No ejecutar migraciones como efecto secundario de una simple reorganización.

Antes de desplegar, verificar DNS y certificados vigentes. Tras desplegar, comprobar el healthcheck, los logs, `/api/health`, HTTP y HTTPS desde el exterior y las rutas afectadas. Informar URL, commit desplegado, servicios activos y pendientes. Cambiar Caddy solo cuando sea necesario, validarlo y recargarlo sin interrumpir otros proyectos.
