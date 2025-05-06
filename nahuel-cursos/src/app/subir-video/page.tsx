'use client';

import { useState } from 'react';
import { EstadoVideoMux } from '@/components/EstadoVideoMux';

export default function SubirVideoPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!videoFile) {
      setError('Selecciona un archivo de video');
      return;
    }

    setSubiendo(true);

    try {
      // 1. Pedir la URL de subida a tu backend
      const res = await fetch('/api/mux/direct-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: videoFile.name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al obtener URL de subida');
        setSubiendo(false);
        return;
      }

      // 2. Subir el archivo directamente a MUX
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': videoFile.type,
        },
        body: videoFile,
      });

      if (!uploadRes.ok) {
        setError('Error al subir el video a MUX');
        setSubiendo(false);
        return;
      }

      setUploadId(data.uploadId);
    } catch (err: any) {
      setError('Error inesperado al subir el video');
    } finally {
      setSubiendo(false);
    }
  };

  // Cuando el video esté listo, puedes guardar el playbackId en tu base de datos
  const handleReady = async (playbackId: string) => {
    setPlaybackId(playbackId);
    // Aquí podrías hacer una petición a tu backend para asociar el playbackId a un curso
    // await fetch('/api/cursos/asociar-video', { ... })
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-8 rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Subir video nuevo</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 font-medium">Archivo de video</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="w-full"
            disabled={subiendo}
          />
        </div>
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          disabled={subiendo}
        >
          {subiendo ? 'Subiendo...' : 'Subir video'}
        </button>
      </form>
      {uploadId && (
        <div className="mt-4">
          <EstadoVideoMux uploadId={uploadId} onReady={handleReady} />
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>
      )}
      {playbackId && (
        <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded">
          <p>URL de reproducción (guárdala para tu curso):</p>
          <code>{`https://stream.mux.com/${playbackId}.m3u8`}</code>
        </div>
      )}
    </div>
  );
} 