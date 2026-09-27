# Integrar la identidad de una universidad

## Estado actual

La aplicación autentica a estudiantes mediante OIDC contra el realm mercadito de Keycloak. Keycloak puede federar proveedores institucionales OIDC o SAML y traducir sus datos al perfil que recibe la aplicación. Aún no hay un proveedor institucional real conectado.

UMAN es un campus de prueba con cuentas sintéticas locales. Sirve para recorrer el flujo, pero no verifica matrícula. La recepción de solicitudes universitarias continúa deshabilitada hasta contar con el aviso de privacidad aprobado y el canal de atención.

## Contrato de identidad que consume la aplicación

Después de la autenticación federada, el perfil OIDC que Keycloak entrega al cliente mercadito-web debe incluir:

| Claim | Requisito |
| --- | --- |
| **sub** | Identificador estable de la cuenta en el realm de Keycloak. |
| **email** | Correo no vacío. Sirve como dato de cuenta; el dominio no demuestra matrícula. |
| **university_id** | Identificador estable de la institución, igual al valor de University.identityKey. |
| Claim de estatus | El nombre se configura en University.studentStatusClaim; su valor debe coincidir exactamente con University.studentStatusValue. |

El claim de estatus puede ser texto, booleano o número; la aplicación compara su representación textual. Por ejemplo, un booleano true corresponde al valor de texto "true". Los claims deben llegar como valores planos; objetos o arreglos anidados no se interpretan como estatus.

La aplicación rechaza el acceso si falta cualquiera de estos datos, el claim institucional no coincide, el estudiante no está activo, la universidad no está activa o la cuenta pertenece a un registro de demostración. No usar el dominio del correo como sustituto del claim de matrícula.

Una vez vinculada una cuenta federada, su campus no cambia automáticamente. En cada inicio de sesión la aplicación vuelve a resolver los claims y exige que el sub coincida con la cuenta Keycloak vinculada y que la universidad activa sea la misma que ya está asociada al usuario. Si cambia el university_id, la cuenta o su estado, se rechaza el acceso; no se migra el perfil ni sus publicaciones a otro campus de forma implícita.

## Datos que solicitar a la institución

Recibir la información por un canal institucional verificado y no solicitar contraseñas personales:

- Nombre público, sitio oficial y slug acordado para el campus.
- Protocolo disponible: OIDC o SAML 2.0.
- URL de metadatos OIDC o URL/archivo de metadatos SAML.
- Identificador estable de universidad que aparecerá como university_id.
- Nombre exacto del claim o atributo que representa el estatus activo del alumno y el valor exacto que tendrá un alumno activo.
- Confirmación de que el identificador de cuenta se mantiene estable y de que email, nombre y apellidos pueden entregarse según la política institucional.
- Contactos técnicos para la configuración y pruebas, separados de la información necesaria para una solicitud pública.

## Configuración en Keycloak

1. En el realm mercadito, agregar un proveedor bajo **Identity Providers**. Para OIDC se requiere el flujo de código de autorización; se puede importar el discovery document. Para SAML, importar el descriptor de la institución.
2. Usar un alias único por campus. Si hay varias universidades, dejar que el usuario elija su proveedor en Keycloak en vez de forzar un proveedor predeterminado.
3. Copiar desde la pantalla de Keycloak la URL de retorno o los datos del Service Provider que debe registrar la institución. No confundir el callback institucional hacia Keycloak con el callback de la aplicación hacia Keycloak.
4. Agregar *identity provider mappers* para trasladar el identificador institucional y el estatus de alumno al usuario federado de Keycloak. Si la institución no entrega university_id, el valor se puede asignar por proveedor únicamente cuando la vinculación de ese proveedor con la institución haya sido verificada por el operador.
5. Configurar los *protocol mappers* o *client scopes* del cliente mercadito-web para que university_id, el claim de estatus, sub y email estén disponibles en el perfil OIDC que consume la app.
6. Crear o activar el registro de la universidad con un identityKey único y los valores exactos de studentStatusClaim y studentStatusValue. No habilitar el campus hasta completar la prueba de claims.
7. No guardar secretos del proveedor en Git, issues ni documentación. Configurarlos únicamente en el administrador seguro de Keycloak.

### Endpoints de este proyecto

- OIDC de Keycloak para la aplicación: https://auth.291006.xyz/realms/mercadito/.well-known/openid-configuration
- Descriptor SAML del realm para que lo consulte una institución: https://auth.291006.xyz/realms/mercadito/protocol/saml/descriptor
- Callback OIDC de la aplicación hacia Keycloak: https://mercadito.291006.xyz/api/auth/callback/keycloak

El callback que la institución debe registrar como retorno de su proveedor es el que muestra la configuración del identity provider en Keycloak; no es el callback anterior.

## Pruebas de aceptación

Antes de activar un campus real, comprobar con cuentas de prueba controladas por la universidad:

- Alumno activo con claims válidos: puede iniciar sesión y solo consultar el mercadito de su campus.
- Cuenta inactiva: el acceso se rechaza.
- university_id ausente o de otra universidad: el acceso se rechaza.
- Cuenta ya vinculada cuyo university_id cambió a otro campus, cuyo sub dejó de coincidir o cuya universidad/estatus ya no está activo: el acceso se rechaza y no se reasigna el usuario.
- Claim de estatus ausente o con otro valor: el acceso se rechaza.
- sub o email ausente: el acceso se rechaza.
- Publicaciones y conversaciones no pueden consultarse desde una cuenta de otro campus.

Repetir la prueba tras cambiar o renovar metadatos, certificados o claims. No activar cuentas ni anuncios reales a partir de una captura, una coincidencia de correo o una afirmación no comprobada.

## Pendientes de operación

- Aún falta el proveedor y los claims de una universidad piloto real.
- Aún falta el aviso de privacidad aprobado y el canal de atención para abrir solicitudes.
- El portal actual no incluye una consola para aprobar solicitudes ni activar universidades; la activación es una tarea operativa controlada.
- Los cinco usuarios UMAN son sintéticos y no deben reutilizarse como cuentas reales.

## Referencia oficial

Keycloak documenta el broker OIDC/SAML, la importación de metadatos y los mappers de claims en la [Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/).
