import { useState } from 'react';
import { FaStar, FaRegStar, FaShoppingCart, FaVideo, FaMobile, FaSync } from 'react-icons/fa';

interface PrecioCursoProps {
  precio: number;
  promedio: number;
  totalValoraciones: number;
  onComprar: () => Promise<void>;
}

export default function PrecioCurso({ 
  precio, 
  promedio, 
  totalValoraciones, 
  onComprar 
}: PrecioCursoProps) {
  const [procesandoCompra, setProcesandoCompra] = useState(false);

  const handleCompra = async () => {
    setProcesandoCompra(true);
    try {
      await onComprar();
    } finally {
      setProcesandoCompra(false);
    }
  };

  return (
    <div className="bg-green-900 text-white rounded-xl p-6 shadow-lg">
      <div className="text-3xl font-bold mb-2">${precio.toFixed(2)}</div>
      <p className="text-green-200 mb-6">Acceso de por vida al contenido del curso</p>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="flex text-green-400">
          {[1, 2, 3, 4, 5].map((estrella) => (
            <span key={estrella}>
              {estrella <= promedio ? <FaStar /> : <FaRegStar />}
            </span>
          ))}
        </div>
        <span className="text-green-200">({totalValoraciones})</span>
      </div>

      <button
        onClick={handleCompra}
        disabled={procesandoCompra}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <FaShoppingCart />
        {procesandoCompra ? 'Procesando...' : 'Comprar curso'}
      </button>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Este curso incluye:</h3>
        <ul className="space-y-3">
          <li className="flex items-center gap-2 text-green-200">
            <FaVideo className="text-green-400" />
            Video curso completo
          </li>
          <li className="flex items-center gap-2 text-green-200">
            <FaMobile className="text-green-400" />
            Acceso desde cualquier dispositivo
          </li>
          <li className="flex items-center gap-2 text-green-200">
            <FaSync className="text-green-400" />
            Actualizaciones gratuitas
          </li>
        </ul>
      </div>
    </div>
  );
} 