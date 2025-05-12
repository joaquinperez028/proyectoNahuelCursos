'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ReviewProps {
  _id: string;
  rating: number;
  comment: string;
  userId: {
    _id: string;
    name: string;
    image?: string;
  };
  createdAt: string;
}

interface ReviewSectionProps {
  courseId: string;
  reviews: ReviewProps[];
}

const ReviewSection = ({ courseId, reviews }: ReviewSectionProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Verificar si el usuario ya ha hecho una reseña
  const userReview = session?.user ? reviews.find(review => review.userId._id === session.user.id) : null;

  // Si el usuario ya tiene una reseña, cargar sus valores
  useState(() => {
    if (userReview) {
      setUserRating(userReview.rating);
      setUserComment(userReview.comment);
    }
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (userRating === 0) {
      setErrorMessage('Por favor selecciona una puntuación');
      return;
    }
    
    if (userComment.trim().length === 0) {
      setErrorMessage('Por favor escribe un comentario');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const endpoint = userReview 
        ? `/api/reviews/${userReview._id}` 
        : '/api/reviews';
      
      const method = userReview ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          rating: userRating,
          comment: userComment,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al enviar la reseña');
      }
      
      // Recargar la página para mostrar la nueva reseña
      router.refresh();
      
      // Limpiar el formulario si es una nueva reseña
      if (!userReview) {
        setUserRating(0);
        setUserComment('');
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Ha ocurrido un error inesperado');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar la reseña');
      }
      
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Ha ocurrido un error inesperado');
      }
    }
  };

  const renderStarRating = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => setUserRating(value) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(value) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            className={`${interactive ? 'cursor-pointer focus:outline-none' : ''} transition-colors duration-200`}
            disabled={!interactive}
          >
            <svg 
              className={`w-5 h-5 ${
                value <= (hoverRating || rating) 
                  ? 'text-yellow-400' 
                  : interactive ? 'text-[var(--neutral-600)]' : 'text-[var(--neutral-700)]'
              }`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
            </svg>
          </button>
        ))}
      </div>
    );
  };

  // Calcular la puntuación media si hay reseñas
  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0;

  // Calcular distribución de estrellas
  const starDistribution = [0, 0, 0, 0, 0]; // [1-star, 2-stars, 3-stars, 4-stars, 5-stars]
  
  if (reviews.length > 0) {
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        starDistribution[review.rating - 1]++;
      }
    });
  }

  return (
    <div>
      {/* Resumen de valoraciones */}
      {reviews.length > 0 && (
        <div className="mb-8 p-6 bg-[var(--neutral-800)] rounded-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-[var(--neutral-100)] mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="mb-1">
                {renderStarRating(averageRating)}
              </div>
              <p className="text-[var(--neutral-400)] text-sm">
                {reviews.length} {reviews.length === 1 ? 'valoración' : 'valoraciones'}
              </p>
            </div>
            
            <div className="flex-grow">
              <div className="space-y-2 w-full max-w-md mx-auto">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = starDistribution[star - 1];
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  
                  return (
                    <div key={star} className="flex items-center text-sm">
                      <div className="w-6 text-[var(--neutral-400)]">{star}</div>
                      <svg className="w-4 h-4 text-yellow-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <div className="flex-grow mx-2">
                        <div className="w-full bg-[var(--neutral-700)] rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-[var(--neutral-400)] w-8 text-right">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reseñas existentes */}
      {reviews.length > 0 ? (
        <div className="space-y-6 mb-10">
          {reviews.map((review) => (
            <div key={review._id} className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)] hover:border-[var(--accent)] transition-colors duration-300">
              <div className="p-5">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {review.userId.image ? (
                      <Image
                        src={review.userId.image}
                        alt={review.userId.name}
                        width={40}
                        height={40}
                        className="rounded-full ring-2 ring-[var(--border)]"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center">
                        <span className="text-[var(--neutral-100)]">{review.userId.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[var(--neutral-100)]">{review.userId.name}</h4>
                        <div className="flex items-center mt-1">
                          {renderStarRating(review.rating)}
                        </div>
                        <p className="text-sm text-[var(--neutral-500)] mt-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {(session?.user.id === review.userId._id || session?.user.role === 'admin') && (
                        <div className="flex space-x-2">
                          {session?.user.id === review.userId._id && (
                            <button
                              onClick={() => {
                                setUserRating(review.rating);
                                setUserComment(review.comment);
                                document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="text-sm text-[var(--primary-light)] hover:text-[var(--accent)] transition-colors flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                              Editar
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="text-sm text-red-500 hover:text-red-400 transition-colors flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-[var(--neutral-300)]">{review.comment}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[var(--neutral-800)] rounded-xl mb-8">
          <svg className="w-16 h-16 text-[var(--neutral-600)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
          <p className="text-[var(--neutral-400)] mb-2">No hay reseñas todavía. ¡Sé el primero en opinar!</p>
          <button 
            onClick={() => document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-medium inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Escribir una reseña
          </button>
        </div>
      )}

      {/* Formulario para añadir/editar reseña */}
      {session ? (
        <div id="review-form" className="border border-[var(--border)] rounded-xl p-6 bg-[var(--card)]">
          <h3 className="text-xl font-semibold text-[var(--neutral-100)] mb-6">
            {userReview ? 'Editar tu reseña' : 'Añadir una reseña'}
          </h3>
          
          <form onSubmit={handleSubmitReview} className="space-y-6">
            <div>
              <label className="block text-[var(--neutral-300)] mb-2">Tu puntuación</label>
              <div className="flex items-center">
                {renderStarRating(userRating, true)}
                {userRating > 0 && (
                  <span className="ml-3 text-[var(--neutral-400)] text-sm">
                    {userRating === 1 && 'Muy malo'}
                    {userRating === 2 && 'Malo'}
                    {userRating === 3 && 'Regular'}
                    {userRating === 4 && 'Bueno'}
                    {userRating === 5 && 'Excelente'}
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="comment" className="block text-[var(--neutral-300)] mb-2">Tu comentario</label>
              <textarea
                id="comment"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Escribe tu opinión sobre este curso..."
                className="w-full px-4 py-3 rounded-lg bg-[var(--neutral-800)] border border-[var(--border)] text-[var(--neutral-200)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                rows={4}
              ></textarea>
            </div>
            
            {errorMessage && (
              <div className="bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.3)] p-3 rounded-lg">
                <p className="text-red-500 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {errorMessage}
                </p>
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={isSubmitting || userRating === 0 || userComment.trim() === ''}
                className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                    {userReview ? 'Actualizar reseña' : 'Enviar reseña'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-center p-8 border border-[var(--border)] rounded-xl bg-[var(--card)]">
          <p className="text-[var(--neutral-300)] mb-4">Inicia sesión para dejar una reseña</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors"
          >
            Iniciar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection; 