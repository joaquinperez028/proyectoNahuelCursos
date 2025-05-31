"use client";

import { useEffect, useState } from "react";
import CreateFakeReviewButton from "@/components/CreateFakeReviewButton";

interface Review {
  _id: string;
  rating: number;
  comment: string;
  userId?: { _id: string; name: string; image?: string };
  courseId: { _id: string; title: string };
  createdAt: string;
  isFakeUser?: boolean;
  fakeUserName?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error("Error al obtener reseñas");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta reseña?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar reseña");
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      alert(err.message || "Error desconocido");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = reviews.filter((r) => {
    const userName = r.isFakeUser ? r.fakeUserName : r.userId?.name;
    return (!filterUser || userName?.toLowerCase().includes(filterUser.toLowerCase())) &&
           (!filterCourse || r.courseId.title.toLowerCase().includes(filterCourse.toLowerCase()));
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Moderación de Reseñas</h1>
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Filtrar por usuario"
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
          className="px-3 py-2 rounded bg-neutral-800 text-white border border-neutral-700"
        />
        <input
          type="text"
          placeholder="Filtrar por curso"
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          className="px-3 py-2 rounded bg-neutral-800 text-white border border-neutral-700"
        />
        <button onClick={fetchReviews} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Refrescar
        </button>
        <CreateFakeReviewButton onReviewCreated={fetchReviews} />
      </div>
      
      {loading ? (
        <div className="text-white">Cargando reseñas...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-neutral-400">No hay reseñas para mostrar.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div key={r._id} className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-400 font-bold">{"★".repeat(r.rating)}</span>
                  <span className="text-neutral-400 text-xs">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-white font-medium mb-1">
                  {r.isFakeUser ? (
                    <span>
                      {r.fakeUserName} <span className="text-orange-400 text-xs">(Usuario falso)</span>
                    </span>
                  ) : (
                    r.userId?.name
                  )} en <span className="text-blue-300">{r.courseId.title}</span>
                </div>
                <div className="text-neutral-200">{r.comment}</div>
              </div>
              <button
                onClick={() => handleDelete(r._id)}
                disabled={deleting === r._id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
              >
                {deleting === r._id ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 