# Superficie: publicar un artículo

MODE: Operate

## Direction contract

THESIS: El estudiante convierte una intención de venta en un anuncio claro y revisado mediante tres pasos que conserva al volver atrás.

OWN-WORLD: Hereda la interfaz clara de Mercadito: superficies blancas, fondo gris suave, tipografía del sistema, radios cómodos y acento verde. Los formularios conservan jerarquía y blancos táctiles.

STORY: Primero identifica artículo, categoría, condición y fotos; después escribe precio y descripción; al final revisa exactamente el aviso que publicará. La vista previa de demostración nunca se envía ni se guarda. En UMAN, un aviso tenue identifica el campus de prueba y recuerda usar datos ficticios.

FIRST VIEWPORT: En móvil, la pregunta, el progreso de tres etapas y el primer campo aparecen antes de desplazarse. En Artículo, «Continuar» sigue a categoría, condición y fotos; la vista previa ocupa la etapa final.

FORM: Flujo Artículo → Detalles → Revisar en `/publicar`. Admite hasta cinco fotos JPG, PNG o WebP, con máximo 8 MB cada una y 20 MB en total. En edición, quitar una foto no cambia el estado del anuncio; las fotos restantes conservan su orden.

FINISH: build, review actual en móvil y escritorio, detector Impeccable en los objetivos UI modificados y documentación del sistema actualizado.
