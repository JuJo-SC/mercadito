# Verificación de ficha estática

El propietario aprobó la propuesta privada ficha-estatica-20261022 y pidió aplicarla a la web el 22 de octubre de 2026. La foto conserva su tamaño y se desplaza con el contenido en móvil. La altura se adapta sin imponer scroll; el cierre permanece visible. Los márgenes coinciden con el ejemplo aprobado.

Se conservan ampliación, flechas, contador, teclado, fecha, contacto compacto y datos del vendedor. No cambian API, permisos, almacenamiento, esquema ni secretos.

## Comprobaciones

- Lint, tipos y compilación de la imagen candidata.
- Entorno aislado con alumnos, fotos y mensajes ficticios: escritorio, móvil, pantalla corta, 320px y movimiento reducido.
- Foto constante al desplazar, contenido normal sin scroll cuando cabe, descripción larga alcanzable sin franja vacía y cierre accesible.
- Foto horizontal y vertical, varias fotos, ausencia de imagen, publicación propia, ampliación, Escape y primer mensaje mediante icono.
- Suite existente de 18 superficies, navegación y privacidad HTTP.
- Evidencias privadas en .opendesign/artifacts/static-detail-implementation-20261022/. Resultados finales en check.exit, listing-details.json y deployment.json.

## Resultado

Todas las comprobaciones pasaron. En 390x844 la foto mide 342x342px y la ficha 722.8px, sin scroll. En 320x740 mide 272x272px y la ficha 691.4px, sin scroll. En 390x560 el recorrido nativo es 187px y la foto sigue midiendo 342x342px. Movimiento reducido conserva el mismo comportamiento estático.

La descripción larga llega al pie sin espacio vacío y conserva el cierre visible. Pasaron las cinco variantes de ficha, las 18 superficies, el envío inicial sintético, las restricciones anónimas y el aislamiento del perfil privado. Capturas móvil y escritorio revisadas.
