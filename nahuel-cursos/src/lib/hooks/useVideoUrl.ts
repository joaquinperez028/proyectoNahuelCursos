/**
 * Hook para procesar URLs de videos y asegurarse de que sean accesibles
 */

// Función para verificar si una cadena parece ser un ObjectId de MongoDB
const isObjectIdLike = (str: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(str);
};

/**
 * Procesa una URL de video para asegurarse de que sea accesible
 * @param videoUrl La URL del video a procesar
 * @returns La URL procesada lista para usar
 */
export const useVideoUrl = (videoUrl: string): string => {
  if (!videoUrl) return '';

  // Si parece un ObjectId de MongoDB, convertirlo a una URL de API
  if (isObjectIdLike(videoUrl)) {
    return `/api/videos/${videoUrl}`;
  }

  // Si ya es una URL de API de videos, devolverla tal cual
  if (videoUrl.startsWith('/api/videos/')) {
    return videoUrl;
  }

  // Si es una URL de un archivo local en /uploads/, asegurarse de que comience correctamente
  if (videoUrl.includes('/uploads/') || videoUrl.includes('uploads/')) {
    // Normalizar la URL para que siempre comience con /
    const normalizedPath = videoUrl.startsWith('/') ? videoUrl : `/${videoUrl}`;
    return normalizedPath;
  }

  // Si es una URL externa (YouTube, Vimeo, etc.), devolverla tal cual
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }

  // Para cualquier otro caso, devolver la URL tal cual
  return videoUrl;
};

export default useVideoUrl; 