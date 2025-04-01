'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FaSave, FaTimes, FaSpinner } from 'react-icons/fa';

export default function NuevoCurso() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    precio: '',
    video: '',
    videoPreview: '',
    categorias: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar si el usuario es administrador
  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    router.push('/');
    return null;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login?redirect=/admin/cursos/nuevo');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    if (!formData.titulo || !formData.descripcion || !formData.precio || !formData.video || !formData.videoPreview) {
      setError('Todos los campos marcados con * son obligatorios');
      return false;
    }
    
    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio < 0) {
      setError('El precio debe ser un número válido y mayor o igual a 0');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Preparar datos para enviar
      const cursoData = {
        ...formData,
        precio: parseFloat(formData.precio),
        categorias: formData.categorias ? formData.categorias.split(',').map(cat => cat.trim()) : []
      };
      
      // Enviar datos al backend
      const response = await axios.post('/api/cursos', cursoData);
      
      if (response.status === 201) {
        // Redireccionar al panel de administración
        router.push('/admin');
      }
    } catch (err: any) {
      console.error('Error al crear curso:', err);
      setError(err.response?.data?.error || 'Ocurrió un error al crear el curso');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center py-20">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Curso</h1>
        <Link 
          href="/admin" 
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <FaTimes className="mr-2" /> Cancelar
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Título del curso"
                required
              />
            </div>
            
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción detallada del curso"
                required
              />
            </div>
            
            <div>
              <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-1">
                Precio (USD) *
              </label>
              <input
                type="number"
                id="precio"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 29.99"
                required
              />
            </div>
            
            <div>
              <label htmlFor="video" className="block text-sm font-medium text-gray-700 mb-1">
                URL del Video Completo *
              </label>
              <input
                type="url"
                id="video"
                name="video"
                value={formData.video}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="URL del video completo (YouTube, Vimeo, etc.)"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Introduce la URL de embebido del video completo del curso.</p>
            </div>
            
            <div>
              <label htmlFor="videoPreview" className="block text-sm font-medium text-gray-700 mb-1">
                URL del Video de Vista Previa *
              </label>
              <input
                type="url"
                id="videoPreview"
                name="videoPreview"
                value={formData.videoPreview}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="URL del video de vista previa (YouTube, Vimeo, etc.)"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Introduce la URL de embebido para la vista previa del curso.</p>
            </div>
            
            <div>
              <label htmlFor="categorias" className="block text-sm font-medium text-gray-700 mb-1">
                Categorías
              </label>
              <input
                type="text"
                id="categorias"
                name="categorias"
                value={formData.categorias}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Bitcoin, Ethereum, Trading (separadas por comas)"
              />
              <p className="mt-1 text-sm text-gray-500">Introduce las categorías separadas por comas.</p>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Creando...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Crear Curso
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 