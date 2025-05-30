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
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);

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

  // Generar o ver certificado
  const handleCertificateAction = async () => {
    setIsGeneratingCertificate(true);
    
    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId: id })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Abrir el certificado en nueva ventana
          window.open(data.certificateUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Error al generar certificado:', error);
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  const isCompleted = animatedProgress >= 100;

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
                className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                  isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-[#4CAF50] to-[#45a049]'
                }`}
                style={{ width: `${animatedProgress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm text-[#B4B4C0] mb-2">
              <span className={isCompleted ? 'text-green-400 font-medium' : ''}>
                {animatedProgress}% {isCompleted ? '¡Completado!' : 'completado'}
              </span>
              {isCompleted && (
                <span className="text-green-400 text-xs">
                  🎉 Certificado disponible
                </span>
              )}
            </div>
            
            <div className="flex justify-between text-xs text-[#8A8A9A]">
              <span>Iniciado: {formatDate(startDate)}</span>
              <span>Última actividad: {formatDate(lastUpdate)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
          {isCompleted ? (
            <button
              onClick={handleCertificateAction}
              disabled={isGeneratingCertificate}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingCertificate ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Ver certificado
                </>
              )}
            </button>
          ) : (
            <Link 
              href={`/cursos/${id}`}
              className="px-4 py-2 bg-[#007bff] text-white rounded-md hover:bg-[#0069d9] transition-colors duration-200 text-sm font-medium"
            >
              Continuar Curso
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 