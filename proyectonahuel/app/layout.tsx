import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import NotificationProvider from "@/components/Notification";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Importamos las fuentes
const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-poppins',
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Plataforma de Cursos Online",
  description: "Aprende con nuestros cursos en línea impartidos por expertos. Mejora tus habilidades y avanza en tu carrera con nuestra plataforma educativa de calidad.",
  keywords: "cursos online, aprendizaje en línea, educación, programación, diseño, marketing, negocios",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${poppins.variable} ${inter.variable}`}>
      <body className={`${inter.className} bg-[var(--background)] text-[var(--foreground)]`}>
        <AuthProvider>
          <NotificationProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow pt-16">
                {children}
              </main>
              <Footer />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
