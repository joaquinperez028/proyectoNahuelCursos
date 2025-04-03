'use client';

import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaEnvelope } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-xl font-bold">
              Nahuel Lozano
            </Link>
            <p className="mt-3 text-white text-sm font-medium">
              Aprende a invertir en criptomonedas con nuestros cursos educativos especializados.
              Estrategias, análisis técnico y todo lo que necesitas para iniciar en el mundo de las inversiones digitales.
            </p>
          </div>
          
          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-bold mb-4">Enlaces rápidos</h3>
            <ul className="space-y-2 text-white text-sm">
              <li>
                <Link href="/cursos" className="hover:text-blue-300 transition-colors font-medium">
                  Cursos
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-300 transition-colors font-medium">
                  Acerca de Nosotros
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-blue-300 transition-colors font-medium">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-blue-300 transition-colors font-medium">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-blue-300 transition-colors font-medium">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contacto y redes sociales */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contáctanos</h3>
            <div className="text-white text-sm font-medium mb-4">
              <p className="flex items-center">
                <FaEnvelope className="mr-2" /> contacto@nahuellozano.com
              </p>
            </div>
            
            <h3 className="text-lg font-bold mb-2">Síguenos</h3>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-blue-300 transition-colors"
              >
                <FaFacebook size={20} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-blue-300 transition-colors"
              >
                <FaTwitter size={20} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-blue-300 transition-colors"
              >
                <FaInstagram size={20} />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-blue-300 transition-colors"
              >
                <FaYoutube size={20} />
              </a>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-white text-sm font-medium">
          <p>&copy; {currentYear} Nahuel Lozano - Todos los derechos reservados</p>
        </div>
      </div>
    </footer>
  );
} 