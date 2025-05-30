'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MakeAdminButton from '@/components/MakeAdminButton';

export default function NuevaCategoriaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '',
    order: 0,
    isActive: true,
  });

  const [iconPreview, setIconPreview] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    // Comentamos la redirección automática para permitir mostrar el botón MakeAdmin
    // if (session?.user.role !== 'admin') {
    //   router.push('/');
    //   return;
    // }
  }, [session, status, router]);

  useEffect(() => {
    // Actualizar la vista previa del ícono cuando cambie
    setIconPreview(formData.icon);
  }, [formData.icon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/categorias');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error al crear la categoría');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error al crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value) || 0 : value,
    }));
  };

  const iconTemplates = [
    {
      name: 'Análisis',
      svg: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>'
    },
    {
      name: 'Trading',
      svg: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>'
    },
    {
      name: 'Dinero',
      svg: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg>'
    },
    {
      name: 'Estrategia',
      svg: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>'
    },
    {
      name: 'Educación',
      svg: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>'
    },
    {
      name: 'Calculadora',
      svg: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>'
    }
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--neutral-300)]">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Link
            href="/admin/categorias"
            className="inline-flex items-center text-[var(--neutral-400)] hover:text-[var(--neutral-300)] transition-colors mr-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Volver
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[var(--neutral-100)]">
              Nueva Categoría
            </h1>
            <p className="text-[var(--neutral-400)] mt-2">
              Crea una nueva categoría para organizar los cursos
            </p>
          </div>
        </div>

        {/* Botón de admin si es necesario */}
        {session && session.user.role !== 'admin' && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-md">
            <p className="text-yellow-200 text-sm mb-3">
              ⚠️ Necesitas permisos de administrador para crear categorías.
            </p>
            <p className="text-[var(--neutral-400)] text-sm mb-3">
              Usuario actual: {session.user.email} | Rol: {session.user.role || 'Sin rol'}
            </p>
            <MakeAdminButton />
          </div>
        )}

        <div className="bg-[var(--card)] rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-[var(--neutral-300)] mb-2">
                Título *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--neutral-200)] placeholder-[var(--neutral-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="Ej: Análisis Técnico"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[var(--neutral-300)] mb-2">
                Descripción *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--neutral-200)] placeholder-[var(--neutral-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="Describe brevemente esta categoría..."
              />
            </div>

            <div>
              <label htmlFor="order" className="block text-sm font-medium text-[var(--neutral-300)] mb-2">
                Orden de visualización
              </label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--neutral-200)] placeholder-[var(--neutral-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="0"
              />
              <p className="text-xs text-[var(--neutral-400)] mt-1">
                Las categorías se ordenarán de menor a mayor número
              </p>
            </div>

            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-[var(--neutral-300)] mb-2">
                Ícono SVG *
              </label>
              
              {/* Plantillas de íconos */}
              <div className="mb-4">
                <p className="text-sm text-[var(--neutral-400)] mb-2">Selecciona una plantilla o pega tu propio SVG:</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {iconTemplates.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon: template.svg }))}
                      className="p-2 border border-[var(--border)] rounded hover:bg-[var(--card-hover)] transition-colors group"
                      title={template.name}
                    >
                      <div 
                        className="w-6 h-6 text-[var(--primary)] group-hover:text-[var(--primary-light)] transition-colors"
                        dangerouslySetInnerHTML={{ __html: template.svg }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--neutral-200)] placeholder-[var(--neutral-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-mono text-sm"
                placeholder="<svg>...</svg>"
              />
              
              {/* Vista previa del ícono */}
              {iconPreview && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-sm text-[var(--neutral-400)]">Vista previa:</span>
                  <div 
                    className="w-8 h-8 text-[var(--primary)]"
                    dangerouslySetInnerHTML={{ __html: iconPreview }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Link
                href="/admin/categorias"
                className="px-4 py-2 border border-[var(--border)] text-sm font-medium rounded-md text-[var(--neutral-300)] hover:bg-[var(--card-hover)] transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[var(--neutral-100)] bg-[var(--primary)] hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear Categoría'}
              </button>
            </div>
          </form>
        </div>

        {/* Show current user info for debugging */}
        {session && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-md text-sm">
            <p className="text-blue-200">👤 Usuario: {session.user.email}</p>
            <p className="text-blue-200">🔑 Rol: {session.user.role || 'Sin rol definido'}</p>
            {session.user.role === 'admin' ? (
              <p className="text-green-400">✅ Tienes permisos de administrador</p>
            ) : (
              <p className="text-yellow-400">⚠️ Necesitas permisos de administrador</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 