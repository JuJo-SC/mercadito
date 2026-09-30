import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mercadito — Mercado del campus",
    template: "%s — Mercadito",
  },
  description:
    "Un mercadito universitario para explorar productos y publicar dentro de cada comunidad.",
  applicationName: "Mercadito",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mercadito",
  },
  icons: {
    icon: [
      { url: "/icons/mercadito-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/mercadito-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icons/mercadito-180.png", type: "image/png", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
