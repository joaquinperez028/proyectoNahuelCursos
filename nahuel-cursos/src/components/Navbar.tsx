'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { FaUser, FaSignOutAlt, FaShoppingCart, FaBars, FaTimes, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import SafeLink from './SafeLink';

export default function Navbar() {
  const { data: session, status, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncNeeded, setSyncNeeded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Verificar si el usuario tiene un ID temporal
  useEffect(() => {
    if (session?.user?.id && session.user.id.startsWith('temp_')) {
      console.log('ID temporal detectado en Navbar:', session.user.id);
      setSyncNeeded(true);
    } else {
      setSyncNeeded(false);
    }
  }, [session]);

  // Función alternativa de navegación en caso de enlaces rotos
  const navigateTo = (path: string) => {
    try {
      router.push(path);
    } catch (error) {
      console.error('Error al navegar con router:', error);
      // Fallback a navegación tradicional
      window.location.href = path;
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Función para actualizar la sesión
  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      // Actualizar la sesión de NextAuth
      await update();
      
      // Esperar un momento para dar tiempo a la sincronización
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar si todavía es necesaria la sincronización
      if (session?.user?.id && session.user.id.startsWith('temp_')) {
        // Si sigue siendo temporal, intentar cerrar sesión y volver a iniciarla
        await signOut({ redirect: false });
        navigateTo('/auth/login?reason=sync');
      } else {
        // Recargar la página para refrescar todos los componentes
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al sincronizar la sesión:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Renderizar el indicador de sincronización
  const renderSyncIndicator = () => {
    if (!isSyncNeeded) return null;
    
    return (
      <div className="bg-yellow-500 px-2 py-1 text-xs md:text-sm rounded flex items-center justify-between">
        <div className="flex items-center">
          <FaExclamationTriangle className="mr-1" />
          <span className="mr-2">Sincronización necesaria</span>
        </div>
        <button 
          onClick={handleRefreshSession}
          disabled={isRefreshing}
          className="bg-white text-yellow-700 px-2 py-1 rounded text-xs flex items-center hover:bg-yellow-100 transition-colors"
        >
          {isRefreshing ? 'Actualizando...' : (
            <>
              <FaSync className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} /> 
              Actualizar
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black text-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <SafeLink href="/" className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl text-white">Nahuel Lozano</span>
            </SafeLink>
          </div>
          
          {/* Enlaces de navegación para pantallas medianas y grandes */}
          <div className="hidden md:flex items-center space-x-4">
            <SafeLink href="/cursos" className="px-3 py-2 rounded-md text-white hover:bg-green-700 transition-colors font-medium">
              Cursos
            </SafeLink>
            {session?.user?.role === 'admin' && (
              <SafeLink href="/admin" className="px-3 py-2 rounded-md text-white hover:bg-green-700 transition-colors font-medium">
                Administración
              </SafeLink>
            )}
            
            {session ? (
              <div className="relative ml-3 flex items-center space-x-3">
                {isSyncNeeded && renderSyncIndicator()}
                <SafeLink href="/perfil" className="flex items-center text-sm px-3 py-2 rounded-md text-white hover:bg-green-700 transition-colors font-medium">
                  <FaUser className="mr-1" /> 
                  {session.user?.name || 'Perfil'}
                </SafeLink>
                <button 
                  onClick={() => signOut()} 
                  className="flex items-center text-sm px-3 py-2 rounded-md text-white hover:bg-green-700 transition-colors font-medium"
                >
                  <FaSignOutAlt className="mr-1" /> Salir
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <SafeLink href="/auth/login" className="px-4 py-2 rounded-md text-white hover:bg-green-700 transition-colors font-medium border border-white">
                  Iniciar Sesión
                </SafeLink>
                <SafeLink 
                  href="/auth/registro" 
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Registrarse
                </SafeLink>
              </div>
            )}
          </div>
          
          {/* Botón de menú para móviles */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-green-700 focus:outline-none"
            >
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Indicador de sincronización para móviles */}
      {isSyncNeeded && session && (
        <div className="md:hidden px-4 py-2">
          <div className="bg-yellow-500 px-3 py-2 text-sm rounded flex items-center justify-between text-yellow-900 font-medium">
            <div className="flex items-center">
              <FaExclamationTriangle className="mr-2" />
              <span className="mr-2">Sincronización necesaria</span>
            </div>
            <button 
              onClick={handleRefreshSession}
              disabled={isRefreshing}
              className="bg-white text-yellow-800 px-3 py-1 rounded text-sm flex items-center hover:bg-yellow-100 transition-colors font-medium"
            >
              {isRefreshing ? 'Actualizando...' : (
                <>
                  <FaSync className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                  Actualizar
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Menú móvil desplegable */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <SafeLink 
              href="/cursos" 
              className="block px-3 py-2 rounded-md hover:bg-green-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Cursos
            </SafeLink>
            {session?.user?.role === 'admin' && (
              <SafeLink 
                href="/admin" 
                className="block px-3 py-2 rounded-md hover:bg-green-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Administración
              </SafeLink>
            )}
            
            {session ? (
              <div className="space-y-1">
                <SafeLink 
                  href="/perfil" 
                  className="flex items-center text-sm px-3 py-2 rounded-md hover:bg-green-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <FaUser className="mr-1" /> 
                  {session.user?.name || 'Perfil'}
                </SafeLink>
                <button 
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }} 
                  className="flex items-center w-full text-left text-sm px-3 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  <FaSignOutAlt className="mr-1" /> Salir
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <SafeLink 
                  href="/auth/login" 
                  className="block px-3 py-2 rounded-md hover:bg-green-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Iniciar Sesión
                </SafeLink>
                <SafeLink 
                  href="/auth/registro" 
                  className="block px-3 py-2 bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Registrarse
                </SafeLink>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 