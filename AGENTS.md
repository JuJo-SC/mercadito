# Reglas de trabajo de Mercadito

Leer [CONTRIBUTING.md](CONTRIBUTING.md) y [docs/arquitectura.md](docs/arquitectura.md) antes de modificar el proyecto. Las instrucciones del propietario sobre el servidor tienen prioridad.

- Trabajar exclusivamente en `/srv/apps/mercadito` en Oracle. El directorio local es solo la entrada administrativa.
- Revisar `git status`, la rama y los servicios antes de editar. Preservar cambios ajenos; no usar operaciones destructivas de Git.
- Agrupar código por función en `web/src/features/<modulo>/`. Dejar rutas en `web/src/app/`, componentes compartidos en `web/src/components/` e infraestructura común en `web/src/lib/`.
- Mantener las fronteras cliente/servidor. No importar Prisma, sesiones o secretos desde componentes cliente. No crear archivos de exportación global que mezclen ambos entornos.
- Leer también `web/AGENTS.md` y las guías de la versión instalada de Next.js antes de editar código web.
- Crear commits pequeños con Conventional Commits en español; separar reorganización, correcciones y cambios de comportamiento. Revisar el diff y añadir rutas explícitas.
- Ejecutar las verificaciones indicadas en CONTRIBUTING antes de publicar. Actualizar documentación cuando cambien rutas, configuración o flujo de trabajo.
- Secretos únicamente en `/srv/secrets/mercadito/`; no versionar credenciales, datos de alumnos, volcados, archivos generados ni dependencias.
- Preservar servicios, volúmenes y configuraciones. No habilitar respaldos automáticos ni añadir permisos persistentes en GitHub sin la autorización exigida por el propietario.
- Informar en español los cambios, verificaciones, commit publicado y cualquier pendiente.
