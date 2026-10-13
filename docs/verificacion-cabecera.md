# Verificación de la cabecera responsive

Cambio revisado el 12 de octubre de 2026 en Oracle, repositorio `JuJo-SC/mercadito`.

## Resultado

La cabecera usa todo el ancho de la ventana. La marca ocupa la columna del lateral y el título de sección comienza después de su separación. Instalar y Entrar se alinean al extremo derecho, con anchos fluidos limitados y altura de 44px. La palabra Entrar se conserva completa en móvil. Instalar muestra su etiqueta desde 480px y conserva el icono en pantallas más estrechas. Sus instrucciones se anclan al grupo de acciones para mantenerse dentro de la pantalla.

## Comprobaciones

- Compose válido; lint y TypeScript sin errores; imagen de producción compilada correctamente.
- Detector de distribución sin hallazgos en los archivos modificados.
- Chromium ejecutado en Oracle: anchos 320, 360, 390, 479, 480, 540, 760, 761, 820, 1020, 1021, 1440, 1920 y 2560px. Sin desbordamiento horizontal, superposición de controles ni texto de acceso recortado.
- Marca, separación lateral y extremo de acciones alineados; botones de 44px de altura en todos los tamaños.
- Mensajes, Publicar, Mis publicaciones y Acceso revisados en 390 y 761px.
- Instalación: abrir y cerrar instrucciones; panel dentro de la pantalla en 320 y 390px. No se instaló la aplicación durante la revisión.
- Acceso: destino `/ingresar?returnTo=%2Fmercadito` conservado y foco de teclado visible al llegar mediante Tab.
- 25 comprobaciones de distribución y rutas, sin fallos ni errores de ejecución del navegador.
- DNS y certificados público y de origen vigentes antes de publicar.

Las capturas y el informe de revisión permanecen fuera de Git, en `.impeccable/review/header-layout/`. No hubo cambios de esquema, migraciones, dependencias, secretos, red o configuración de Caddy. La adaptación se comprobó con Chromium en tamaños emulados; no se recorrieron sesiones autenticadas ni dispositivos físicos en esta tarea.
