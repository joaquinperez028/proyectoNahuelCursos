'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';

const Header = () => {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Efecto para detectar el scroll y cambiar el estilo del header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[var(--neutral-900)] shadow-lg backdrop-blur-lg bg-opacity-90' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="group flex items-center">
                <span className="font-bold text-xl bg-gradient-to-r from-[var(--primary-light)] to-[var(--accent)] bg-clip-text text-transparent group-hover:from-[var(--accent)] group-hover:to-[var(--primary-light)] transition-all duration-300">Plataforma de Cursos</span>
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/cursos" 
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-[var(--neutral-300)] hover:text-[var(--neutral-100)] hover:border-[var(--accent)] transition-all duration-200"
              >
                Todos los cursos
              </Link>
              <Link 
                href="/contacto" 
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-[var(--neutral-300)] hover:text-[var(--neutral-100)] hover:border-[var(--accent)] transition-all duration-200"
              >
                Contacto
              </Link>
              {session && (
                <Link 
                  href="/mis-cursos" 
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-[var(--neutral-300)] hover:text-[var(--neutral-100)] hover:border-[var(--accent)] transition-all duration-200"
                >
                  Mis cursos
                </Link>
              )}
              {session?.user.role === 'admin' && (
                <Link 
                  href="/admin/cursos" 
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-[var(--neutral-300)] hover:text-[var(--neutral-100)] hover:border-[var(--accent)] transition-all duration-200"
                >
                  Administrar cursos
                </Link>
              )}
              {session?.user.role === 'admin' && (
                <Link 
                  href="/admin/usuarios" 
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-[var(--neutral-300)] hover:text-[var(--neutral-100)] hover:border-[var(--accent)] transition-all duration-200"
                >
                  Usuarios
                </Link>
              )}
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <Link href="/perfil" className="flex items-center space-x-2 text-[var(--neutral-300)] hover:text-[var(--neutral-100)] transition-colors">
                  <div className="relative">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "Usuario"}
                        width={32}
                        height={32}
                        className="rounded-full ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--neutral-100)]">
                        {session.user.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--success)] rounded-full border-2 border-[var(--neutral-900)]"></span>
                  </div>
                  <span className="text-sm font-medium">{session.user.name}</span>
                </Link>
                {session?.user.role === 'admin' && (
                  <Link 
                    href="/admin/cursos/nuevo" 
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-[var(--neutral-100)] bg-[var(--secondary)] hover:bg-[var(--secondary-dark)] transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Crear Curso
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center px-3 py-1.5 border border-[var(--border)] text-xs font-medium rounded-md text-[var(--neutral-300)] bg-transparent hover:bg-[var(--card)] transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[var(--neutral-100)] bg-[var(--primary)] hover:bg-[var(--primary-dark)] transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                Iniciar sesión
              </button>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[var(--neutral-400)] hover:text-[var(--neutral-200)] hover:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)]"
            >
              <span className="sr-only">Abrir menú</span>
              {mobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[var(--neutral-900)] shadow-xl rounded-b-lg animate-fadeIn">
          <div className="pt-2 pb-3 space-y-1">
            <Link 
              href="/cursos" 
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-[var(--neutral-300)] hover:bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--neutral-100)] transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Todos los cursos
            </Link>
            <Link 
              href="/contacto" 
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-[var(--neutral-300)] hover:bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--neutral-100)] transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contacto
            </Link>
            {session && (
              <Link 
                href="/mis-cursos" 
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-[var(--neutral-300)] hover:bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--neutral-100)] transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mis cursos
              </Link>
            )}
            {session?.user.role === 'admin' && (
              <>
                <Link 
                  href="/admin/cursos" 
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-[var(--neutral-300)] hover:bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--neutral-100)] transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Administrar cursos
                </Link>
                <Link 
                  href="/admin/usuarios" 
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-[var(--neutral-300)] hover:bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--neutral-100)] transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Usuarios
                </Link>
                <Link 
                  href="/admin/transferencias" 
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-[var(--neutral-300)] hover:bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--neutral-100)] transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Transferencias
                </Link>
                <Link 
                  href="/admin/reportes" 
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-[var(--neutral-300)] hover:bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--neutral-100)] transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reportes
                </Link>
                <Link 
                  href="/admin/actualizar-playback" 
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-[var(--neutral-300)] hover:bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--neutral-100)] transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Actualizar ID Videos
                </Link>
              </>
            )}
            {session && (
              <Link 
                href="/perfil" 
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-[var(--neutral-300)] hover:bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--neutral-100)] transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mi Perfil
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-[var(--border)]">
            {session ? (
              <div className="space-y-3 px-4">
                <div className="flex items-center space-x-3">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "Usuario"}
                      width={32}
                      height={32}
                      className="rounded-full ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--neutral-900)]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--neutral-100)]">
                      {session.user.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="text-sm font-medium text-[var(--neutral-200)]">{session.user.name}</div>
                </div>
                {session?.user.role === 'admin' && (
                  <Link
                    href="/admin/cursos/nuevo"
                    className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-[var(--neutral-100)] bg-[var(--secondary)] hover:bg-[var(--secondary-dark)] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      Crear Curso
                    </div>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="block w-full text-center py-2 px-4 border border-[var(--border)] rounded-md text-sm font-medium text-[var(--neutral-300)] hover:bg-[var(--card)] transition-colors"
                >
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Cerrar sesión
                  </div>
                </button>
              </div>
            ) : (
              <div className="px-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signIn('google');
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-[var(--neutral-100)] bg-[var(--primary)] hover:bg-[var(--primary-dark)] transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                  </svg>
                  Iniciar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 