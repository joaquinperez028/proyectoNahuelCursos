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
    <div className="py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[var(--neutral-100)]">
            Administración de Packs de Cursos
          </h1>
          <Link
            href="/admin/packs/nuevo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            + Crear nuevo pack
          </Link>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white shadow overflow-hidden rounded-lg p-10 text-center text-gray-500">Cargando packs...</div>
        ) : packs.length === 0 ? (
          <div className="bg-white shadow overflow-hidden rounded-lg p-10 text-center">
            <p className="text-gray-500 mb-4">No hay packs disponibles.</p>
            <Link
              href="/admin/packs/nuevo"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Crear el primer pack
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pack</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cursos incluidos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packs.map((pack) => (
                  <tr key={pack._id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getPackImageSrc(pack) && (
                          <img
                            className="h-10 w-10 rounded-lg object-cover mr-3"
                            src={getPackImageSrc(pack)}
                            alt={pack.name}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{pack.name}</div>
                          <div className="text-sm text-gray-500">{pack.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {pack.courses.map(course => course.title).join(", ")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">${pack.price / 100}</div>
                      <div className="text-sm text-gray-500 line-through">${pack.originalPrice / 100}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pack.active 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {pack.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/admin/packs/editar/${pack._id}`} 
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleToggleActive(pack._id, pack.active)}
                          className={`text-sm ${
                            pack.active 
                              ? 'text-orange-600 hover:text-orange-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {pack.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <Link 
                          href={`/admin/packs/eliminar/${pack._id}`} 
                          className="text-red-600 hover:text-red-900 text-sm"
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
  );
} 