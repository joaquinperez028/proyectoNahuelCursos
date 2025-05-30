'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  _id: string;
  title: string;
  description: string;
  icon: string;
  slug: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCategoriasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    icon: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (session?.user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchCategories();
  }, [session, status, router]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Error fetching categories');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category._id);
    setEditForm({
      title: category.title,
      description: category.description,
      icon: category.icon,
      order: category.order,
      isActive: category.isActive,
    });
  };

  const handleSave = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await fetchCategories();
        setEditingId(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error al actualizar la categoría');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error al actualizar la categoría');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCategories();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error al eliminar la categoría');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error al eliminar la categoría');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({
      title: '',
      description: '',
      icon: '',
      order: 0,
      isActive: true,
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--neutral-300)]">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--neutral-100)]">
              Gestión de Categorías
            </h1>
            <p className="text-[var(--neutral-400)] mt-2">
              Administra las categorías de los cursos
            </p>
          </div>
          <Link
            href="/admin/categorias/nueva"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[var(--neutral-100)] bg-[var(--primary)] hover:bg-[var(--primary-dark)] transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Nueva Categoría
          </Link>
        </div>

        <div className="bg-[var(--card)] rounded-lg shadow overflow-hidden">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-[var(--neutral-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-[var(--neutral-300)]">No hay categorías</h3>
              <p className="mt-1 text-sm text-[var(--neutral-400)]">Comienza creando tu primera categoría.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border)]">
                <thead className="bg-[var(--card-header)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">
                      Orden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">
                      Ícono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--card)] divide-y divide-[var(--border)]">
                  {categories.map((category) => (
                    <tr key={category._id} className="hover:bg-[var(--card-hover)]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--neutral-300)]">
                        {editingId === category._id ? (
                          <input
                            type="number"
                            value={editForm.order}
                            onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--neutral-200)] text-sm"
                          />
                        ) : (
                          category.order
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === category._id ? (
                          <textarea
                            value={editForm.icon}
                            onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                            className="w-full px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--neutral-200)] text-sm"
                            rows={2}
                            placeholder="SVG del ícono..."
                          />
                        ) : (
                          <div 
                            className="w-8 h-8 text-[var(--primary)]"
                            dangerouslySetInnerHTML={{ __html: category.icon }}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === category._id ? (
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--neutral-200)] text-sm"
                          />
                        ) : (
                          <div className="text-sm font-medium text-[var(--neutral-200)]">
                            {category.title}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === category._id ? (
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--neutral-200)] text-sm"
                            rows={2}
                          />
                        ) : (
                          <div className="text-sm text-[var(--neutral-300)] max-w-md">
                            {category.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === category._id ? (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editForm.isActive}
                              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                              className="mr-2"
                            />
                            <span className="text-sm text-[var(--neutral-300)]">Activo</span>
                          </label>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            category.isActive 
                              ? 'bg-[var(--success-dark)] text-[var(--success-light)]'
                              : 'bg-[var(--neutral-700)] text-[var(--neutral-400)]'
                          }`}>
                            {category.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingId === category._id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSave(category._id)}
                              className="text-[var(--success)] hover:text-[var(--success-light)] transition-colors"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={handleCancel}
                              className="text-[var(--neutral-400)] hover:text-[var(--neutral-300)] transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(category._id, category.title)}
                              className="text-[var(--error)] hover:text-[var(--error-light)] transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 