'use client';

import { useState, useEffect } from 'react';

type StatisticType = 'students' | 'courses' | 'instructors' | 'satisfactionRate';

interface StatisticCounterProps {
  type: StatisticType;
  label: string;
  suffix?: string;
}

const StatisticCounter = ({ type, label, suffix = '' }: StatisticCounterProps) => {
  const [value, setValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Valores predeterminados por si falla la carga
  const defaultValues = {
    students: 10000,
    courses: 100,
    instructors: 50,
    satisfactionRate: 98
  };
  
  // Duración de la animación en milisegundos
  const animationDuration = 2000;
  
  useEffect(() => {
    // Función para obtener los datos de la API
    const fetchStatistics = async () => {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
          throw new Error('Error al cargar estadísticas');
        }
        
        const data = await response.json();
        
        // Comienza la animación para contar desde 0 hasta el valor final
        const startTime = Date.now();
        const endValue = data[type] || defaultValues[type];
        
        const animateCounter = () => {
          const currentTime = Date.now();
          const elapsedTime = currentTime - startTime;
          
          if (elapsedTime < animationDuration) {
            // Calcular el progreso (0 a 1) y aplicar una función de aceleración
            const progress = elapsedTime / animationDuration;
            // Función de aceleración: easeOutQuad
            const easedProgress = 1 - Math.pow(1 - progress, 2);
            
            // Calcular el valor actual basado en el progreso
            const currentValue = Math.floor(easedProgress * endValue);
            setValue(currentValue);
            
            requestAnimationFrame(animateCounter);
          } else {
            // Asegúrate de establecer el valor final exacto
            setValue(endValue);
          }
        };
        
        animateCounter();
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        // Usar valores predeterminados en caso de error
        setValue(defaultValues[type]);
        setIsLoading(false);
      }
    };
    
    fetchStatistics();
  }, [type]);
  
  // Formatear el número para mostrar "+" después de 1000
  const formatValue = (val: number): string => {
    if (val >= 10000) {
      return `${Math.floor(val / 1000)}k+`;
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k+`;
    } else {
      return `${val}+`;
    }
  };
  
  return (
    <div className="p-4">
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-10 bg-gray-700 rounded mb-2"></div>
          <div className="h-5 bg-gray-700 rounded w-3/4 mx-auto"></div>
        </div>
      ) : (
        <>
          <p className="text-3xl md:text-4xl font-bold text-green-500">
            {type === 'satisfactionRate' ? `${value}${suffix}` : formatValue(value)}
          </p>
          <p className="text-gray-400">{label}</p>
        </>
      )}
    </div>
  );
};

export default StatisticCounter; 