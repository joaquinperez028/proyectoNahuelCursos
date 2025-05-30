"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PackType {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  courses: { _id: string; title: string }[];
  imageUrl?: string;
  imageData?: {
    data: string;
    contentType: string;
  };
  active: boolean;
}

export default function AdminPacksPage() {
  const [packs, setPacks] = useState<PackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const res = await fetch("/api/packs");
        if (!res.ok) throw new Error("Error al cargar packs");
        const data = await res.json();
        setPacks(data);
      } catch (err) {
        setPacks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPacks();
  }, []);

  const handleToggleActive = async (packId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/packs/${packId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !currentActive
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar el pack');
      }

      // Actualizar el estado local
      setPacks(packs.map(pack => 
        pack._id === packId 
          ? { ...pack, active: !pack.active }
          : pack
      ));

      router.refresh();
    } catch (error: any) {
      setError(error.message);
      console.error('Error al actualizar el pack:', error);
    }
  };

  // Función helper para obtener la URL de la imagen
  const getPackImageSrc = (pack: PackType): string | undefined => {
    if (pack.imageData && pack.imageData.data) {
      return `data:${pack.imageData.contentType};base64,${pack.imageData.data}`;
    }
    return pack.imageUrl || undefined;
  };

  return (
    <div className="min-h-screen bg-[#1E1E2F] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Administración de Packs de Cursos</h1>
              <p className="mt-2 text-[#B4B4C0]">Gestiona los paquetes de cursos de la plataforma</p>
            </div>
            <Link
              href="/admin/packs/nuevo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45a049] transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Crear nuevo pack
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-[#2A2A3C] rounded-xl shadow-2xl border border-[#3A3A4C] overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#4CAF50] border-t-transparent rounded-full mb-4"></div>
              <p className="text-[#B4B4C0]">Cargando packs...</p>
            </div>
          ) : packs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-[#3A3A4C] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#8A8A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No hay packs disponibles</h3>
              <p className="text-[#B4B4C0] mb-6">Comienza creando tu primer pack de cursos</p>
              <Link
                href="/admin/packs/nuevo"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45a049] transition-all duration-200 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear el primer pack
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#3A3A4C]">
                <thead className="bg-[#1E1E2F]">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#8A8A9A] uppercase tracking-wider">
                      Pack
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#8A8A9A] uppercase tracking-wider">
                      Cursos Incluidos
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#8A8A9A] uppercase tracking-wider">
                      Precio
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#8A8A9A] uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-[#8A8A9A] uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#2A2A3C] divide-y divide-[#3A3A4C]">
                  {packs.map((pack) => (
                    <tr key={pack._id} className="hover:bg-[#3A3A4C] transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPackImageSrc(pack) ? (
                            <div className="relative h-12 w-12 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                              <img
                                className="h-full w-full object-cover"
                                src={getPackImageSrc(pack)}
                                alt={pack.name}
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 bg-[#3A3A4C] rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                              <svg className="w-6 h-6 text-[#8A8A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{pack.name}</div>
                            <div className="text-sm text-[#B4B4C0] truncate max-w-xs">{pack.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#B4B4C0]">
                          <div className="flex flex-wrap gap-1">
                            {pack.courses.slice(0, 2).map((course) => (
                              <span key={course._id} className="inline-block bg-[#3A3A4C] text-[#E0E0E0] px-2 py-1 rounded text-xs">
                                {course.title}
                              </span>
                            ))}
                            {pack.courses.length > 2 && (
                              <span className="inline-block bg-[#4CAF50] bg-opacity-20 text-[#4CAF50] px-2 py-1 rounded text-xs">
                                +{pack.courses.length - 2} más
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8A8A9A] mt-1">
                            {pack.courses.length} curso{pack.courses.length !== 1 ? 's' : ''} total{pack.courses.length !== 1 ? 'es' : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-lg font-bold text-[#4CAF50]">${pack.price / 100}</div>
                          <div className="text-sm text-[#8A8A9A] line-through">${pack.originalPrice / 100}</div>
                          <div className="text-xs text-[#4CAF50]">
                            {Math.round((1 - pack.price / pack.originalPrice) * 100)}% OFF
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          pack.active 
                            ? 'bg-green-500 bg-opacity-20 text-green-400'
                            : 'bg-red-500 bg-opacity-20 text-red-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            pack.active ? 'bg-green-400' : 'bg-red-400'
                          }`}></span>
                          {pack.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link 
                            href={`/admin/packs/editar/${pack._id}`} 
                            className="text-[#4CAF50] hover:text-[#45a049] transition-colors duration-200"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleToggleActive(pack._id, pack.active)}
                            className={`transition-colors duration-200 ${
                              pack.active 
                                ? 'text-orange-400 hover:text-orange-300'
                                : 'text-[#4CAF50] hover:text-[#45a049]'
                            }`}
                          >
                            {pack.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <Link 
                            href={`/admin/packs/eliminar/${pack._id}`} 
                            className="text-red-400 hover:text-red-300 transition-colors duration-200"
                          >
                            Eliminar
                          </Link>
                        </div>
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