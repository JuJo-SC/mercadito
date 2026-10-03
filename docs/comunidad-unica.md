# Configurar la única comunidad de Mercadito

## Prueba actual

UMAN es la única comunidad habilitada. `ACTIVE_UNIVERSITY_SLUG=uman` y `ACTIVE_UNIVERSITY_NAME=UMAN` viven en `/srv/secrets/mercadito/app.env`. UMAN conserva `isTest=true`; las cuentas sintéticas no verifican matrícula. La portada y el acceso lo explican. Los registros del campus demo se conservan en la base, pero sus productos ya no se entregan por la API pública.

Cambiar estos valores no mueve cuentas, publicaciones, fotos ni conversaciones. El servidor verifica la comunidad configurada en cada acceso a las funciones estudiantiles, por lo que las sesiones de un campus anterior dejan de tener acceso cuando cambia el slug.

## Sustituir la comunidad de prueba por una universidad real

1. Recibir el nombre público, slug, proveedor OIDC/SAML y claim de alumno activo mediante el contacto institucional. Completar el aviso de privacidad aplicable.
2. Crear un registro University independiente para la institución real, con `isDemo=false`, `isTest=false`, `identityKey` y los valores exactos de `studentStatusClaim` y `studentStatusValue`. No renombrar UMAN ni reasignar sus cuentas o publicaciones: eso mezclaría datos ficticios con alumnos reales.
3. Conectar el proveedor en Keycloak siguiendo [identidad-universidades.md](identidad-universidades.md). El acceso debe validar pertenencia y estatus de estudiante; el correo por sí solo no acredita matrícula.
4. Definir `ACTIVE_UNIVERSITY_SLUG` con el slug real y `ACTIVE_UNIVERSITY_NAME` con el nombre corto público, fuera del repositorio. Activar la institución solo cuando sus claims se hayan comprobado.
5. Recrear únicamente el servicio web desde `/srv/apps/mercadito` mediante `docker compose up -d --no-deps web`. No hace falta reescribir la aplicación para cambiar estos valores.
6. Comprobar acceso de un alumno activo, rechazo de una cuenta inactiva o de UMAN, bloqueo del catálogo sin sesión y privacidad de fotos y conversaciones. La interfaz debe mostrar el nombre real y dejar de presentar el aviso de campus de prueba.

## Ampliación futura

Las relaciones por universidad y las comprobaciones de pertenencia permanecen en el modelo. Admitir varias universidades será una mejora explícita de configuración, acceso y navegación. Hasta entonces no se ofrece un selector ni un formulario para otras comunidades. La API de solicitudes está cerrada de forma incondicional.
