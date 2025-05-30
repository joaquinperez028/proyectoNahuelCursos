'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';

const Header = () => {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);

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

  // Efecto para cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Cerrar dropdown de admin si click fuera
      if (adminDropdownOpen && !target.closest('[data-dropdown="admin"]')) {
        setAdminDropdownOpen(false);
      }
      
      // Cerrar dropdown de crear si click fuera
      if (createDropdownOpen && !target.closest('[data-dropdown="create"]')) {
        setCreateDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [adminDropdownOpen, createDropdownOpen]);

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
            <nav className="hidden sm:ml-6 sm:flex gap-x-8 items-center">
              <Link 
                href="/cursos" 
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-[var(--neutral-300)] hover:text-[var(--neutral-100)] hover:border-[var(--accent)] transition-all duration-200"
              >
                Cursos
              </Link>
              <Link 
                href="/cursos/packs" 
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-[var(--neutral-300)] hover:text-[var(--neutral-100)] hover:border-[var(--accent)] transition-all duration-200"
              >
                Packs
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
                <div className="relative" data-dropdown="admin">
                  <button
                    className={`inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium transition-all duration-200 ${adminDropdownOpen ? 'text-[var(--neutral-100)] border-[var(--accent)]' : 'text-[var(--neutral-300)]'} hover:text-[var(--neutral-100)] hover:border-[var(--accent)]`}
                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  >
                    Admin
                    <svg className={`ml-1 w-4 h-4 transition-transform duration-200 ${adminDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {adminDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-40 bg-[var(--neutral-900)] rounded-md shadow-lg z-50">
                      <Link href="/admin/cursos" className="block px-4 py-2 text-sm text-[var(--neutral-200)] hover:bg-[var(--card)] hover:text-[var(--neutral-100)] transition-colors group" onClick={() => setAdminDropdownOpen(false)}>
                        <span className="group-hover:pl-2 transition-all duration-200">Administrar cursos</span>
                      </Link>
                      <Link href="/admin/usuarios" className="block px-4 py-2 text-sm text-[var(--neutral-200)] hover:bg-[var(--card)] hover:text-[var(--neutral-100)] transition-colors group" onClick={() => setAdminDropdownOpen(false)}>
                        <span className="group-hover:pl-2 transition-all duration-200">Usuarios</span>
                      </Link>
                      <Link href="/admin/packs" className="block px-4 py-2 text-sm text-[var(--neutral-200)] hover:bg-[var(--card)] hover:text-[var(--neutral-100)] transition-colors rounded-b-md group" onClick={() => setAdminDropdownOpen(false)}>
                        <span className="group-hover:pl-2 transition-all duration-200">Administrar packs</span>
                      </Link>
                    </div>
                  )}
                </div>
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
                  <div 
                    className="relative"
                    data-dropdown="create"
                  >
                    <button
                      onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
                      className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md transition-all duration-200 ${
                        createDropdownOpen 
                          ? 'text-[var(--neutral-100)] bg-[var(--secondary-dark)] shadow-lg' 
                          : 'text-[var(--neutral-100)] bg-[var(--secondary)] hover:bg-[var(--secondary-dark)] hover:shadow-md'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      Crear
                      <svg className={`ml-1 w-3 h-3 transition-transform duration-200 ${createDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {createDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-44 bg-[var(--neutral-900)] border border-[var(--border)] rounded-md shadow-xl z-50 py-1">
                        <Link 
                          href="/admin/cursos/nuevo" 
                          className="block px-4 py-3 text-sm text-[var(--neutral-200)] hover:bg-[var(--card)] hover:text-[var(--neutral-100)] transition-colors group"
                          onClick={() => {
                            setCreateDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Curso
                          </div>
                        </Link>
                        <Link 
                          href="/admin/packs/nuevo" 
                          className="block px-4 py-3 text-sm text-[var(--neutral-200)] hover:bg-[var(--card)] hover:text-[var(--neutral-100)] transition-colors group"
                          onClick={() => {
                            setCreateDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Pack
                          </div>
                        </Link>
                        <Link 
                          href="/admin/categorias/nueva" 
                          className="block px-4 py-3 text-sm text-[var(--neutral-200)] hover:bg-[var(--card)] hover:text-[var(--neutral-100)] transition-colors group"
                          onClick={() => {
                            setCreateDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Categoría
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
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
              Cursos
            </Link>
            <Link 
              href="/cursos/packs" 
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-[var(--neutral-300)] hover:bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--neutral-100)] transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Packs
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
              <div className="relative block sm:hidden">
                <button
                  className={`block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium ${adminDropdownOpen ? 'text-[var(--neutral-100)] border-[var(--accent)]' : 'text-[var(--neutral-300)]'} hover:bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--neutral-100)] transition-all duration-200`}
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                >
                  Admin
                  <svg className="ml-1 w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {adminDropdownOpen && (
                  <div className="pl-6 mt-1 w-40 bg-[var(--neutral-900)] rounded-md shadow-lg z-50">
                    <Link href="/admin/cursos" className="block px-4 py-2 text-sm text-[var(--neutral-200)] hover:bg-[var(--card)]">Administrar cursos</Link>
                    <Link href="/admin/usuarios" className="block px-4 py-2 text-sm text-[var(--neutral-200)] hover:bg-[var(--card)]">Usuarios</Link>
                    <Link href="/admin/packs" className="block px-4 py-2 text-sm text-[var(--neutral-200)] hover:bg-[var(--card)]">Administrar packs</Link>
                  </div>
                )}
              </div>
            )}
            {session?.user.role === 'admin' && (
              <div className="relative block sm:hidden">
                <button
                  className={`block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium ${
                    createDropdownOpen 
                      ? 'text-[var(--neutral-100)] border-[var(--accent)]' 
                      : 'text-[var(--neutral-300)]'
                  } hover:bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--neutral-100)] transition-all duration-200`}
                  onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Crear
                    <svg className="ml-1 w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {createDropdownOpen && (
                  <div className="pl-6 mt-1 w-40 bg-[var(--neutral-900)] rounded-md shadow-lg z-50">
                    <Link 
                      href="/admin/cursos/nuevo" 
                      className="block px-4 py-2 text-sm text-[var(--neutral-200)] hover:bg-[var(--card)] hover:text-[var(--neutral-100)] transition-colors group"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setCreateDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Curso
                      </div>
                    </Link>
                    <Link 
                      href="/admin/packs/nuevo" 
                      className="block px-4 py-2 text-sm text-[var(--neutral-200)] hover:bg-[var(--card)] hover:text-[var(--neutral-100)] transition-colors group"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setCreateDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Pack
                      </div>
                    </Link>
                    <Link 
                      href="/admin/categorias/nueva" 
                      className="block px-4 py-2 text-sm text-[var(--neutral-200)] hover:bg-[var(--card)] hover:text-[var(--neutral-100)] transition-colors group"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setCreateDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Categoría
                      </div>
                    </Link>
                  </div>
                )}
              </div>
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