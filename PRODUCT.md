# Mercadito

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegado y aceptado por la persona usuaria: Next.js con TypeScript y Tailwind, PWA, Keycloak para federar identidad institucional (OIDC para la app; OIDC o SAML con la universidad), PostgreSQL con Prisma y despliegue con Docker Compose y Caddy.

## Users

- Confirmado: estudiantes que inician sesión con una cuenta institucional.
- Confirmado: universidades que solicitan registrar su comunidad.
- Inferencia a partir del pedido de una PWA: el uso desde teléfonos móviles es prioritario.

## Product Purpose

Un espacio de compra y venta para la comunidad de una universidad. La persona usuaria quiere que cada universidad pueda registrarse y que sus alumnos accedan con su cuenta institucional.

## Positioning

La pertenencia a una universidad define el acceso al mercadito de esa comunidad. La asociación debe provenir de la configuración de identidad institucional; una coincidencia de dominio de correo, por sí sola, no demuestra matrícula activa.

## Operating Context

- Confirmado: los alumnos usan sus credenciales institucionales para iniciar sesión.
- Confirmado: una universidad puede solicitar su registro.
- Inferencia provisional: descubrimiento y publicación de artículos ocurren principalmente desde el teléfono y dentro de la comunidad universitaria.
- Confirmado: el comprador y el vendedor podrán iniciar la coordinación mediante chat dentro de Mercadito; si ambos lo deciden, podrán continuar por otro medio.
- Confirmado: Mercadito será intermediario y no procesará, recibirá ni resguardará pagos; cualquier pago se acordará fuera de la plataforma.

## Capabilities and Constraints

- Requerido: registro de universidades, acceso institucional de alumnos y experiencia web instalable en dispositivos móviles.
- Elección de stack: Keycloak aceptará proveedores institucionales OIDC o SAML y ofrecerá OIDC a la aplicación.
- Dato pendiente: cada universidad debe facilitar los datos de su proveedor de identidad y aclarar qué información permite verificar que alguien es alumno activo.
- Alcance confirmado para el MVP: publicar y explorar artículos, conversar por chat para coordinar el interés, sin procesar pagos.
- Los estudiantes pueden consultar y editar sus propios avisos, cambiar su disponibilidad (publicado, apartado, vendido o archivado) dentro de su campus, y conversar con interesados.

- Inferencia provisional a partir de «mercadito interno»: sin sesión solo se muestra el campus ficticio de demostración; una cuenta estudiantil activa solo accede al mercadito de su universidad.

## Evidence on Hand

El brief de producto proviene de la persona usuaria. Aún no hay proveedor institucional conectado, logotipo, fotografías ni catálogo real. El servidor tiene UMAN como campus de prueba (isTest) y cuentas locales sintéticas de Keycloak para recorrer la publicación; no verifican matrícula. Cualquier artículo de muestra debe identificarse como contenido ficticio y las credenciales no deben guardarse en Git.

## Pendiente antes de recibir solicitudes reales

Aún se necesita el aviso de privacidad aprobado por quien operará el servicio, con identidad de la persona responsable, finalidades, conservación y medios de contacto para ejercer derechos. La interfaz explica el propósito del formulario, pero no sustituye ese aviso.

## Product Principles

- El acceso y los datos de cada comunidad deben quedar asociados a su universidad.
- La verificación institucional debe depender del proveedor de identidad configurado, no únicamente del sufijo del correo.
- Las tareas principales deben ser cómodas en una pantalla móvil.
- No presentar datos de demostración como ofertas reales.
