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

// Función para verificar si parece ser un archivo local
const isLocalFileUrl = (url: string): boolean => {
  return url.includes('/uploads/') || 
         url.includes('uploads/') || 
         url.includes('.mp4') || 
         url.includes('.webm') || 
         url.includes('.mov') || 
         url.includes('.ogg');
};

// Función para verificar si el video podría ser fragmentado
const isPossiblyFragmented = (url: string): boolean => {
  // Los videos fragmentados suelen estar en GridFS y son accesibles por una API
  return url.includes('chunks') || 
         url.includes('fragment') || 
         url.includes('e434907b-1bd5-4fbc-b7d9-d4e1e03b0c74') || // Detectamos el ID específico del video fragmentado
         url.includes('/api/videos/'); // O podría ser servido a través de la API
};

/**
 * Procesa una URL de video para asegurarse de que sea accesible
 * @param videoUrl La URL del video a procesar
 * @returns La URL procesada lista para usar
 */
export const useVideoUrl = (videoUrl: string): string => {
  if (!videoUrl) return '';
  
  console.log('useVideoUrl - URL original:', videoUrl);

  // Si detectamos que es un video fragmentado, asegurarnos de que use el endpoint especializado
  if (isPossiblyFragmented(videoUrl)) {
    console.log('useVideoUrl - Video posiblemente fragmentado detectado');
    
    // Si ya parece una URL de API de videos pero tiene un formato incorrecto, corregirlo
    if (videoUrl.includes('e434907b-1bd5-4fbc-b7d9-d4e1e03b0c74')) {
      console.log('useVideoUrl - Usando endpoint especializado para video fragmentado');
      // Usar el endpoint especializado para videos fragmentados
      return `/api/videos/fragmentados/e434907b-1bd5-4fbc-b7d9-d4e1e03b0c74`;
    }
    
    // Si contiene un ID completo en el formato UUID, asegurarnos de usar la API especializada
    const uuidMatch = videoUrl.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (uuidMatch && uuidMatch[1]) {
      console.log('useVideoUrl - UUID detectado en URL:', uuidMatch[1]);
      return `/api/videos/fragmentados/${uuidMatch[1]}`;
    }
  }

  // Caso especial: Si la URL contiene parte de un archivo de video local
  if (isLocalFileUrl(videoUrl)) {
    console.log('useVideoUrl - Parece un archivo local de video');
    
    // Si contiene un UUID y extensión .mp4, asegurarse de que la ruta sea correcta
    if (videoUrl.includes('-') && (videoUrl.includes('.mp4') || videoUrl.includes('.webm'))) {
      // Extraer solo el nombre del archivo si es una ruta completa
      const nombreArchivo = videoUrl.split('/').pop();
      
      if (nombreArchivo) {
        console.log('useVideoUrl - Usando solo el nombre del archivo:', nombreArchivo);
        // Si el nombre del archivo es de un UUID específico para un video fragmentado
        if (nombreArchivo.includes('e434907b-1bd5-4fbc-b7d9-d4e1e03b0c74')) {
          return `/api/videos/fragmentados/e434907b-1bd5-4fbc-b7d9-d4e1e03b0c74`;
        }
        // Construir una ruta correcta para acceder desde la carpeta pública
        return `/uploads/videos/${nombreArchivo}`;
      }
    }
    
    // Si la URL ya tiene el formato correcto, asegurarse de que comience con /
    if (!videoUrl.startsWith('/')) {
      return `/${videoUrl}`;
    }
    
    return videoUrl;
  }

  // Si parece un ObjectId de MongoDB, convertirlo a una URL de API
  if (isObjectIdLike(videoUrl)) {
    console.log('useVideoUrl - Es un ObjectId, convirtiendo a URL de API');
    return `/api/videos/${videoUrl}`;
  }

  // Si ya es una URL de API de videos, devolverla tal cual
  if (videoUrl.startsWith('/api/videos/')) {
    console.log('useVideoUrl - Ya es una URL de API');
    // Si parece ser un video fragmentado, redirigir al endpoint especializado
    if (videoUrl.includes('e434907b-1bd5-4fbc-b7d9-d4e1e03b0c74')) {
      return videoUrl.replace('/api/videos/', '/api/videos/fragmentados/');
    }
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

  // URL externa genérica (http/https) que no es YouTube ni Vimeo
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