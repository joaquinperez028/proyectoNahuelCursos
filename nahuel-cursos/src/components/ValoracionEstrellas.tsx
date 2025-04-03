'use client';

import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';

interface ValoracionEstrellasProps {
  calificacion: number;
  totalValoraciones?: number;
  tamano?: 'sm' | 'md' | 'lg';
  mostrarTotal?: boolean;
  className?: string;
}

export default function ValoracionEstrellas({
  calificacion,
  totalValoraciones = 0,
  tamano = 'md',
  mostrarTotal = true,
  className = ''
}: ValoracionEstrellasProps) {
  // Asegurar que la calificación esté entre 0 y 5
  const rating = Math.max(0, Math.min(5, calificacion || 0));
  
  // Determinar el tamaño de las estrellas
  const tamanoClase = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-xl'
  }[tamano];
  
  // Función para renderizar estrellas (incluye medias estrellas)
  const renderizarEstrellas = () => {
    return Array.from({ length: 5 }).map((_, i) => {
      const valor = i + 1;
      
      if (rating >= valor) {
        // Estrella completa
        return <FaStar key={i} className="text-yellow-400 mr-0.5" />;
      } else if (rating >= valor - 0.5) {
        // Media estrella
        return <FaStarHalfAlt key={i} className="text-yellow-400 mr-0.5" />;
      } else {
        // Estrella vacía
        return <FaRegStar key={i} className="text-yellow-400 mr-0.5" />;
      }
    });
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className={`flex ${tamanoClase}`}>
        {renderizarEstrellas()}
      </div>
      
      {mostrarTotal && totalValoraciones > 0 && (
        <span className="text-gray-500 text-xs ml-1">
          ({totalValoraciones})
        </span>
      )}
    </div>
  );
} 