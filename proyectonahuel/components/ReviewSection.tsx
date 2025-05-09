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
  const [userComment, setUserComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Verificar si el usuario ya ha hecho una reseña
  const userReview = session?.user ? reviews.find(review => review.userId._id === session.user.id) : null;

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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <span 
        key={index} 
        className={`text-xl ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div>
      {/* Reseñas existentes */}
      {reviews.length > 0 ? (
        <div className="space-y-6 mb-10">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {review.userId.image ? (
                    <Image
                      src={review.userId.image}
                      alt={review.userId.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500">{review.userId.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{review.userId.name}</h4>
                      <div className="flex items-center mt-1">
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
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
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-gray-700">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg mb-10">
          <p className="text-gray-500">No hay reseñas todavía. ¡Sé el primero en opinar!</p>
        </div>
      )}
      
      {/* Formulario para añadir/editar reseña */}
      {session ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-medium text-gray-900 mb-4">
            {userReview ? 'Editar tu reseña' : 'Añadir una reseña'}
          </h3>
          
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Puntuación</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className={`text-2xl ${star <= userRating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comentario
              </label>
              <textarea
                id="comment"
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Comparte tu experiencia con este curso..."
              />
            </div>
            
            {errorMessage && (
              <div className="mb-4 text-red-600 text-sm">
                {errorMessage}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {isSubmitting 
                ? 'Enviando...' 
                : userReview 
                  ? 'Actualizar reseña' 
                  : 'Publicar reseña'
              }
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-600 mb-4">Inicia sesión para dejar una reseña</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Iniciar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection; 