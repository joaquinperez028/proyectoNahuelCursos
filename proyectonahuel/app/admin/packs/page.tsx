"use client";

import { useState } from "react";
import Link from "next/link";

interface PackType {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  courses: { _id: string; title: string }[];
  imageUrl?: string;
}

export default function AdminPacksPage() {
  const [packs, setPacks] = useState<PackType[]>([
    {
      _id: "pack1",
      name: "Pack Trading Pro",
      description: "Aprende análisis técnico y fundamental con este pack de 3 cursos.",
      price: 19999,
      originalPrice: 35000,
      courses: [
        { _id: "c1", title: "Análisis Técnico" },
        { _id: "c2", title: "Análisis Fundamental" },
        { _id: "c3", title: "Estrategias de Trading" },
      ],
      imageUrl: "https://placehold.co/400x200/4CAF50/FFFFFF?text=Pack+Trading+Pro",
    },
    {
      _id: "pack2",
      name: "Pack Finanzas Personales",
      description: "Domina tus finanzas y aprende a invertir.",
      price: 14999,
      originalPrice: 25000,
      courses: [
        { _id: "c4", title: "Finanzas Personales" },
        { _id: "c5", title: "Inversiones Básicas" },
      ],
      imageUrl: "https://placehold.co/400x200/009688/FFFFFF?text=Pack+Finanzas",
    },
  ]);

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
        {packs.length === 0 ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packs.map((pack) => (
                  <tr key={pack._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {pack.imageUrl && (
                          <img src={pack.imageUrl} alt={pack.name} className="h-12 w-20 object-cover rounded mr-3" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{pack.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{pack.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ul className="text-xs text-gray-700 list-disc pl-4">
                        {pack.courses.map((c) => (
                          <li key={c._id}>{c.title}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-bold">${(pack.price / 100).toFixed(2)}</div>
                      <div className="text-xs line-through text-gray-400">${(pack.originalPrice / 100).toFixed(2)}</div>
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
                          className="text-red-600 hover:text-red-900 text-sm"
                          onClick={() => setPacks(packs.filter((p) => p._id !== pack._id))}
                        >
                          Eliminar
                        </button>
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