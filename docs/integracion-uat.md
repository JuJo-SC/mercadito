# Integración UAT en pruebas

## Alcance actual

La integración está desplegada como una prueba restringida desde la rama feat/integracion-uat. UAT es la comunidad activa de la web y el autenticador solo admite las matrículas autorizadas por el propietario mediante configuración externa. No está abierto el acceso general. El realm, cliente, usuarios, publicaciones y conversaciones UMAN se conservan por separado.

El servicio de origen es [Campus-TD/scrap-uat-service](https://github.com/Campus-TD/scrap-uat-service), versión b3b1c7adcbf76e08ee16b030b0702a8e8ecb14b1. Su código privado permanece en /srv/apps/scrap-uat-service y no se copia a este repositorio público. La copia proviene del ZIP autorizado de GitHub; .source-commit registra el commit original. No se añadió acceso persistente en GitHub.

El servicio reproduce el acceso de navegador a los portales ASP.NET de la UAT y entrega JSON. Puede consultar carreras, situación académica, horarios, calificaciones y consultas docentes. Es un servicio independiente, no un proveedor oficial de identidad de la universidad.

## Verificación para Mercadito

Mercadito conserva Auth.js, sesiones en PostgreSQL y OIDC con Keycloak. Un autenticador específico llama desde Keycloak al gateway privado usando una API key externa al repositorio. La contraseña se usa durante esa petición; no se convierte en una contraseña local de Mercadito ni se guarda en el usuario, una variable de configuración, un log o la respuesta.

El endpoint de alumnos es POST /api/v1/alumnos/scrape. Se envía usuario y contraseña con include.programPage=true, include.schedule=false, include.partialGrades=false e include.finalGrades=false. No se necesitan los endpoints de horarios, calificaciones, docentes ni asistencia.

El formulario admite matrícula o correo de alumnos; antes de llamar al gateway se normaliza siempre a matrícula@alumnos.uat.edu.mx. La matrícula conserva sus ceros iniciales y la contraseña no se recorta ni transforma. El portal confirmado para este piloto es https://alumnossur.uat.edu.mx/Login.

El validador exige authenticated=true, login.exito=true y ausencia de cambio obligatorio de contraseña. La matrícula canónica debe coincidir con programs[].raw.Num_Matricula; no se eliminan ceros iniciales. La situación ACTIVO debe estar respaldada por el mismo programa y por campos de carrera reconocidos. No se autoriza usando el catálogo agregado situations, una coincidencia parcial de texto, CicloActivo, un correo o el HTML de otro plan. INACTIVO, EGRESADO, BAJA, campos ausentes o contradictorios se rechazan.

El identificador interno de Keycloak es independiente y estable. Las notas de sesión university_id=uat y uat_student_verified=true se convierten en claims OIDC. El cliente UAT no hereda profile/email; solicita únicamente openid, evitando propagar matrícula o datos académicos en los tokens. Auth.js usa el sub y acepta email=null para UAT; no inventa un correo ni vincula identidades por correo. Una sesión previa no puede vincular otra identidad de portal a su cuenta local.

Las sesiones UAT duran ocho horas con caducidad fija. Una sesión válida no vuelve a consultar el portal durante su vigencia; al expirar se requiere verificar de nuevo. Las respuestas académicas crudas y las cookies UAT no se almacenan en la base de Mercadito.

## Infraestructura y pruebas

- Gateway: /srv/apps/scrap-uat-service/compose.yml; configuración reproducible en infra/uat/scrap-uat-service.compose.yml.
- API key y configuración del gateway: /srv/secrets/scrap-uat-service/service.env, permisos restrictivos.
- Red externa exclusiva: uat-verification. El gateway no tiene puertos publicados ni está en edge.
- Keycloak: infra/keycloak/uat-provider, JAR incorporado antes de la optimización de la imagen.
- Compilaciones candidatas: combinar compose.yml con infra/uat/validation.compose.yml. Construir imágenes no reemplaza los contenedores activos.
- Smoke: entorno de Keycloak, PostgreSQL temporal y gateway simulado, aislados de los datos y servicios de producción.

La fuente del gateway pasó tipos, seis pruebas y compilación. Health respondió 200; sin API key se rechazó con 401 y una petición vacía autorizada con 400. Los portales UAT respondieron por HTTPS con certificados válidos desde el contenedor. No se intentó iniciar sesión con cuentas reales ni con credenciales inventadas.

La auditoría de dependencias del gateway conserva una alerta moderada de Fastify para HTTP/2. Esta instancia usa HTTP/1 en red privada. Las dependencias de desarrollo se eliminan de la imagen de ejecución. Se conserva el lockfile original; actualizarlo será un cambio separado.

## Preparación futura y cierre por defecto

UAT_LOGIN_ENABLED es false por defecto. El autenticador, el resolver de identidad y las rutas estudiantiles rechazan el acceso UAT cuando el operador no lo ha habilitado explícitamente. Un enlace HTTPS válido en UAT_PRIVACY_URL es un requisito de la configuración de apertura; no demuestra por sí solo que exista un aviso aprobado.

infra/uat/configure-identity.py es de solo lectura sin --apply. El modo de aplicación prepara un realm mercadito-uat, un cliente mercadito-uat-web y un flujo dedicado; conserva completos el realm, perfil y cliente UMAN. El perfil UAT no exige correo o nombres cuando se solicita solo openid; los atributos de aceptación son visibles y editables únicamente por el administrador. Las ejecuciones repetidas validan scopes, mappers y controles antes de declarar preparada la integración. El secreto nuevo se escribe en /srv/secrets/mercadito/uat-auth.env y no se imprime. El archivo requiere propietario y permisos que permitan leerlo al operador remoto; no incorporarlo al repositorio.

infra/uat/prepare-university.cjs es de solo lectura sin --apply. Su aplicación crea una universidad UAT independiente y verifica los recuentos UMAN dentro de la misma transacción. No cambia la comunidad activa, no reasigna usuarios ni publicaciones y no aplica migraciones.

La configuración de Keycloak para el gateway vive en /srv/secrets/mercadito/uat.env. Para una futura apertura, la web debe cargar uat-auth.env después de app.env, sin recibir la API key del gateway. No cambiar ACTIVE_UNIVERSITY_SLUG hasta verificar el acceso y las restricciones entre campus.

Antes de declarar listo el acceso real se necesita una prueba con una cuenta UAT autorizada y confirmar el significado de los estados devueltos. El aviso de la prueba está en /aviso-prueba-uat.txt, versión prueba-restringida-2026-10-13. Describe la finalidad, la validación y los datos conservados para este grupo. No publica las matrículas ni información personal del responsable; debe revisarse antes de una apertura general.

## Procedimiento para abrir acceso en el futuro

1. Terminar la prueba aislada y verificar el portal con una cuenta UAT autorizada. Para probar únicamente la cuenta del operador o un grupo, configurar UAT_ALLOWED_MATRICULAS con las matrículas autorizadas fuera de Git. Una lista vacía solo permite a todos los elegibles cuando UAT_LOGIN_ENABLED se habilita expresamente.
2. Construir la imagen Keycloak con el proveedor, cargar su configuración externa y conectar la red privada del gateway. Reemplazar solo Keycloak en una ventana de prueba; esperar su healthcheck. No tocar PostgreSQL, Caddy, volúmenes ni el realm UMAN.
3. Ejecutar configure-identity.py primero sin --apply y después con --apply para preparar el realm independiente. Las credenciales administrativas se cargan desde keycloak.env en un contenedor conectado a mercadito_private; el secreto nuevo solo se escribe en el directorio /srv/secrets/mercadito montado como /secrets.
4. Ejecutar prepare-university.cjs primero sin --apply y después con --apply a través de stdin del contenedor web. Se conserva la relación original de cada usuario y publicación UMAN.
5. Configurar uat-auth.env con el cliente/issuer nuevos, ACTIVE_UNIVERSITY_SLUG=uat y ACTIVE_UNIVERSITY_NAME=UAT. Añadir este archivo después de app.env al entorno web. Para alumnos reales, completar y publicar el aviso de privacidad, enlazarlo mediante UAT_PRIVACY_URL y habilitar UAT_LOGIN_ENABLED tanto para web como para Keycloak. Para una prueba propia, delimitar expresamente el grupo y la finalidad de la prueba antes de enviar credenciales.
6. Reconstruir la web y reemplazar únicamente el servicio web. Verificar login activo, rechazos, continuidad del sub, salud, logs sin contraseñas, HTTP/HTTPS, DNS/certificados y bloqueo entre campus. Una cuenta real y los estados observados son requisito para declarar listo el acceso.

Para volver a UMAN, retirar la configuración UAT adicional del servicio web, conservar app.env original con su cliente y comunidad UMAN, y recrear solo web. El realm UAT y el gateway pueden permanecer cerrados sin eliminar datos; el cliente UMAN original conserva su configuración.

El overlay infra/uat/activation.compose.yml incorpora el entorno UAT únicamente a web y etiqueta sus imágenes de forma explícita. Se usó para activar esta prueba, con UAT_LOGIN_ENABLED=true y una lista explícita de matrículas en Keycloak. En otros entornos mantener el acceso cerrado hasta escoger y comprobar su alcance.

Secuencia operativa futura, tras configurar y revisar los archivos externos:

    docker compose -f compose.yml -f infra/uat/activation.compose.yml config --quiet
    docker compose -f compose.yml -f infra/uat/activation.compose.yml build keycloak web
    docker compose -f compose.yml -f infra/uat/activation.compose.yml up -d --no-deps keycloak

Después del healthcheck de Keycloak, preparar identidad con el contenedor administrativo y preparar la universidad a través del contenedor web. La ejecución sin --apply es de solo lectura:

    docker run --rm --user "$(id -u):$(id -g)" --network mercadito_private \
      --env-file /srv/secrets/mercadito/keycloak.env \
      -v /srv/secrets/mercadito:/secrets \
      -v /srv/apps/mercadito/infra/uat:/scripts:ro \
      python:3.12-slim python /scripts/configure-identity.py

    docker exec -i mercadito-web node - < infra/uat/prepare-university.cjs

Una vez revisado ese resultado, aplicar cada preparación con --apply. Actualizar la configuración externa y la política de prueba, validar Compose y después recrear web:

    docker compose -f compose.yml -f infra/uat/activation.compose.yml up -d --no-deps web

No se ejecutan migraciones ni se publican puertos del gateway. Verificar DNS, certificados, HTTP/HTTPS, healthchecks y permisos tras cada cambio. Las pruebas con datos sintéticos no sustituyen la prueba del portal con una cuenta autorizada.

## Resultado de la verificación candidata

La imagen del autenticador pasó 44 pruebas unitarias. El smoke final verificó el cierre sin formulario, acceso válido, el mismo sub en dos accesos, claims mínimos en ID token/userinfo, rechazo de alumnos inactivos y contraseñas incorrectas, ausencia de credenciales locales y bloqueo nativo tras intentos fallidos. Se corrigió la categoría de autenticación para que las contraseñas externas participen en la protección de Keycloak sin almacenarlas.

El configurador se probó contra un Keycloak/PostgreSQL temporal: lectura sin cambios, primera preparación, repetición sin alterar el secreto y rechazo de un entorno obsoleto. Los ensayos no afectaron el realm UMAN.

La web candidata pasó lint, comprobación de tipos y compilación. En un contenedor temporal se verificaron health, pantalla UAT en preparación, catálogo cerrado con respuesta privada sin caché y registro de universidades bloqueado. Antes del piloto se consultó UMAN en modo de solo lectura: cinco usuarios, catorce publicaciones y cinco conversaciones. La preparación posterior creó UAT como una universidad independiente y confirmó que esos recuentos UMAN permanecían intactos.

La web del piloto ejecuta el commit 47c70a0 de feat/integracion-uat; Keycloak incorpora el autenticador de esta rama. El gateway privado ejecuta el commit de origen b3b1c7adcbf76e08ee16b030b0702a8e8ecb14b1. El formulario y la restricción se verificaron, pero el acceso al portal con una contraseña real sigue pendiente de que lo complete un participante autorizado.

## Usar y administrar la prueba restringida

Cada participante abre https://mercadito.291006.xyz/ingresar, pulsa «Continuar con UAT», introduce su propia matrícula y contraseña del portal, lee el aviso y acepta la verificación antes de pulsar «Verificar y entrar». La primera validación correcta crea su cuenta UAT; no se crea una contraseña local. La autorización de una matrícula no reemplaza la comprobación de situación ACTIVO.

La lista vive en UAT_ALLOWED_MATRICULAS dentro de /srv/secrets/mercadito/uat.env. Para añadir participantes autorizados, editar esa lista con matrículas completas separadas por comas, sin quitar las existentes ni dejar el valor vacío. Reaplicar únicamente Keycloak y verificar que el contenedor reciba la lista esperada:

    docker compose -f compose.yml -f infra/uat/activation.compose.yml config --quiet
    docker compose -f compose.yml -f infra/uat/activation.compose.yml up -d --no-deps --wait keycloak

No incluir esta lista en Git. Para cerrar nuevas entradas UAT, establecer UAT_LOGIN_ENABLED=false en uat.env y uat-auth.env y recrear Keycloak y web con el mismo overlay. El cierre también impide usar las rutas estudiantiles aunque exista una sesión previa.

En este piloto se verificaron salud HTTPS, redirección HTTP a HTTPS, aviso publicado, recorrido del botón hasta Keycloak, formulario con contraseña oculta y aceptación desmarcada, rechazo de una matrícula ajena antes de consultar el gateway y configuración de tres cuentas autorizadas. No se enviaron contraseñas reales ni se copiaron publicaciones UMAN a UAT.

## Diagnóstico del rechazo

Los registros de Keycloak distinguen categorías UAT_CHECK de formato de usuario, contraseña ausente o fuera de límite, rechazo HTTP del portal, indicadores de login no confirmados y cambio obligatorio de contraseña. Solo se registran etiquetas constantes, tipos JSON o valores booleanos y los dos códigos de rechazo reconocidos. No se registran usuarios, contraseñas, mensajes del portal ni cuerpos de respuesta. El diagnóstico no cambia los requisitos de acceso.
