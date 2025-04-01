'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { FaUser, FaSignOutAlt, FaShoppingCart, FaBars, FaTimes } from 'react-icons/fa';

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl">Nahuel Lozano</span>
            </Link>
          </div>
          
          {/* Enlaces de navegación para pantallas medianas y grandes */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/cursos" className="px-3 py-2 rounded-md hover:bg-blue-800 transition-colors">
              Cursos
            </Link>
            {session?.user?.role === 'admin' && (
              <Link href="/admin" className="px-3 py-2 rounded-md hover:bg-blue-800 transition-colors">
                Administración
              </Link>
            )}
            
            {session ? (
              <div className="relative ml-3 flex items-center space-x-3">
                <Link href="/perfil" className="flex items-center text-sm px-3 py-2 rounded-md hover:bg-blue-800 transition-colors">
                  <FaUser className="mr-1" /> 
                  {session.user?.name || 'Perfil'}
                </Link>
                <button 
                  onClick={() => signOut()} 
                  className="flex items-center text-sm px-3 py-2 rounded-md hover:bg-blue-800 transition-colors"
                >
                  <FaSignOutAlt className="mr-1" /> Salir
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link href="/auth/login" className="px-3 py-2 rounded-md hover:bg-blue-800 transition-colors">
                  Iniciar Sesión
                </Link>
                <Link 
                  href="/auth/registro" 
                  className="px-3 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
          
          {/* Botón de menú para móviles */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-800 focus:outline-none"
            >
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Menú móvil desplegable */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/cursos" 
              className="block px-3 py-2 rounded-md hover:bg-blue-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Cursos
            </Link>
            {session?.user?.role === 'admin' && (
              <Link 
                href="/admin" 
                className="block px-3 py-2 rounded-md hover:bg-blue-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Administración
              </Link>
            )}
            
            {session ? (
              <div className="space-y-1">
                <Link 
                  href="/perfil" 
                  className="flex items-center text-sm px-3 py-2 rounded-md hover:bg-blue-800 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <FaUser className="mr-1" /> 
                  {session.user?.name || 'Perfil'}
                </Link>
                <button 
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }} 
                  className="flex items-center w-full text-left text-sm px-3 py-2 rounded-md hover:bg-blue-800 transition-colors"
                >
                  <FaSignOutAlt className="mr-1" /> Salir
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link 
                  href="/auth/login" 
                  className="block px-3 py-2 rounded-md hover:bg-blue-800 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  href="/auth/registro" 
                  className="block px-3 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 