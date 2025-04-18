'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp, FaSpinner, FaSort, FaSortUp, FaSortDown, FaSyncAlt, FaExclamationCircle } from 'react-icons/fa';
import ValoracionEstrellas from '@/components/ValoracionEstrellas';
import VideoPlayer from '@/components/VideoPlayer';
import useVideoUrl from '@/lib/hooks/useVideoUrl';
import { ObjectId } from 'mongodb';

interface Curso {
  _id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  video: string;
  videoPreview: string;
  fechaCreacion: string;
  calificacionPromedio?: number;
  totalValoraciones?: number;
}

interface CursosResponse {
  cursos: Curso[];
  meta: {
    pagina: number;
    totalPaginas: number;
    total: number;
    porPagina: number;
  };
}

export default function Cursos() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorDetalle, setErrorDetalle] = useState('');
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [datosGenerados, setDatosGenerados] = useState(false);
  
  // Filtros y ordenamiento
  const [busqueda, setBusqueda] = useState('');
  const [ordenPrecio, setOrdenPrecio] = useState('');
  const [ordenFecha, setOrdenFecha] = useState('desc');
  
  // Paginación
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  
  // Mostrar filtros en dispositivos móviles
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const obtenerCursos = async () => {
    try {
      setLoading(true);
      setError('');
      setErrorDetalle('');
      
      const params = new URLSearchParams();
      params.append('pagina', pagina.toString());
      
      if (busqueda) {
        params.append('busqueda', busqueda);
      }
      
      if (ordenPrecio) {
        params.append('ordenPrecio', ordenPrecio);
      }
      
      if (ordenFecha) {
        params.append('ordenFecha', ordenFecha);
      }
      
      console.log('Obteniendo cursos con parámetros:', params.toString());
      const response = await axios.get<CursosResponse>(`/api/cursos?${params.toString()}`);
      
      console.log('Respuesta de API:', response.data);
      console.log(`Se obtuvieron ${response.data.cursos.length} cursos`);
      
      // Solo para depuración, imprimir información sobre cada curso
      response.data.cursos.forEach((curso, index) => {
        console.log(`Curso #${index + 1}: ${curso.titulo}`);
        console.log(`- ID: ${curso._id}`);
        console.log(`- Video: ${curso.video}`);
        console.log(`- VideoPreview: ${curso.videoPreview}`);
      });
      
      setCursos(response.data.cursos);
      setTotalPaginas(response.data.meta.totalPaginas);
    } catch (err: any) {
      console.error('Error al obtener cursos:', err);
      setError('Ocurrió un error al cargar los cursos. Intenta de nuevo más tarde.');
      
      // Mostrar información detallada del error si está disponible
      if (err.response?.data?.error) {
        setErrorDetalle(err.response.data.error);
        if (err.response.data.detalles) {
          console.error('Detalles del error:', err.response.data.detalles);
          setErrorDetalle(prev => `${prev}: ${err.response.data.detalles}`);
        }
      } else if (err.message) {
        setErrorDetalle(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para generar datos de ejemplo
  const generarDatosEjemplo = async () => {
    try {
      setCargandoDatos(true);
      const response = await axios.get('/api/seed-public');
      if (response.data.success) {
        setDatosGenerados(true);
        // Esperar un momento y luego recargar los cursos
        setTimeout(() => {
          obtenerCursos();
        }, 1500);
      } else {
        setError('No se pudieron generar los datos de ejemplo: ' + response.data.message);
      }
    } catch (err: any) {
      console.error('Error al generar datos de ejemplo:', err);
      setError('No se pudieron generar los datos de ejemplo.');
      if (err.response?.data?.message) {
        setErrorDetalle(err.response.data.message);
      } else if (err.message) {
        setErrorDetalle(err.message);
      }
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    obtenerCursos();
  }, [pagina, ordenPrecio, ordenFecha]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1); // Resetear paginación al buscar
    obtenerCursos();
  };

  const toggleOrdenPrecio = () => {
    if (ordenPrecio === 'asc') {
      setOrdenPrecio('desc');
    } else if (ordenPrecio === 'desc') {
      setOrdenPrecio('');
    } else {
      setOrdenPrecio('asc');
    }
  };

  const toggleOrdenFecha = () => {
    setOrdenFecha(ordenFecha === 'asc' ? 'desc' : 'asc');
  };

  const handlePaginaAnterior = () => {
    if (pagina > 1) {
      setPagina(pagina - 1);
    }
  };

  const handlePaginaSiguiente = () => {
    if (pagina < totalPaginas) {
      setPagina(pagina + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-blue-900 py-4 px-6 rounded-t-xl mb-6">
        <h1 className="text-3xl font-bold text-white mb-0">Explora nuestros cursos</h1>
        <p className="text-lg text-white mb-0">
          Descubre los mejores cursos para aprender sobre inversiones en criptomonedas
        </p>
      </div>
      
      {/* Filtros y búsqueda */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="flex items-center md:hidden mb-4 bg-blue-50 hover:bg-blue-100 text-blue-800 px-4 py-2 rounded-lg transition-colors"
          >
            <FaFilter className="mr-2" /> {mostrarFiltros ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>
          
          <div className={`w-full md:w-auto space-y-4 md:space-y-0 md:flex md:space-x-4 ${mostrarFiltros ? 'block' : 'hidden md:flex'}`}>
            <button
              onClick={toggleOrdenPrecio}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                ordenPrecio 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {ordenPrecio === 'asc' ? <FaSortUp className="mr-2" /> : <FaSortDown className="mr-2" />}
              Precio {ordenPrecio === 'asc' ? '↑' : ordenPrecio === 'desc' ? '↓' : ''}
            </button>
            
            <button
              onClick={toggleOrdenFecha}
              className="flex items-center bg-gray-100 text-gray-800 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
            >
              {ordenFecha === 'asc' ? <FaSortUp className="mr-2" /> : <FaSortDown className="mr-2" />}
              Fecha {ordenFecha === 'asc' ? 'Antiguos primero' : 'Recientes primero'}
            </button>
          </div>
          
          <form onSubmit={handleBuscar} className="w-full md:w-auto mt-4 md:mt-0">
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar cursos..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <FaSearch className="text-gray-400" />
              </div>
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-600 hover:text-blue-800"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Lista de cursos */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <FaSpinner className="animate-spin text-blue-600 text-4xl" />
          <span className="ml-3 text-blue-600 text-xl">Cargando cursos...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FaExclamationCircle className="text-red-600 text-xl mt-1" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="mt-2">{error}</p>
              {errorDetalle && (
                <div className="mt-2 p-2 bg-red-100 rounded-md text-sm overflow-auto">
                  <p className="font-mono">{errorDetalle}</p>
                </div>
              )}
              <button 
                onClick={obtenerCursos}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      ) : cursos.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg p-8">
          <h3 className="text-xl font-medium text-gray-600 mb-4">No hay cursos disponibles</h3>
          <p className="text-gray-500 mb-8">Parece que aún no hay cursos en la base de datos.</p>
          
          {datosGenerados ? (
            <div className="text-green-600 mb-4">
              ¡Datos generados con éxito! Cargando cursos...
              <div className="flex justify-center mt-2">
                <FaSpinner className="animate-spin text-green-600 text-xl" />
              </div>
            </div>
          ) : (
            <button
              onClick={generarDatosEjemplo}
              disabled={cargandoDatos}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {cargandoDatos ? (
                <>
                  <FaSpinner className="animate-spin inline-block mr-2" />
                  Generando datos...
                </>
              ) : (
                'Generar datos de ejemplo'
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {cursos.map((curso) => {
            // Procesamos la URL del video aquí usando nuestro hook
            const videoPreviewUrl = useVideoUrl(curso.videoPreview);
            
            console.log(`Renderizando curso ${curso._id}:`);
            console.log(`- URL original: ${curso.videoPreview}`);
            console.log(`- URL procesada: ${videoPreviewUrl}`);
            
            return (
              <div key={curso._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  {/* Video de vista previa con VideoPlayer */}
                  <div className="w-full h-48 bg-blue-100 relative">
                    {videoPreviewUrl ? (
                      <VideoPlayer 
                        src={videoPreviewUrl} 
                        className="absolute inset-0" 
                        autoPlay={false}
                        stopPropagation={true}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center p-4">
                          <FaExclamationCircle className="text-amber-500 text-4xl mx-auto mb-2" />
                          <span className="text-blue-600 block">Vista previa no disponible</span>
                          <span className="text-gray-500 text-sm block mt-1">ID: {curso._id}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{curso.titulo}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{curso.descripcion}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-blue-600 font-bold">${curso.precio.toFixed(2)}</span>
                      {curso.calificacionPromedio !== undefined && (
                        <ValoracionEstrellas 
                          calificacion={curso.calificacionPromedio} 
                          totalValoraciones={curso.totalValoraciones} 
                          tamano="sm"
                          className="mt-1" 
                        />
                      )}
                    </div>
                    <Link
                      href={`/cursos/${curso._id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      Ver detalles
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Paginación */}
      {!loading && cursos.length > 0 && (
        <div className="flex justify-between items-center">
          <button
            onClick={handlePaginaAnterior}
            disabled={pagina === 1}
            className={`px-4 py-2 rounded-lg transition-colors ${
              pagina === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Anterior
          </button>
          
          <span className="text-gray-600">
            Página {pagina} de {totalPaginas}
          </span>
          
          <button
            onClick={handlePaginaSiguiente}
            disabled={pagina === totalPaginas}
            className={`px-4 py-2 rounded-lg transition-colors ${
              pagina === totalPaginas
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
} 