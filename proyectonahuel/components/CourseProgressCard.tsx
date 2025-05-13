import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type CourseProgressProps = {
  id: string;
  title: string;
  progress: number;
  startDate: string;
  lastUpdate: string;
  thumbnailUrl?: string;
};

export default function CourseProgressCard({
  id,
  title,
  progress,
  startDate,
  lastUpdate,
  thumbnailUrl
}: CourseProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-[#2A2A3C] rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="p-4">
        <div className="flex items-center gap-4">
          {thumbnailUrl && (
            <div className="flex-shrink-0 w-20 h-20 relative rounded-md overflow-hidden">
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 80px, 80px"
              />
            </div>
          )}

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">{title}</h3>
            
            {/* Barra de progreso */}
            <div className="w-full bg-[#3A3A4C] rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-[#4CAF50] to-[#45a049] h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${animatedProgress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm text-[#B4B4C0] mb-2">
              <span>{animatedProgress}% completado</span>
            </div>
            
            <div className="flex justify-between text-xs text-[#8A8A9A]">
              <span>Iniciado: {formatDate(startDate)}</span>
              <span>Última actividad: {formatDate(lastUpdate)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Link 
            href={`/cursos/${id}`}
            className="px-4 py-2 bg-[#007bff] text-white rounded-md hover:bg-[#0069d9] transition-colors duration-200 text-sm font-medium"
          >
            Continuar Curso
          </Link>
        </div>
      </div>
    </div>
  );
} 