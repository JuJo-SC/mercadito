import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./app-shell.css";
import { RouteScrollReset } from "@/components/route-scroll-reset";

export const metadata: Metadata = {
  title: {
    default: "Mercadito — Comunidad universitaria",
    template: "%s — Mercadito",
  },
  description:
    "Compra y vende entre estudiantes de una sola universidad, con acceso reservado a su comunidad.",
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
    <html lang="es-MX" data-scroll-behavior="smooth">
      <body>
        <RouteScrollReset />
        {children}
      </body>
    </html>
  );
}
