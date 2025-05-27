import { useState, useEffect } from 'react';

interface MuxVideo {
  id: string;
  playbackId: string;
  createdAt: string;
}

export default function HerramientasMuxPage() {
  const [videos, setVideos] = useState<MuxVideo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar videos reales desde la API
  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mux-assets');
      if (!res.ok) throw new Error('No se pudo obtener la lista de videos');
      const data = await res.json();
      setVideos(data.assets || []);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelected(videos.map(v => v.id));
  };

  const deselectAll = () => {
    setSelected([]);
  };

  const handleDelete = async () => {
    if (selected.length === 0) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/mux-assets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar videos');
      setSuccess(`Eliminados: ${data.results.filter((r: any) => r.deleted).length} / ${selected.length}`);
      setSelected([]);
      fetchVideos();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="py-10 bg-neutral-900 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-white mb-8">Herramientas Mux: Gestión de Videos</h1>
        {error && (
          <div className="bg-red-900 text-red-300 border border-red-700 rounded-lg px-3 py-2 text-sm mb-4">{error}</div>
        )}
        {success && (
          <div className="bg-green-900 text-green-300 border border-green-700 rounded-lg px-3 py-2 text-sm mb-4">{success}</div>
        )}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/90 font-semibold">Últimos 20 videos en Mux</span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="bg-neutral-700 hover:bg-neutral-600 text-white rounded-md px-3 py-1 text-sm">Seleccionar todos</button>
              <button onClick={deselectAll} className="bg-neutral-700 hover:bg-neutral-600 text-white rounded-md px-3 py-1 text-sm">Deseleccionar</button>
              <button onClick={handleDelete} disabled={selected.length === 0 || deleting} className="bg-red-700 hover:bg-red-600 text-white rounded-md px-3 py-1 text-sm disabled:opacity-50">
                {deleting ? 'Eliminando...' : 'Eliminar seleccionados'}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-neutral-400 py-8 text-center">Cargando videos...</div>
          ) : (
            <table className="w-full text-sm text-white/90">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="py-2 text-left">Seleccionar</th>
                  <th className="py-2 text-left">Playback ID</th>
                  <th className="py-2 text-left">Fecha de creación</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video.id} className="border-b border-neutral-800 hover:bg-neutral-700/40">
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(video.id)}
                        onChange={() => toggleSelect(video.id)}
                        className="accent-blue-500 w-4 h-4 rounded"
                      />
                    </td>
                    <td className="py-2 font-mono">{video.playbackId}</td>
                    <td className="py-2 text-neutral-400">{new Date(video.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 