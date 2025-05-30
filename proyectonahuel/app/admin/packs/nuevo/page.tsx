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
  const [precio, setPrecio] = useState("");
  const [precioOriginal, setPrecioOriginal] = useState("");
  const [imagen, setImagen] = useState("");
  const [cursos, setCursos] = useState<string[]>([]);
  const [cursosDisponibles, setCursosDisponibles] = useState<{_id: string, title: string}[]>([]);
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
    
    // Validaciones
    if (!nombre.trim()) {
      setError("El nombre del pack es obligatorio");
      return;
    }
    if (!descripcion.trim()) {
      setError("La descripción es obligatoria");
      return;
    }
    if (!precio || Number(precio) <= 0) {
      setError("El precio promocional debe ser mayor a 0");
      return;
    }
    if (!precioOriginal || Number(precioOriginal) <= 0) {
      setError("El precio original debe ser mayor a 0");
      return;
    }
    if (Number(precio) >= Number(precioOriginal)) {
      setError("El precio promocional debe ser menor al precio original");
      return;
    }
    if (cursos.length === 0) {
      setError("Debe seleccionar al menos un curso");
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
          price: Number(precio),
          originalPrice: Number(precioOriginal),
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

  const calcularDescuento = () => {
    if (precio && precioOriginal && Number(precio) > 0 && Number(precioOriginal) > 0) {
      const descuento = ((Number(precioOriginal) - Number(precio)) / Number(precioOriginal)) * 100;
      return Math.round(descuento);
    }
    return 0;
  };

  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1E1E2F] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#4CAF50] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Crear Nuevo Pack</h1>
              <p className="text-[#B4B4C0]">Crea un paquete de cursos con precio promocional</p>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/admin/packs" className="text-[#4CAF50] hover:text-[#45a049] transition-colors">
              Packs
            </Link>
            <span className="text-[#8A8A9A]">/</span>
            <span className="text-[#B4B4C0]">Nuevo Pack</span>
          </nav>
        </div>

        {/* Form Container */}
        <div className="bg-[#2A2A3C] rounded-xl shadow-2xl border border-[#3A3A4C] overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Información Básica */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-[#4CAF50] bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white">Información Básica</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Nombre del pack */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                      Nombre del Pack *
                    </label>
                    <input 
                      type="text" 
                      value={nombre} 
                      onChange={e => setNombre(e.target.value)} 
                      required 
                      placeholder="Ej: Pack Desarrollo Web Completo"
                      className="w-full bg-[#1E1E2F] border border-[#3A3A4C] rounded-lg px-4 py-3 text-white placeholder-[#8A8A9A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                      Descripción *
                    </label>
                    <textarea 
                      value={descripcion} 
                      onChange={e => setDescripcion(e.target.value)} 
                      required 
                      rows={4}
                      placeholder="Describe el contenido y beneficios del pack..."
                      className="w-full bg-[#1E1E2F] border border-[#3A3A4C] rounded-lg px-4 py-3 text-white placeholder-[#8A8A9A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* Imagen */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-[#E0E0E0] mb-3">
                      Imagen del Pack
                    </label>
                    
                    {/* Selector de método */}
                    <div className="mb-4">
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setImageMethod('url')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            imageMethod === 'url'
                              ? 'bg-[#4CAF50] text-white'
                              : 'bg-[#2A2A3C] text-[#B4B4C0] border border-[#3A3A4C] hover:bg-[#3A3A4C]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            URL
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageMethod('file')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            imageMethod === 'file'
                              ? 'bg-[#4CAF50] text-white'
                              : 'bg-[#2A2A3C] text-[#B4B4C0] border border-[#3A3A4C] hover:bg-[#3A3A4C]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Subir Archivo
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Input según método seleccionado */}
                    {imageMethod === 'url' ? (
                      <input 
                        type="url" 
                        value={imagen} 
                        onChange={e => setImagen(e.target.value)} 
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="w-full bg-[#1E1E2F] border border-[#3A3A4C] rounded-lg px-4 py-3 text-white placeholder-[#8A8A9A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition-all duration-200"
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start space-x-4">
                          <div className="flex-grow">
                            <input
                              type="file"
                              id="packImage"
                              ref={imageInputRef}
                              onChange={handleImageFileChange}
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="sr-only"
                              disabled={isUploadingImage || !!uploadedImageData}
                            />
                            <label
                              htmlFor="packImage"
                              className={`relative cursor-pointer bg-[#1E1E2F] py-3 px-4 border border-[#3A3A4C] rounded-lg shadow-sm text-sm font-medium ${
                                isUploadingImage || !!uploadedImageData 
                                  ? 'bg-[#2A2A3C] text-[#8A8A9A] cursor-not-allowed' 
                                  : 'text-white hover:bg-[#2A2A3C] border-dashed'
                              } focus:outline-none focus:ring-2 focus:ring-[#4CAF50] transition-all duration-200 block w-full text-center`}
                            >
                              <div className="space-y-2">
                                <svg className="mx-auto h-8 w-8 text-[#8A8A9A]" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div>
                                  <span className="text-[#4CAF50]">
                                    {uploadedImageData ? 'Imagen lista' : 'Hacer clic para seleccionar'}
                                  </span>
                                  <span className="text-[#8A8A9A]"> o arrastra aquí</span>
                                </div>
                                <p className="text-xs text-[#8A8A9A]">PNG, JPG, GIF, WEBP hasta 5MB</p>
                              </div>
                            </label>
                            
                            {imageFile && (
                              <p className="mt-2 text-sm text-[#B4B4C0]">
                                Archivo seleccionado: {imageFile.name}
                              </p>
                            )}

                            {imageFile && !uploadedImageData && !isUploadingImage && (
                              <button
                                type="button"
                                onClick={uploadImage}
                                className="mt-3 px-4 py-2 bg-[#4CAF50] text-white text-sm rounded-lg hover:bg-[#45a049] transition-colors duration-200"
                              >
                                Subir Imagen
                              </button>
                            )}
                          </div>
                          
                          {imagePreview && (
                            <div className="relative w-32 h-32 border border-[#3A3A4C] rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                              <Image
                                src={imagePreview}
                                alt="Vista previa de la imagen"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                        
                        {isUploadingImage && (
                          <div className="bg-[#1E1E2F] border border-[#3A3A4C] rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className="animate-spin h-5 w-5 border-2 border-[#4CAF50] border-t-transparent rounded-full"></div>
                              <span className="text-[#B4B4C0]">Subiendo imagen...</span>
                            </div>
                          </div>
                        )}
                        
                        {uploadedImageData && (
                          <div className="bg-[#4CAF50] bg-opacity-10 border border-[#4CAF50] border-opacity-30 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-[#4CAF50] rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <p className="text-[#4CAF50] font-medium">
                                ✓ Imagen subida correctamente y lista para usar
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Precios */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-[#4CAF50] bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white">Configuración de Precios</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Precio Original */}
                  <div>
                    <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                      Precio Original ($) *
                    </label>
                    <input 
                      type="number" 
                      value={precioOriginal} 
                      onChange={e => setPrecioOriginal(e.target.value)} 
                      required 
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      className="w-full bg-[#1E1E2F] border border-[#3A3A4C] rounded-lg px-4 py-3 text-white placeholder-[#8A8A9A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Precio Promocional */}
                  <div>
                    <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                      Precio Promocional ($) *
                    </label>
                    <input 
                      type="number" 
                      value={precio} 
                      onChange={e => setPrecio(e.target.value)} 
                      required 
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      className="w-full bg-[#1E1E2F] border border-[#3A3A4C] rounded-lg px-4 py-3 text-white placeholder-[#8A8A9A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Preview de descuento */}
                {precio && precioOriginal && Number(precio) > 0 && Number(precioOriginal) > 0 && Number(precio) < Number(precioOriginal) && (
                  <div className="bg-[#4CAF50] bg-opacity-10 border border-[#4CAF50] border-opacity-30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#4CAF50] rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#4CAF50] font-semibold">
                          ¡Excelente! Los clientes ahorrarán ${(Number(precioOriginal) - Number(precio)).toFixed(2)} ({calcularDescuento()}% de descuento)
                        </p>
                        <p className="text-[#B4B4C0] text-sm">
                          Precio final: ${Number(precio).toFixed(2)} (antes ${Number(precioOriginal).toFixed(2)})
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cursos */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-[#4CAF50] bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Cursos Incluidos</h2>
                    <p className="text-[#B4B4C0] text-sm">Selecciona los cursos que formarán parte de este pack</p>
                  </div>
                </div>

                {loadingCursos ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin h-6 w-6 border-2 border-[#4CAF50] border-t-transparent rounded-full"></div>
                      <span className="text-[#B4B4C0]">Cargando cursos...</span>
                    </div>
                  </div>
                ) : cursosDisponibles.length === 0 ? (
                  <div className="bg-[#1E1E2F] border border-[#3A3A4C] rounded-lg p-8 text-center">
                    <svg className="w-12 h-12 text-[#8A8A9A] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-[#8A8A9A] mb-2">No hay cursos disponibles</p>
                    <p className="text-[#6A6A7A] text-sm">Necesitas crear cursos primero para poder crear un pack</p>
                  </div>
                ) : (
                  <div className="bg-[#1E1E2F] border border-[#3A3A4C] rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cursosDisponibles.map((curso) => (
                        <label 
                          key={curso._id} 
                          className="flex items-center gap-3 p-4 bg-[#2A2A3C] border border-[#3A3A4C] rounded-lg hover:bg-[#3A3A4C] transition-all duration-200 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={cursos.includes(curso._id)}
                            onChange={() => handleCursoChange(curso._id)}
                            className="w-5 h-5 bg-[#1E1E2F] border-2 border-[#4CAF50] rounded focus:ring-2 focus:ring-[#4CAF50] focus:ring-opacity-50 text-[#4CAF50]"
                          />
                          <span className="text-white group-hover:text-[#4CAF50] transition-colors duration-200 flex-1">
                            {curso.title}
                          </span>
                          {cursos.includes(curso._id) && (
                            <div className="w-6 h-6 bg-[#4CAF50] rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                    
                    {cursos.length > 0 && (
                      <div className="mt-4 p-4 bg-[#4CAF50] bg-opacity-10 border border-[#4CAF50] border-opacity-30 rounded-lg">
                        <p className="text-[#4CAF50] font-medium">
                          {cursos.length} curso{cursos.length !== 1 ? 's' : ''} seleccionado{cursos.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg p-4">
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

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-[#3A3A4C]">
                <Link 
                  href="/admin/packs" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2A2A3C] text-[#B4B4C0] border border-[#3A3A4C] rounded-lg hover:bg-[#3A3A4C] hover:text-white transition-all duration-200 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Cancelar
                </Link>
                
                <button 
                  type="submit" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45a049] transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando Pack...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Crear Pack
                    </>
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