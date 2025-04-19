/**
 * Hook para procesar URLs de videos y asegurarse de que sean accesibles
 */

// Función para verificar si una cadena parece ser un ObjectId de MongoDB
const isObjectIdLike = (str: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(str);
};

// Función para verificar si es una URL de YouTube
const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Función para verificar si es una URL de Vimeo
const isVimeoUrl = (url: string): boolean => {
  return url.includes('vimeo.com');
};

/**
 * Procesa una URL de video para asegurarse de que sea accesible
 * @param videoUrl La URL del video a procesar
 * @returns La URL procesada lista para usar
 */
export const useVideoUrl = (videoUrl: string): string => {
  if (!videoUrl) return '';
  
  console.log('useVideoUrl - Processing URL:', videoUrl);

  // Si parece un ObjectId de MongoDB, convertirlo a una URL de API
  if (isObjectIdLike(videoUrl)) {
    console.log('useVideoUrl - Es un ObjectId, convirtiendo a URL de API');
    return `/api/videos/${videoUrl}`;
  }

  // Si ya es una URL de API de videos, devolverla tal cual
  if (videoUrl.startsWith('/api/videos/')) {
    console.log('useVideoUrl - Ya es una URL de API');
    return videoUrl;
  }

  // Para YouTube embebido, asegurarse de que el embed tenga los parámetros correctos
  if (isYouTubeUrl(videoUrl)) {
    console.log('useVideoUrl - Es URL de YouTube');
    // Si es un link directo de youtube.com, convertirlo a formato embebido
    if (videoUrl.includes('watch?v=')) {
      const videoId = new URL(videoUrl).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Si ya es un embed, dejarlo como está
    return videoUrl;
  }

  // Para Vimeo embebido
  if (isVimeoUrl(videoUrl)) {
    console.log('useVideoUrl - Es URL de Vimeo');
    // Si es un formato directo de vimeo
    if (videoUrl.includes('vimeo.com/') && !videoUrl.includes('player.vimeo.com/')) {
      const vimeoId = videoUrl.split('vimeo.com/')[1].split('?')[0];
      return `https://player.vimeo.com/video/${vimeoId}`;
    }
    // Si ya es un embed, dejarlo como está
    return videoUrl;
  }

  // Si es una URL de un archivo local en /uploads/, asegurarse de que comience correctamente
  if (videoUrl.includes('/uploads/') || videoUrl.includes('uploads/')) {
    console.log('useVideoUrl - Es archivo local');
    // Normalizar la URL para que siempre comience con /
    const normalizedPath = videoUrl.startsWith('/') ? videoUrl : `/${videoUrl}`;
    return normalizedPath;
  }

  // Si es una URL externa (http/https) que no es YouTube ni Vimeo, devolverla tal cual
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    console.log('useVideoUrl - Es URL externa genérica');
    return videoUrl;
  }

  // Para cualquier otro caso, intentar interpretar como ID de MongoDB si parece serlo
  if (/^[a-f0-9]+$/i.test(videoUrl) && videoUrl.length > 10) {
    console.log('useVideoUrl - Parece un ID, intentando como API');
    return `/api/videos/${videoUrl}`;
  }

  // Si nada coincide, devolverlo tal cual
  console.log('useVideoUrl - No coincide con ningún patrón conocido');
  return videoUrl;
};

export default useVideoUrl; 