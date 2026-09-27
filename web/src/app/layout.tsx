import type { Metadata, Viewport } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const editorial = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-editorial",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mercadito — Gaceta de intercambio",
    template: "%s — Mercadito",
  },
  description:
    "Un mercadito universitario para encontrar y publicar artículos dentro de cada comunidad.",
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
  themeColor: "#18252d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={editorial.variable + " " + body.variable}>
      <body>{children}</body>
    </html>
  );
}
