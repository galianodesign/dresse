import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ThemeAmbience } from "@/components/ThemeDecor";
import Splash from "@/components/Splash";

export const metadata: Metadata = {
  title: "Dressé — Tu boutique personal",
  description:
    "Tu armario inteligente: digitaliza tu ropa, descubre combinaciones y compra mejor.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Dressé" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#faf8f4",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-theme="signature">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Jost:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <StoreProvider>
          <Splash />
          <ThemeAmbience />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
