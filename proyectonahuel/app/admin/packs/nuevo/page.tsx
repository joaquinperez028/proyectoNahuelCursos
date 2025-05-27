"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NuevoPackPage() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [precioOriginal, setPrecioOriginal] = useState("");
  const [imagen, setImagen] = useState("");
  const [cursos, setCursos] = useState<string[]>([]);
  const [cursosDisponibles, setCursosDisponibles] = useState<{_id: string, title: string}[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nombre,
          description: descripcion,
          price: Number(precio),
          originalPrice: Number(precioOriginal),
          courses: cursos,
          imageUrl: imagen
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear el pack");
      }
      router.push("/admin/packs");
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Crear nuevo Pack de Cursos</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del pack</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className="w-full border rounded px-3 py-2 text-black bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} required className="w-full border rounded px-3 py-2 text-black bg-white" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio promocional ($)</label>
              <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} required min={0} className="w-full border rounded px-3 py-2 text-black bg-white" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio original ($)</label>
              <input type="number" value={precioOriginal} onChange={e => setPrecioOriginal(e.target.value)} required min={0} className="w-full border rounded px-3 py-2 text-black bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (URL)</label>
            <input type="text" value={imagen} onChange={e => setImagen(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white" />
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
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-between items-center mt-6">
            <Link href="/admin/packs" className="text-gray-600 hover:underline">Cancelar</Link>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold" disabled={loading}>
              {loading ? "Creando..." : "Crear pack"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 