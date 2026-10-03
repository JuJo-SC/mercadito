import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mercadito universitario",
    short_name: "Mercadito",
    description: "Compra y vende entre estudiantes de tu universidad.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#f5f5f7",
    shortcuts: [
      {
        name: "Crear publicación",
        short_name: "Publicar",
        description: "Publicar un producto o servicio en tu comunidad universitaria.",
        url: "/publicar",
        icons: [{ src: "/icons/mercadito-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Mis publicaciones",
        short_name: "Mis publicaciones",
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
