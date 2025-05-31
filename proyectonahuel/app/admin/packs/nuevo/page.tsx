"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function NuevoPackPage() {
  const { data: session, status } = useSession();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [cursos, setCursos] = useState<string[]>([]);
  const [cursosDisponibles, setCursosDisponibles] = useState<{_id: string, title: string, price: number}[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Estados para upload de imagen
  const [imageMethod, setImageMethod] = useState<'url' | 'file'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageData, setUploadedImageData] = useState<{ data: string, contentType: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Redireccionar si no es administrador
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/perfil');
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const res = await fetch("/api/courses");
        if (!res.ok) throw new Error("Error al cargar cursos");
        const data = await res.json();
        setCursosDisponibles(data.map((c: any) => ({ _id: c._id, title: c.title, price: c.price || 0 })));
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

  // Calcular precios automáticamente
  const calcularPreciosAutomaticos = () => {
    if (cursos.length === 0) return { totalCursos: 0, precioPackConDescuento: 0, descuentoPorPack: 0 };
    
    const cursosSeleccionados = cursosDisponibles.filter(curso => cursos.includes(curso._id));
    const totalCursos = cursosSeleccionados.reduce((sum, curso) => sum + curso.price, 0);
    const precioPackConDescuento = Math.round(totalCursos * 0.9); // 10% descuento
    const descuentoPorPack = totalCursos - precioPackConDescuento;
    
    return { totalCursos, precioPackConDescuento, descuentoPorPack };
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Crear una vista previa de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    setIsUploadingImage(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir la imagen');
      }
      
      const data = await response.json();
      setUploadedImageData(data.imageData);
      setIsUploadingImage(false);
      
      return data.imageData;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al subir la imagen');
      }
      setIsUploadingImage(false);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const { totalCursos, precioPackConDescuento } = calcularPreciosAutomaticos();
    
    // Validaciones
    if (!nombre.trim()) {
      setError("El nombre del pack es obligatorio");
      return;
    }
    if (!descripcion.trim()) {
      setError("La descripción es obligatoria");
      return;
    }
    if (cursos.length === 0) {
      setError("Debe seleccionar al menos un curso");
      return;
    }
    if (totalCursos === 0) {
      setError("Los cursos seleccionados deben tener precio configurado");
      return;
    }

    setLoading(true);
    try {
      // Subir imagen si se seleccionó un archivo y no se ha subido aún
      let finalImageData = null;
      if (imageMethod === 'file' && imageFile && !uploadedImageData) {
        finalImageData = await uploadImage();
        if (!finalImageData) {
          setLoading(false);
          return;
        }
      } else if (imageMethod === 'file' && uploadedImageData) {
        finalImageData = uploadedImageData;
      }

      const res = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nombre,
          description: descripcion,
          price: precioPackConDescuento, // Precio calculado automáticamente
          originalPrice: totalCursos, // Total de cursos sin descuento
          courses: cursos,
          imageUrl: imageMethod === 'url' ? imagen : '',
          imageData: finalImageData
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

  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Simple */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            📦 Crear Nuevo Pack
          </h1>
          <p className="text-gray-400">
            Crea un paquete de cursos con descuento automático del 10%. El precio se calcula automáticamente sumando los cursos seleccionados.
          </p>
          
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/admin/packs" className="text-blue-400 hover:text-blue-300">
              Packs
            </Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-300">Nuevo Pack</span>
          </nav>
        </div>

        {/* Form Container */}
        <div className="bg-[#2A2A3C] rounded-lg shadow-lg border border-gray-600">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Información Básica */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white border-b border-gray-600 pb-2">
                  📝 Información Básica
                </h2>

                {/* Nombre del pack */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre del Pack *
                  </label>
                  <input 
                    type="text" 
                    value={nombre} 
                    onChange={e => setNombre(e.target.value)} 
                    required 
                    placeholder="Ej: Pack Desarrollo Web Completo"
                    className="w-full bg-[#1E1E2F] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descripción *
                  </label>
                  <textarea 
                    value={descripcion} 
                    onChange={e => setDescripcion(e.target.value)} 
                    required 
                    rows={4}
                    placeholder="Describe el contenido y beneficios del pack..."
                    className="w-full bg-[#1E1E2F] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Imagen */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Imagen del Pack
                  </label>
                  
                  {/* Selector de método */}
                  <div className="mb-4">
                    <div className="flex gap-2 bg-[#1E1E2F] p-1 rounded-lg border border-gray-600">
                      <button
                        type="button"
                        onClick={() => setImageMethod('url')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          imageMethod === 'url'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        URL Externa
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageMethod('file')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          imageMethod === 'file'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        Subir Archivo
                      </button>
                    </div>
                  </div>

                  {/* Input según método seleccionado */}
                  {imageMethod === 'url' ? (
                    <div className="space-y-3">
                      <input 
                        type="url" 
                        value={imagen} 
                        onChange={e => setImagen(e.target.value)} 
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="w-full bg-[#1E1E2F] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {imagen && (
                        <div className="relative rounded-lg overflow-hidden border border-gray-600">
                          <Image 
                            src={imagen} 
                            alt="Vista previa" 
                            width={400} 
                            height={200}
                            className="w-full h-48 object-cover"
                            onError={() => setImagen("")}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageFileChange} 
                        ref={imageInputRef}
                        className="hidden"
                        id="packImage"
                        disabled={isUploadingImage || !!uploadedImageData}
                      />
                      
                      <label
                        htmlFor="packImage"
                        className={`cursor-pointer bg-[#1E1E2F] border-2 border-dashed border-gray-600 rounded-lg p-8 text-center block hover:border-blue-500 transition-colors ${
                          isUploadingImage || !!uploadedImageData ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="mx-auto w-12 h-12 text-gray-400">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-blue-400 font-medium">
                              {uploadedImageData ? 'Imagen lista' : 'Hacer clic para seleccionar'}
                            </span>
                            <p className="text-gray-400 text-sm">PNG, JPG, GIF hasta 5MB</p>
                          </div>
                        </div>
                      </label>

                      {/* Vista previa */}
                      {imagePreview && !uploadedImageData && (
                        <div className="relative rounded-lg overflow-hidden border border-gray-600">
                          <Image 
                            src={imagePreview} 
                            alt="Vista previa" 
                            width={400} 
                            height={200}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}

                      {/* Botón de subida */}
                      {imageFile && !uploadedImageData && (
                        <button
                          type="button"
                          onClick={uploadImage}
                          disabled={isUploadingImage}
                          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploadingImage ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Subiendo...
                            </span>
                          ) : (
                            'Subir Imagen'
                          )}
                        </button>
                      )}

                      {/* Confirmación */}
                      {uploadedImageData && (
                        <div className="bg-blue-600 bg-opacity-20 border border-blue-500 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                              <p className="text-white font-medium">¡Imagen subida correctamente!</p>
                              <p className="text-gray-300 text-sm">Lista para usar en el pack</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selección de cursos */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white border-b border-gray-600 pb-2">
                  📚 Cursos Incluidos
                </h2>

                {loadingCursos ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <span className="text-gray-300">Cargando cursos...</span>
                    </div>
                  </div>
                ) : cursosDisponibles.length === 0 ? (
                  <div className="bg-[#1E1E2F] border border-gray-600 rounded-lg p-8 text-center">
                    <h3 className="text-lg font-medium text-white mb-2">No hay cursos disponibles</h3>
                    <p className="text-gray-400 mb-4">Necesitas crear cursos primero</p>
                    <Link 
                      href="/admin/cursos/nuevo"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Crear primer curso
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cursosDisponibles.map((curso) => (
                        <label 
                          key={curso._id} 
                          className="flex items-center gap-3 p-4 bg-[#1E1E2F] border border-gray-600 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={cursos.includes(curso._id)}
                            onChange={() => handleCursoChange(curso._id)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <span className="text-white font-medium">{curso.title}</span>
                            <div className="text-sm text-gray-400">${curso.price}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    {/* Contador y precios */}
                    {cursos.length > 0 && (
                      <div className="bg-[#1E1E2F] border border-gray-600 rounded-lg p-4 space-y-4">
                        <p className="text-gray-300 font-medium">
                          {cursos.length} curso{cursos.length !== 1 ? 's' : ''} seleccionado{cursos.length !== 1 ? 's' : ''}
                        </p>
                        
                        {/* Calculadora de precios automática */}
                        {(() => {
                          const { totalCursos, precioPackConDescuento, descuentoPorPack } = calcularPreciosAutomaticos();
                          return totalCursos > 0 ? (
                            <div className="bg-blue-600 bg-opacity-20 border border-blue-500 rounded-lg p-4">
                              <h4 className="text-white font-semibold mb-3">💰 Precios Calculados Automáticamente</h4>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-300">Total cursos individuales:</span>
                                  <span className="text-white font-medium">${totalCursos}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-300">Descuento del pack (10%):</span>
                                  <span className="text-green-400 font-medium">-${descuentoPorPack}</span>
                                </div>
                                <div className="border-t border-gray-600 pt-2 mt-2">
                                  <div className="flex justify-between text-lg">
                                    <span className="text-white font-semibold">Precio final del pack:</span>
                                    <span className="text-green-400 font-bold">${precioPackConDescuento}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-3 text-xs text-gray-400">
                                Los usuarios que ya tengan algunos cursos pagarán menos (se descontará el precio de los cursos que ya posean)
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-red-400 font-medium">Error</p>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-600">
                <Link 
                  href="/admin/packs" 
                  className="flex-1 sm:flex-none px-6 py-3 text-center bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </Link>
                
                <button 
                  type="submit" 
                  className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </span>
                  ) : (
                    'Crear Pack'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 