'use client';

import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaEnvelope } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-xl font-bold text-white">
              Nahuel Lozano
            </Link>
            <p className="mt-3 text-gray-200 text-sm">
              Aprende a invertir en criptomonedas con nuestros cursos educativos especializados.
              Estrategias, análisis técnico y todo lo que necesitas para iniciar en el mundo de las inversiones digitales.
            </p>
          </div>
          
          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Enlaces rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cursos" className="text-gray-200 hover:text-blue-400 transition-colors">
                  Cursos
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-200 hover:text-blue-400 transition-colors">
                  Acerca de Nosotros
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-gray-200 hover:text-blue-400 transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-gray-200 hover:text-blue-400 transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-gray-200 hover:text-blue-400 transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contacto y redes sociales */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Contáctanos</h3>
            <div className="text-gray-200 mb-4">
              <p className="flex items-center">
                <FaEnvelope className="mr-2" /> contacto@nahuellozano.com
              </p>
            </div>
            
            <h3 className="text-lg font-bold mb-2 text-white">Síguenos</h3>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-blue-400 transition-colors"
              >
                <FaFacebook size={20} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-blue-400 transition-colors"
              >
                <FaTwitter size={20} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-blue-400 transition-colors"
              >
                <FaInstagram size={20} />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-blue-400 transition-colors"
              >
                <FaYoutube size={20} />
              </a>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-gray-300">
          <p>&copy; {currentYear} Nahuel Lozano - Todos los derechos reservados</p>
        </div>
      </div>
    </footer>
  );
} 