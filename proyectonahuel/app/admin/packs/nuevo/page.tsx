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
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#1E1E2F] to-[#16213E] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Mejorado */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4CAF50] to-[#45a049] rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Crear Nuevo Pack
              </h1>
              <p className="text-lg text-[#B4B4C0] mt-1">
                Crea un paquete de cursos con precio promocional para aumentar tus ventas
              </p>
            </div>
          </div>
          
          {/* Breadcrumb Mejorado */}
          <nav className="flex items-center space-x-3 text-sm bg-[#2A2A3C] rounded-xl px-4 py-3 border border-[#3A3A4C]">
            <Link href="/admin/packs" className="text-[#4CAF50] hover:text-[#45a049] transition-colors font-medium">
              📦 Packs
            </Link>
            <svg className="w-4 h-4 text-[#8A8A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-[#E0E0E0] font-medium">✨ Nuevo Pack</span>
          </nav>
        </div>

        {/* Form Container Mejorado */}
        <div className="bg-gradient-to-br from-[#2A2A3C] to-[#252538] rounded-3xl shadow-2xl border border-[#3A3A4C] overflow-hidden">
          {/* Header del formulario */}
          <div className="bg-gradient-to-r from-[#4CAF50] to-[#45a049] px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Configuración del Pack</h2>
                <p className="text-green-100 text-sm">Completa todos los campos para crear tu pack</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Información Básica Mejorada */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4CAF50] to-[#45a049] bg-opacity-20 rounded-xl flex items-center justify-center border border-[#4CAF50] border-opacity-30">
                    <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">📝 Información Básica</h2>
                    <p className="text-[#B4B4C0]">Define el nombre, descripción e imagen de tu pack</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Nombre del pack */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-[#E0E0E0] mb-3">
                      🏷️ Nombre del Pack *
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={nombre} 
                        onChange={e => setNombre(e.target.value)} 
                        required 
                        placeholder="Ej: Pack Desarrollo Web Completo"
                        className="w-full bg-[#1E1E2F] border-2 border-[#3A3A4C] rounded-xl px-4 py-4 text-white placeholder-[#8A8A9A] focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition-all duration-300 text-lg font-medium"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <div className="w-2 h-2 bg-[#4CAF50] rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-[#E0E0E0] mb-3">
                      📄 Descripción *
                    </label>
                    <div className="relative">
                      <textarea 
                        value={descripcion} 
                        onChange={e => setDescripcion(e.target.value)} 
                        required 
                        rows={4}
                        placeholder="Describe el contenido y beneficios del pack. ¿Qué aprenderán los estudiantes? ¿Qué hace especial a este pack?"
                        className="w-full bg-[#1E1E2F] border-2 border-[#3A3A4C] rounded-xl px-4 py-4 text-white placeholder-[#8A8A9A] focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition-all duration-300 resize-none"
                      />
                      <div className="absolute top-4 right-4">
                        <div className="w-2 h-2 bg-[#4CAF50] rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Imagen Mejorada */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-[#E0E0E0] mb-4">
                      🖼️ Imagen del Pack
                    </label>
                    
                    {/* Selector de método mejorado */}
                    <div className="mb-6">
                      <div className="flex gap-3 bg-[#1E1E2F] p-2 rounded-xl border border-[#3A3A4C]">
                        <button
                          type="button"
                          onClick={() => setImageMethod('url')}
                          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                            imageMethod === 'url'
                              ? 'bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white shadow-lg'
                              : 'bg-transparent text-[#B4B4C0] hover:bg-[#2A2A3C] hover:text-white'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            🔗 URL Externa
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageMethod('file')}
                          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                            imageMethod === 'file'
                              ? 'bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white shadow-lg'
                              : 'bg-transparent text-[#B4B4C0] hover:bg-[#2A2A3C] hover:text-white'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            📁 Subir Archivo
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Input según método seleccionado */}
                    {imageMethod === 'url' ? (
                      <div className="space-y-4">
                        <input 
                          type="url" 
                          value={imagen} 
                          onChange={e => setImagen(e.target.value)} 
                          placeholder="https://ejemplo.com/imagen-del-pack.jpg"
                          className="w-full bg-[#1E1E2F] border-2 border-[#3A3A4C] rounded-xl px-4 py-4 text-white placeholder-[#8A8A9A] focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition-all duration-300"
                        />
                        {imagen && (
                          <div className="relative rounded-xl overflow-hidden border-2 border-[#4CAF50] border-opacity-30">
                            <Image 
                              src={imagen} 
                              alt="Vista previa" 
                              width={400} 
                              height={200}
                              className="w-full h-48 object-cover"
                              onError={() => setImagen("")}
                            />
                            <div className="absolute top-3 right-3 bg-[#4CAF50] text-white px-3 py-1 rounded-lg text-sm font-medium">
                              ✓ Vista previa
                            </div>
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
                          className={`relative cursor-pointer bg-gradient-to-br from-[#1E1E2F] to-[#252538] border-3 border-dashed rounded-2xl shadow-lg transition-all duration-300 ${
                            isUploadingImage || !!uploadedImageData 
                              ? 'border-[#4CAF50] bg-opacity-50 cursor-not-allowed' 
                              : 'border-[#3A3A4C] hover:border-[#4CAF50] hover:bg-[#2A2A3C]'
                          } focus:outline-none focus:ring-2 focus:ring-[#4CAF50] block w-full text-center p-8`}
                        >
                          <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#4CAF50] to-[#45a049] bg-opacity-20 rounded-2xl flex items-center justify-center">
                              <svg className="h-8 w-8 text-[#4CAF50]" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-[#4CAF50] font-bold text-lg">
                                {uploadedImageData ? '🎉 Imagen lista' : '📸 Hacer clic para seleccionar'}
                              </span>
                              <span className="text-[#8A8A9A] block mt-1"> o arrastra tu imagen aquí</span>
                            </div>
                            <p className="text-sm text-[#8A8A9A] bg-[#2A2A3C] rounded-lg px-4 py-2 inline-block">
                              PNG, JPG, GIF, WEBP hasta 5MB • Recomendado: 800x400px
                            </p>
                          </div>
                        </label>

                        {/* Vista previa mejorada */}
                        {imagePreview && !uploadedImageData && (
                          <div className="relative rounded-2xl overflow-hidden border-2 border-[#4CAF50] border-opacity-30 shadow-lg">
                            <Image 
                              src={imagePreview} 
                              alt="Vista previa" 
                              width={400} 
                              height={200}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 bg-white bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium">
                              📸 Vista previa - Haz clic en "Subir Imagen" para confirmar
                            </div>
                          </div>
                        )}

                        {/* Botón de subida */}
                        {imageFile && !uploadedImageData && (
                          <button
                            type="button"
                            onClick={uploadImage}
                            disabled={isUploadingImage}
                            className="w-full bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUploadingImage ? (
                              <span className="flex items-center justify-center gap-3">
                                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                ⏳ Subiendo imagen...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                🚀 Subir Imagen
                              </span>
                            )}
                          </button>
                        )}

                        {/* Confirmación de subida */}
                        {uploadedImageData && (
                          <div className="bg-gradient-to-r from-[#4CAF50] to-[#45a049] bg-opacity-20 border-2 border-[#4CAF50] border-opacity-40 rounded-2xl p-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-[#4CAF50] rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-[#4CAF50] font-bold text-lg">
                                  🎉 ¡Imagen subida correctamente!
                                </p>
                                <p className="text-[#4CAF50] text-sm opacity-80">
                                  Tu imagen está lista para usar en el pack
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Precios Mejorados */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4CAF50] to-[#45a049] bg-opacity-20 rounded-xl flex items-center justify-center border border-[#4CAF50] border-opacity-30">
                    <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">💰 Configuración de Precios</h2>
                    <p className="text-[#B4B4C0]">Define el precio original y promocional para crear urgencia</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Precio Original */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-[#E0E0E0] mb-3">
                      💵 Precio Original *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-[#4CAF50] font-bold text-lg">$</span>
                      </div>
                      <input 
                        type="number" 
                        value={precioOriginal} 
                        onChange={e => setPrecioOriginal(e.target.value)} 
                        required 
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full bg-[#1E1E2F] border-2 border-[#3A3A4C] rounded-xl pl-10 pr-4 py-4 text-white placeholder-[#8A8A9A] focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition-all duration-300 text-lg font-semibold"
                      />
                    </div>
                    <p className="text-sm text-[#8A8A9A]">El precio regular del pack completo</p>
                  </div>

                  {/* Precio Promocional */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-[#E0E0E0] mb-3">
                      🏷️ Precio Promocional *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-[#4CAF50] font-bold text-lg">$</span>
                      </div>
                      <input 
                        type="number" 
                        value={precio} 
                        onChange={e => setPrecio(e.target.value)} 
                        required 
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full bg-[#1E1E2F] border-2 border-[#3A3A4C] rounded-xl pl-10 pr-4 py-4 text-white placeholder-[#8A8A9A] focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition-all duration-300 text-lg font-semibold"
                      />
                    </div>
                    <p className="text-sm text-[#8A8A9A]">El precio especial del pack con descuento</p>
                  </div>
                </div>

                {/* Preview de descuento mejorado */}
                {calcularDescuento() > 0 && (
                  <div className="bg-gradient-to-r from-[#4CAF50] to-[#45a049] bg-opacity-20 border-2 border-[#4CAF50] border-opacity-30 rounded-2xl p-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-4 mb-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#4CAF50] to-[#45a049] rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl font-black text-white">{calcularDescuento()}%</span>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-[#4CAF50]">¡Descuento Aplicado!</p>
                          <p className="text-[#4CAF50] opacity-80">Los estudiantes ahorran ${(Number(precioOriginal) - Number(precio)).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-lg">
                        <span className="text-[#8A8A9A] line-through">${Number(precioOriginal).toFixed(2)}</span>
                        <span className="text-2xl">→</span>
                        <span className="text-3xl font-black text-[#4CAF50]">${Number(precio).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selección de cursos mejorada */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4CAF50] to-[#45a049] bg-opacity-20 rounded-xl flex items-center justify-center border border-[#4CAF50] border-opacity-30">
                    <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">📚 Cursos Incluidos</h2>
                    <p className="text-[#B4B4C0]">Selecciona los cursos que formarán parte de este pack especial</p>
                  </div>
                </div>

                {loadingCursos ? (
                  <div className="flex items-center justify-center py-16 bg-gradient-to-br from-[#1E1E2F] to-[#252538] rounded-2xl border border-[#3A3A4C]">
                    <div className="flex items-center gap-4">
                      <div className="animate-spin h-8 w-8 border-3 border-[#4CAF50] border-t-transparent rounded-full"></div>
                      <span className="text-[#B4B4C0] text-lg font-medium">🔄 Cargando cursos disponibles...</span>
                    </div>
                  </div>
                ) : cursosDisponibles.length === 0 ? (
                  <div className="bg-gradient-to-br from-[#1E1E2F] to-[#252538] border-2 border-[#3A3A4C] rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#8A8A9A] to-[#6A6A7A] bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-[#8A8A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">📚 No hay cursos disponibles</h3>
                    <p className="text-[#8A8A9A] mb-4">Necesitas crear cursos primero para poder crear un pack</p>
                    <Link 
                      href="/admin/cursos/nuevo"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      ✨ Crear primer curso
                    </Link>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-[#1E1E2F] to-[#252538] border-2 border-[#3A3A4C] rounded-2xl p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {cursosDisponibles.map((curso) => (
                        <label 
                          key={curso._id} 
                          className="group relative flex items-center gap-4 p-5 bg-gradient-to-br from-[#2A2A3C] to-[#252538] border-2 border-[#3A3A4C] rounded-xl hover:border-[#4CAF50] hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                        >
                          {/* Checkbox personalizado */}
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={cursos.includes(curso._id)}
                              onChange={() => handleCursoChange(curso._id)}
                              className="sr-only"
                            />
                            <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                              cursos.includes(curso._id)
                                ? 'bg-gradient-to-br from-[#4CAF50] to-[#45a049] border-[#4CAF50] shadow-lg'
                                : 'border-[#8A8A9A] group-hover:border-[#4CAF50]'
                            }`}>
                              {cursos.includes(curso._id) && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Contenido del curso */}
                          <div className="flex-1">
                            <h4 className="text-white group-hover:text-[#4CAF50] transition-colors duration-300 font-semibold text-lg">
                              📖 {curso.title}
                            </h4>
                            <p className="text-[#8A8A9A] text-sm mt-1">Curso disponible para incluir</p>
                          </div>

                          {/* Badge de seleccionado */}
                          {cursos.includes(curso._id) && (
                            <div className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-br from-[#4CAF50] to-[#45a049] rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}

                          {/* Efecto de hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] to-[#45a049] opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl"></div>
                        </label>
                      ))}
                    </div>
                    
                    {/* Contador de cursos seleccionados */}
                    {cursos.length > 0 && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-[#4CAF50] to-[#45a049] bg-opacity-20 border-2 border-[#4CAF50] border-opacity-30 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#4CAF50] to-[#45a049] rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-black text-lg">{cursos.length}</span>
                          </div>
                          <div>
                            <p className="text-[#4CAF50] font-bold text-lg">
                              🎯 {cursos.length} curso{cursos.length !== 1 ? 's' : ''} seleccionado{cursos.length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-[#4CAF50] opacity-80 text-sm">
                              Pack listo para crear con contenido valioso
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message Mejorado */}
              {error && (
                <div className="bg-gradient-to-r from-red-500 to-red-600 bg-opacity-20 border-2 border-red-500 border-opacity-40 rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-red-400 font-bold text-lg">⚠️ Error al crear el pack</p>
                      <p className="text-red-400 opacity-80">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Mejoradas */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-[#3A3A4C]">
                <Link 
                  href="/admin/packs" 
                  className="flex-1 sm:flex-initial sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-br from-[#2A2A3C] to-[#252538] text-[#B4B4C0] border-2 border-[#3A3A4C] rounded-xl hover:bg-[#3A3A4C] hover:text-white hover:border-[#4A4A5C] transition-all duration-300 font-semibold text-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  ← Cancelar
                </Link>
                
                <button 
                  type="submit" 
                  className="flex-1 sm:flex-initial sm:w-auto inline-flex items-center justify-center gap-3 px-12 py-4 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white rounded-xl hover:shadow-2xl transition-all duration-300 font-bold text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      ⏳ Creando Pack...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" />
                      </svg>
                      🚀 Crear Pack
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