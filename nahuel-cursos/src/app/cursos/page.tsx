'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp, FaSpinner } from 'react-icons/fa';

interface Curso {
  _id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  videoPreview: string;
  fechaCreacion: string;
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
      
      const response = await axios.get<CursosResponse>(`/api/cursos?${params.toString()}`);
      setCursos(response.data.cursos);
      setTotalPaginas(response.data.meta.totalPaginas);
      setError('');
    } catch (err) {
      console.error('Error al obtener cursos:', err);
      setError('Ocurrió un error al cargar los cursos. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Explora nuestros cursos</h1>
        <p className="text-lg text-gray-600">
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
              {ordenPrecio === 'asc' ? <FaSortAmountUp className="mr-2" /> : <FaSortAmountDown className="mr-2" />}
              Precio {ordenPrecio === 'asc' ? '↑' : ordenPrecio === 'desc' ? '↓' : ''}
            </button>
            
            <button
              onClick={toggleOrdenFecha}
              className="flex items-center bg-gray-100 text-gray-800 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
            >
              {ordenFecha === 'asc' ? <FaSortAmountUp className="mr-2" /> : <FaSortAmountDown className="mr-2" />}
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
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-8">
          {error}
        </div>
      ) : cursos.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-xl font-medium text-gray-600 mb-4">No se encontraron cursos</h3>
          <p className="text-gray-500">Intenta con otros filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {cursos.map((curso) => (
            <div key={curso._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                {/* Aquí iría el video de vista previa */}
                <div className="w-full h-48 bg-blue-100 flex items-center justify-center">
                  <iframe 
                    src={curso.videoPreview} 
                    className="w-full h-full object-cover"
                    title={curso.titulo}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{curso.titulo}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{curso.descripcion}</p>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-bold">${curso.precio.toFixed(2)}</span>
                  <Link
                    href={`/cursos/${curso._id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    Ver detalles
                  </Link>
                </div>
              </div>
            </div>
          ))}
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