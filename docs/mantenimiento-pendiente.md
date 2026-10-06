# Mantenimiento pendiente

## Dependencias de herramientas

Revisión realizada el 5 de octubre de 2026 durante la reorganización del proyecto. `npm audit --json` reportó seis entradas de severidad alta, agrupadas en dos avisos:

- Cadena `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- `source-map-js`: [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).

El informe de npm propuso `eslint-config-next@14.2.35` como solución para la primera cadena, mientras el proyecto usa `16.3.6`. No aplicar esa propuesta de forma automática ni usar `npm audit fix --force`: evaluar una actualización compatible o una restricción puntual de la dependencia transitiva.

Resolver en un cambio específico de dependencias: comprobar de nuevo el informe vigente, revisar la cadena y los rangos afectados, actualizar el lockfile y ejecutar lint, tipos y compilación. Confirmar qué paquetes llegan a la imagen final antes de atribuir impacto a la aplicación desplegada. Estas dependencias no se modificaron como parte de la reorganización.
