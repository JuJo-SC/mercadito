# Verificación UAT en Keycloak

Este proveedor conserva la autorización OIDC de Mercadito y comprueba el portal UAT mediante el gateway privado. No representa una integración oficial de UAT ni sustituye un proveedor institucional OIDC/SAML.

## Activación y privacidad

El acceso está cerrado por defecto. `UAT_LOGIN_ENABLED` debe valer exactamente `true` y `UAT_PRIVACY_URL` debe ser una URL HTTPS válida para mostrar el formulario. Con el gate cerrado, ni `authenticate` ni `action` reciben o envían credenciales.

Configurar únicamente fuera de Git:

- `UAT_GATEWAY_URL`: origen interno del gateway, sin ruta, parámetros ni credenciales; por ejemplo, `http://scrap-uat-service:3100`.
- `UAT_GATEWAY_API_KEY`: llave del gateway, en el archivo protegido de entorno del contenedor.
- `UAT_LOGIN_ENABLED`: `false` durante la preparación o las pruebas sin alumnos reales.
- `UAT_PRIVACY_URL`: enlace HTTPS al aviso aplicable.
- `UAT_ALLOWED_MATRICULAS`: lista opcional de matrículas separadas por coma para una prueba cerrada; vacía permite elegibles solo si el gate está habilitado. Una lista mal formada cierra el gate y los ceros iniciales se conservan.
- `UAT_PRIVACY_VERSION`: identificador del aviso aceptado; por defecto `provisional-2026-10-12`.

El formulario solicita consentimiento explícito sin casilla preseleccionada. Solo después de verificar correctamente el portal, el usuario Keycloak conserva `mercadito_privacy_version` y `mercadito_privacy_accepted_at` (UTC). Estos atributos no deben ser editables por el alumno ni mapearse a tokens. No se guardan contraseñas, horarios, calificaciones, cookies del portal ni la respuesta académica.

## Contrato y límites

El cliente llama a `POST /api/v1/alumnos/scrape` con `X-API-Key` y el cuerpo mínimo:

```json
{
  "username": "matricula",
  "password": "contraseña introducida en el formulario",
  "include": {
    "programPage": true,
    "schedule": false,
    "partialGrades": false,
    "finalGrades": false
  }
}
```

El transporte admite hasta 32 MiB y el plazo total de la solicitud es 90 segundos. El lector JSON conserva únicamente source, authenticated, los indicadores exito/cambiaPass del login, la matrícula y los campos de situación de cada programa; descarta imágenes, nombres, parámetros del login y cualquier otro dato adicional sin construir su árbol JSON. Los textos conservados se limitan a 4096 caracteres, las listas a 128 entradas y los objetos de carrera a 512 propiedades por nivel. Se rechazan JSON incompleto, propiedades duplicadas y contenido extra tras el objeto. No se siguen redirecciones. Los mensajes recibidos del gateway no se muestran ni registran.

Se exige `source=UAT`, `authenticated=true`, `login.exito=true` y ausencia de cambio de contraseña pendiente. La matrícula de un programa debe coincidir exactamente con la introducida, conservando ceros iniciales. Se admite matrícula numérica o su correo `@alumnos.uat.edu.mx`.

Solo se aceptan ACTIVO, ACTIVO - REGULARES y REGULARES en un campo reconocido de `programs[].raw` o en `situationFields` de origen `career`. Matrícula ausente/distinta se informa como verificación no disponible. Situaciones vacías, desconocidas o contradictorias de una matrícula coincidente se informan como situación sin confirmar. INACTIVO, BAJA y EGRESADO explícitos del plan coincidente se informan como alumno inactivo. Se rechazan estados contradictorios del mismo programa y no se mezclan matrícula y situación entre programas. La situación global, la selección de carrera, el HTML de Programa y `CicloActivo` no autorizan acceso. Un plan activo independiente puede autorizar aunque otro plan de la misma matrícula esté inactivo.

Las cuentas se identifican internamente como `uat:<matrícula>`; no se reutilizan ni reasignan cuentas UMAN. No se instala una credencial de contraseña local. Si el alumno introdujo el correo institucional, puede conservarse como dato de cuenta sin marcarlo verificado; no se inventa correo a partir de una matrícula.

## Flujo y mappers

Registrar `mercadito-uat-authenticator` como única ejecución `REQUIRED` de un flujo browser específico del nuevo cliente UAT, con tema `mercadito-uat`. No añadir alternativas de cookie, registro, reset de contraseña o contraseña local.

El autenticador emite las notas de sesión `university_id=uat` y `uat_student_verified=true` antes de finalizar. Usar `oidc-usersessionmodel-note-mapper` para trasladarlas a ID token y userinfo. No usar atributos editables para conceder universidad o situación. El cliente debe omitir el scope estándar `profile` para evitar que `preferred_username` revele la matrícula; usar `openid` y los dos mappers específicos. Usar un realm nuevo para UAT y conservar separado el realm y cliente UMAN.

El perfil de usuario del realm debe requerir correo solo con scope email y nombres solo con scope profile; UAT solicita únicamente openid. Conservar las demás validaciones y permisos. Definir los dos atributos de aceptación con permisos de lectura/escritura solo para admin. Sin esta configuración, Keycloak pide completar correo y nombres tras una verificación válida.

## Verificación en Oracle

Desde `/srv/apps/mercadito`:

```sh
docker build -t mercadito-keycloak:uat-candidate infra/keycloak
python3 infra/keycloak/uat-provider/smoke/run.py
```

La construcción ejecuta las pruebas JUnit del parser, del cliente HTTP y del autenticador. El smoke usa un gateway determinista, un realm propio y PostgreSQL sobre tmpfs, en una red temporal sin puertos publicados. Comprueba gate cerrado, login browser, sujeto estable, ID token/userinfo, rechazo de inactivos/credenciales y ausencia de contraseña almacenada y conteo/bloqueo nativo de intentos de contraseña fallidos. Limpia únicamente los contenedores y la red temporal que él mismo creó.

Estas pruebas no acreditan que el contrato actual del portal UAT devuelva una etiqueta elegible para una cuenta real. Confirmar ese contrato con una prueba autorizada antes de habilitar alumnos. La imagen candidata no modifica por sí sola el contenedor ni el realm de producción.

Las etiquetas de carrera admitidas son ACTIVO, ACTIVO - REGULARES y REGULARES, por coincidencia exacta. Consultar las fuentes y el alcance de esta política en docs/integracion-uat.md. Una cuenta autenticada con matrícula coincidente y estado no confirmado presenta uatUnconfirmedStatus; solo los errores de transporte o de contrato presentan uatUnavailable. La lista restringida de matrículas sigue aplicándose antes de consultar el portal.

La comparación de situaciones normaliza únicamente espacios exteriores y mayúsculas/minúsculas; después exige la etiqueta completa del conjunto admitido. Por ejemplo, regulares y REGULARES tienen el mismo significado. INACTIVO, IRREGULARES y REGULARES - BAJA no coinciden con REGULARES.
