import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mercadito universitario",
    short_name: "Mercadito",
    description: "Avisos de intercambio dentro de cada comunidad universitaria.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf9f4",
    theme_color: "#18252d",
    shortcuts: [
      {
        name: "Publicar un artículo",
        short_name: "Publicar",
        description: "Crear un aviso para tu comunidad universitaria.",
        url: "/publicar",
        icons: [{ src: "/icons/mercadito-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Mis avisos",
        short_name: "Mis avisos",
        description: "Consultar y actualizar tus publicaciones.",
        url: "/mis-avisos",
        icons: [{ src: "/icons/mercadito-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Mensajes",
        short_name: "Mensajes",
        description: "Continuar una conversación del campus.",
        url: "/mensajes",
        icons: [{ src: "/icons/mercadito-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    icons: [
      {
        src: "/icons/mercadito-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/mercadito-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/mercadito-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
