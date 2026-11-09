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

## Continuidad entre estaciones y agentes

- La fuente de verdad es este repositorio en `/srv/apps/mercadito` y su historial Git. Abrirlo por Remote-SSH; no crear clones ni copias locales de la aplicación.
- Al iniciar una sesión nueva, comprobar `git status`, rama, commit y servicios actuales. Leer estas instrucciones, `CONTRIBUTING.md`, `docs/arquitectura.md`, `PRODUCT.md` y `DESIGN.md`; para cambios web, leer también `web/AGENTS.md`. No depender del historial de una conversación anterior.
- Antes de cualquier trabajo de diseño, consultar el `.opendesign/BRIEF.md` actualizado. El propietario prefiere pulidos puntuales que conserven la identidad y estructura de Mercadito. Mostrar siempre un ejemplo visual y esperar aprobación expresa antes de implementar. La aprobación de una maqueta no autoriza despliegues.
- Mantener `.opendesign/`, sus proyectos, artefactos y configuración fuera de Git. No iniciar sesión, generar con créditos, publicar ni desplegar como parte del flujo de OpenDesign sin la autorización expresa correspondiente.
