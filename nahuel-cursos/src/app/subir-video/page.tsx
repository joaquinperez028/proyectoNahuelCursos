'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EstadoVideoMux } from '@/components/EstadoVideoMux';
import { useSession } from 'next-auth/react';

export default function SubirVideoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Estado para video y subida
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewFile, setVideoPreviewFile] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [uploadPreviewId, setUploadPreviewId] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [playbackPreviewId, setPlaybackPreviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estado para formulario del curso
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    precio: '',
    categorias: ''
  });
  
  // Estado para control de pasos
  const [paso, setPaso] = useState(1);
  const [guardandoCurso, setGuardandoCurso] = useState(false);
  const [cursoGuardado, setCursoGuardado] = useState(false);
  
  // Verificar si el usuario está autenticado
  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-8">
        <p className="text-center">Cargando...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Acceso restringido</h1>
        <p className="mb-4">Necesitas iniciar sesión para subir videos.</p>
        <button
          onClick={() => router.push('/auth/login?redirect=/subir-video')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };
  
  const handleVideoPreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoPreviewFile(e.target.files[0]);
    }
  };

  const subirVideo = async (file: File, esVideoPrincipal: boolean) => {
    setError(null);
    
    if (!file) {
      setError(`Selecciona un archivo de video ${esVideoPrincipal ? 'principal' : 'de vista previa'}`);
      return null;
    }

    setSubiendo(true);

    try {
      // 1. Pedir la URL de subida a tu backend
      const res = await fetch('/api/mux/direct-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al obtener URL de subida');
      }

      // 2. Subir el archivo directamente a MUX
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Error al subir el video a MUX');
      }

      return data.uploadId;
    } catch (err: any) {
      setError(err.message || 'Error inesperado al subir el video');
      return null;
    } finally {
      setSubiendo(false);
    }
  };

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que hay archivos seleccionados
    if (!videoFile) {
      setError('Selecciona un archivo de video principal');
      return;
    }
    
    if (!videoPreviewFile) {
      setError('Selecciona un archivo de video de vista previa (trailer)');
      return;
    }
    
    // Subir video principal
    const uploadIdResult = await subirVideo(videoFile, true);
    if (!uploadIdResult) return;
    setUploadId(uploadIdResult);
    
    // Subir video de vista previa
    const uploadPreviewIdResult = await subirVideo(videoPreviewFile, false);
    if (!uploadPreviewIdResult) return;
    setUploadPreviewId(uploadPreviewIdResult);
    
    // Avanzar al siguiente paso
    setPaso(2);
  };
  
  // Cuando el video principal esté listo
  const handleReady = async (id: string) => {
    setPlaybackId(id);
  };
  
  // Cuando el video de vista previa esté listo
  const handleReadyPreview = async (id: string) => {
    setPlaybackPreviewId(id);
  };
  
  // Verificar si podemos avanzar al paso 3
  const puedeAvanzarPaso3 = playbackId && playbackPreviewId;
  
  const handleAvanzarPaso3 = () => {
    if (puedeAvanzarPaso3) {
      setPaso(3);
    } else {
      setError('Espera a que ambos videos estén procesados');
    }
  };
  
  const validarFormulario = () => {
    if (!formData.titulo) {
      setError('El título es obligatorio');
      return false;
    }
    
    if (!formData.descripcion) {
      setError('La descripción es obligatoria');
      return false;
    }
    
    if (!formData.precio) {
      setError('El precio es obligatorio');
      return false;
    }
    
    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio < 0) {
      setError('El precio debe ser un número válido mayor o igual a cero');
      return false;
    }
    
    return true;
  };
  
  const handleGuardarCurso = async () => {
    if (!validarFormulario()) return;
    if (!playbackId || !playbackPreviewId) {
      setError('Faltan IDs de reproducción de los videos');
      return;
    }
    
    setGuardandoCurso(true);
    setError(null);
    
    try {
      const cursoData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        video: `https://stream.mux.com/${playbackId}.m3u8`,
        videoPreview: `https://stream.mux.com/${playbackPreviewId}.m3u8`,
        muxVideoId: playbackId,
        muxVideoPreviewId: playbackPreviewId,
        categorias: formData.categorias ? formData.categorias.split(',').map(cat => cat.trim()) : []
      };
      
      const res = await fetch('/api/cursos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cursoData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el curso');
      }
      
      setCursoGuardado(true);
      
      // Opcional: redirigir al curso creado
      setTimeout(() => {
        router.push(`/cursos/${data.id}`);
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Error al guardar el curso');
    } finally {
      setGuardandoCurso(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Crear curso nuevo</h1>
      
      {/* Pasos */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paso >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
          <div className={`h-1 flex-1 mx-2 ${paso >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paso >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
          <div className={`h-1 flex-1 mx-2 ${paso >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paso >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</div>
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <div className="w-24 text-center">Subir videos</div>
          <div className="w-24 text-center">Procesar</div>
          <div className="w-24 text-center">Datos del curso</div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {/* Paso 1: Selección y subida de archivos */}
      {paso === 1 && (
        <form onSubmit={handleSubmitVideo}>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-4">Selecciona los videos para tu curso</h2>
              
              <div className="mb-6">
                <label className="block mb-2 font-medium">Video completo del curso</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="w-full border border-gray-300 rounded p-2"
                  disabled={subiendo}
                />
                <p className="text-sm text-gray-500 mt-1">Este será el video principal al que tendrán acceso los usuarios que compren el curso.</p>
              </div>
              
              <div className="mb-6">
                <label className="block mb-2 font-medium">Video de vista previa (trailer)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoPreviewChange}
                  className="w-full border border-gray-300 rounded p-2"
                  disabled={subiendo}
                />
                <p className="text-sm text-gray-500 mt-1">Este será el video de muestra que todos podrán ver, incluso sin comprar el curso.</p>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
                disabled={subiendo || !videoFile || !videoPreviewFile}
              >
                {subiendo ? 'Subiendo...' : 'Continuar al paso 2'}
              </button>
            </div>
          </div>
        </form>
      )}
      
      {/* Paso 2: Procesamiento de videos */}
      {paso === 2 && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium mb-4">Procesando videos</h2>
          
          <div className="space-y-6 mb-8">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium mb-2">Video completo del curso</h3>
              {uploadId ? (
                <EstadoVideoMux uploadId={uploadId} onReady={handleReady} />
              ) : (
                <p className="text-yellow-600">No se pudo iniciar el procesamiento.</p>
              )}
            </div>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium mb-2">Video de vista previa</h3>
              {uploadPreviewId ? (
                <EstadoVideoMux uploadId={uploadPreviewId} onReady={handleReadyPreview} />
              ) : (
                <p className="text-yellow-600">No se pudo iniciar el procesamiento.</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setPaso(1)}
              className="text-blue-600 hover:text-blue-800"
              disabled={subiendo}
            >
              ← Volver
            </button>
            
            <button
              onClick={handleAvanzarPaso3}
              className={`px-6 py-2 rounded ${puedeAvanzarPaso3 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              disabled={!puedeAvanzarPaso3}
            >
              Continuar al paso 3
            </button>
          </div>
        </div>
      )}
      
      {/* Paso 3: Datos del curso */}
      {paso === 3 && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium mb-4">Información del curso</h2>
          
          {cursoGuardado ? (
            <div className="p-6 bg-green-50 text-green-800 rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-xl font-bold mb-2">¡Curso creado con éxito!</h3>
              <p className="mb-4">Tu curso ha sido creado y estará disponible para tus estudiantes.</p>
              <p className="text-sm">Redirigiendo al curso...</p>
            </div>
          ) : (
            <form className="space-y-4">
              <div>
                <label htmlFor="titulo" className="block font-medium mb-1">Título del curso*</label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded p-2"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="descripcion" className="block font-medium mb-1">Descripción*</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleFormChange}
                  rows={5}
                  className="w-full border border-gray-300 rounded p-2"
                  required
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="precio" className="block font-medium mb-1">Precio (USD)*</label>
                <input
                  type="number"
                  id="precio"
                  name="precio"
                  value={formData.precio}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded p-2"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="categorias" className="block font-medium mb-1">Categorías (separadas por comas)</label>
                <input
                  type="text"
                  id="categorias"
                  name="categorias"
                  value={formData.categorias}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded p-2"
                  placeholder="Ej: Bitcoin, Inversiones, Finanzas"
                />
              </div>
              
              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Volver
                </button>
                
                <button
                  type="button"
                  onClick={handleGuardarCurso}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded flex items-center"
                  disabled={guardandoCurso}
                >
                  {guardandoCurso ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    'Crear curso'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
} 