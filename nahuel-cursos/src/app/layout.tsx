import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nahuel Lozano - Cursos de Inversión en Criptomonedas",
  description: "Aprende a invertir en criptomonedas con nuestros cursos especializados. Estrategias, análisis técnico y más.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Scripts para reparar problemas de video y hipervínculos */}
        <Script src="/fix-video-issues.js" strategy="beforeInteractive" />

        {/* Meta tag para evitar caché de navegador */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
