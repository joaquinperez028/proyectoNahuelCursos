'use client';

import { useEffect, useState } from 'react';

interface CourseProgressProps {
  courseId: string;
  userHasCourse: boolean;
}

interface ProgressData {
  totalProgress: number;
  isCompleted: boolean;
  completedAt: string | null;
  certificateIssued: boolean;
  certificateUrl: string | null;
}

const CourseProgress = ({ courseId, userHasCourse }: CourseProgressProps) => {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);

  useEffect(() => {
    if (userHasCourse && courseId) {
      fetchProgress();
      
      // Configurar polling más inteligente: menos frecuente si ya hay progreso
      const interval = setInterval(() => {
        // Si ya hay progreso considerable, hacer polling menos frecuente
        if (progress && progress.totalProgress > 80) {
          // Solo cada 30 segundos si ya está cerca de completar
          return;
        }
        fetchProgress();
      }, 30000); // 30 segundos en lugar de 10
      
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [courseId, userHasCourse, progress?.totalProgress]);

  // Escuchar eventos de visibilidad para refrescar cuando el usuario vuelve a la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userHasCourse && courseId) {
        fetchProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [courseId, userHasCourse]);

  // Escuchar eventos de actualización de progreso desde CourseViewer
  useEffect(() => {
    const handleProgressUpdate = (event: any) => {
      if (event.detail.courseId === courseId) {
        fetchProgress();
      }
    };

    window.addEventListener('courseProgressUpdated', handleProgressUpdate);
    return () => window.removeEventListener('courseProgressUpdated', handleProgressUpdate);
  }, [courseId]);

  const fetchProgress = async () => {
    if (!userHasCourse || !courseId) return;
    
    try {
      const response = await fetch(`/api/progress/check?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProgress(data.progress);
        }
      }
    } catch (error) {
      console.error('Error al cargar progreso del curso:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generar o ver certificado
  const handleCertificateAction = async () => {
    if (!progress?.isCompleted) return;

    // Si ya existe el certificado, redirigir al certificado
    if (progress.certificateIssued && progress.certificateUrl) {
      window.open(progress.certificateUrl, '_blank');
      return;
    }

    // Si no existe, generar el certificado
    setIsGeneratingCertificate(true);
    
    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Actualizar el progreso local con el nuevo certificado
          setProgress(prev => prev ? {
            ...prev,
            certificateIssued: true,
            certificateUrl: data.certificateUrl
          } : null);
          
          // Abrir el certificado
          window.open(data.certificateUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Error al generar certificado:', error);
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  // No mostrar nada si el usuario no tiene acceso al curso
  if (!userHasCourse) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-4 bg-[var(--neutral-700)] rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-[var(--neutral-700)] rounded w-full mb-2"></div>
          <div className="h-2 bg-[var(--neutral-700)] rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const progressPercentage = Math.round(progress.totalProgress);
  const isCompleted = progress.isCompleted;

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--neutral-100)]">
          Tu Progreso del Curso
        </h3>
        <div className="flex items-center space-x-2">
          {isCompleted && (
            <div className="flex items-center text-green-500">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Completado</span>
            </div>
          )}
          <span className={`text-lg font-bold ${isCompleted ? 'text-green-500' : 'text-[var(--primary)]'}`}>
            {progressPercentage}%
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Barra de progreso principal */}
        <div className="w-full bg-[var(--neutral-800)] rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ease-out ${
              isCompleted ? 'bg-green-500' : 'bg-[var(--primary)]'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>

        {/* Información adicional */}
        <div className="flex justify-between text-sm text-[var(--neutral-400)]">
          <span>
            {isCompleted ? '¡Felicitaciones! Has completado este curso' : 'Continúa viendo para completar el curso'}
          </span>
          {progress.completedAt && (
            <span>
              Completado el {new Date(progress.completedAt).toLocaleDateString('es-ES')}
            </span>
          )}
        </div>

        {/* Certificado - SIEMPRE mostrar cuando esté completado */}
        {isCompleted && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <div>
                  <p className="text-green-800 font-medium">
                    {progress.certificateIssued ? 'Certificado disponible' : 'Certificado listo para generar'}
                  </p>
                  <p className="text-green-600 text-sm">
                    {progress.certificateIssued 
                      ? 'Tu certificado de finalización está listo' 
                      : 'Has completado el curso. ¡Obtén tu certificado!'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleCertificateAction}
                disabled={isGeneratingCertificate}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Ver certificado
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Motivación para continuar */}
        {!isCompleted && progressPercentage > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-blue-800 text-sm">
                ¡Vas muy bien! Sigue así para completar el curso y obtener tu certificado.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseProgress; 