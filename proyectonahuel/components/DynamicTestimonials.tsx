'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { StarIcon } from '@heroicons/react/20/solid';

interface Testimonial {
  id: string;
  name: string;
  imageUrl: string | null;
  courseName: string;
  rating: number;
  comment: string;
  date: string;
}

const DynamicTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Testimonios de respaldo en caso de que falle la carga desde la API
  const fallbackTestimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Carlos Rodríguez',
      imageUrl: null,
      courseName: 'Trading con Criptomonedas',
      rating: 5,
      comment: 'Después de completar este curso, he logrado aumentar mi cartera de inversiones en un 40%. Las estrategias enseñadas son prácticas y efectivas.',
      date: new Date().toISOString()
    },
    {
      id: '2',
      name: 'María González',
      imageUrl: null,
      courseName: 'Introducción a la Bolsa de Valores',
      rating: 5,
      comment: 'Excelente curso para principiantes. Ahora entiendo cómo funciona el mercado de valores y he comenzado a crear mi portafolio de inversiones con confianza.',
      date: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Javier Martínez',
      imageUrl: null,
      courseName: 'Finanzas Personales Avanzadas',
      rating: 4,
      comment: 'He aprendido a organizar mis finanzas, crear un presupuesto efectivo y empezar a invertir de manera inteligente. Recomendaría este curso a cualquiera.',
      date: new Date().toISOString()
    }
  ];

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch('/api/testimonials');
        
        if (!response.ok) {
          throw new Error('Error al cargar testimonios');
        }
        
        const data = await response.json();
        
        // Si hay resultados, usar los datos de la API
        if (data && data.length > 0) {
          setTestimonials(data);
        } else {
          // Si no hay resultados, usar los testimonios de respaldo
          setTestimonials(fallbackTestimonials);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        setError('No se pudieron cargar los testimonios');
        // Usar los testimonios de respaldo en caso de error
        setTestimonials(fallbackTestimonials);
        setIsLoading(false);
      }
    };
    
    fetchTestimonials();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((item) => (
          <div key={item} className="p-6 bg-gray-800 rounded-xl shadow-xl border border-gray-700 animate-pulse">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-700 mr-4"></div>
              <div>
                <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-32"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {testimonials.map((testimonial) => (
        <div key={testimonial.id} className="p-6 bg-gray-800 rounded-xl shadow-xl border border-gray-700 hover:bg-gray-700 transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 bg-gray-700 flex items-center justify-center text-green-500">
              {testimonial.imageUrl ? (
                <Image 
                  src={testimonial.imageUrl} 
                  alt={testimonial.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <span className="text-xl font-bold">{testimonial.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">{testimonial.name}</h4>
              <p className="text-sm text-gray-400">Curso: {testimonial.courseName}</p>
            </div>
          </div>
          
          <div className="flex mb-2">
            {[...Array(5)].map((_, i) => (
              <StarIcon 
                key={i} 
                className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-500'}`} 
              />
            ))}
          </div>
          
          <p className="text-gray-300 italic">"{testimonial.comment}"</p>
        </div>
      ))}
    </div>
  );
};

export default DynamicTestimonials; 