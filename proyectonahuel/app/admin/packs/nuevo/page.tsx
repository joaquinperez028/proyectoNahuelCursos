"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function NuevoPackPage() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [precioOriginal, setPrecioOriginal] = useState("");
  const [imagen, setImagen] = useState("");
  const [cursos, setCursos] = useState<string[]>([]);
  const [cursosDisponibles, setCursosDisponibles] = useState<{_id: string, title: string}[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(true);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const res = await fetch("/api/courses");
        if (!res.ok) throw new Error("Error al cargar cursos");
        const data = await res.json();
        setCursosDisponibles(data.map((c: any) => ({ _id: c._id, title: c.title })));
      } catch (err) {
        setCursosDisponibles([]);
      } finally {
        setLoadingCursos(false);
      }
    };
    fetchCursos();
  }, []);

  const handleCursoChange = (id: string) => {
    setCursos((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar el pack (POST a /api/packs)
    alert("Pack creado (mock): " + nombre);
  };

  return (
    <div className="py-10">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Crear nuevo Pack de Cursos</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del pack</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio promocional ($)</label>
              <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} required min={0} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio original ($)</label>
              <input type="number" value={precioOriginal} onChange={e => setPrecioOriginal(e.target.value)} required min={0} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (URL)</label>
            <input type="text" value={imagen} onChange={e => setImagen(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cursos incluidos</label>
            {loadingCursos ? (
              <div className="text-gray-400 text-sm">Cargando cursos...</div>
            ) : cursosDisponibles.length === 0 ? (
              <div className="text-gray-400 text-sm">No hay cursos disponibles.</div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {cursosDisponibles.map((curso) => (
                  <label key={curso._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cursos.includes(curso._id)}
                      onChange={() => handleCursoChange(curso._id)}
                    />
                    <span>{curso.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-6">
            <Link href="/admin/packs" className="text-gray-600 hover:underline">Cancelar</Link>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold">Crear pack</button>
          </div>
        </form>
      </div>
    </div>
  );
} 