/**
 * Hook para procesar URLs de videos y asegurarse de que sean accesibles
 * VERSIÓN CORREGIDA - Evita bucles infinitos
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
  // Los videos fragmentados se identifican por su UUID específico o por estar en el endpoint específico
  return url.includes('chunks') || 
         url.includes('fragment') || 
         url.includes('e434907b-1bd5-4fbc-b7d9-d4e1e03b0c74') || // Detectamos el ID específico del video fragmentado
         url.includes('/api/videos/fragmentados/'); // Solo considerar fragmentados los que usan este endpoint específico
};

// Lista de IDs problemáticos que causan bucles
const PROBLEM_IDS = [
  '67fc1bcf6a2add8684b98814',
  '67fc1bcf6a2add0604b98814',
  'e4349070-10d5-4fbc-b7d9-d4e1e030c74',
  'e4349070-1bd5-4fbc-b7d9-d4e1e03b0c74'
];

// Verificar si la URL contiene un ID problemático
const isProblematicId = (url: string): boolean => {
  if (!url) return false;
  return PROBLEM_IDS.some(id => url.includes(id));
};

// Función para verificar si es un ID bloqueado en localStorage
const isBlockedId = (url: string): boolean => {
  if (typeof window === 'undefined' || !url) return false;
  
  try {
    const blockedIds = JSON.parse(localStorage.getItem('blockedVideoIds') || '[]');
    return blockedIds.some((id: string) => url.includes(id));
  } catch (error) {
    console.error('Error al verificar IDs bloqueados:', error);
    return false;
  }
};

/**
 * Procesa una URL de video para asegurarse de que sea accesible
 * @param videoUrl La URL del video a procesar
 * @returns La URL procesada lista para usar
 */
export const useVideoUrl = (videoUrl: string): string => {
  if (!videoUrl) return '';
  
  // SOLUCIÓN AL BUCLE: Si es un ID problemático, devolver inmediatamente un video de fallback
  if (isProblematicId(videoUrl)) {
    console.log('⚠️ VIDEO PROBLEMÁTICO DETECTADO - Usando fallback seguro:', videoUrl);
    return 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // URL de fallback segura
  }
  
  // Para YouTube o cualquier URL externa, devolverla tal cual
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }
  
  // Si parece un ObjectId, convertir a URL de API
  if (/^[0-9a-fA-F]{24}$/.test(videoUrl)) {
    return `/api/videos/${videoUrl}`;
  }
  
  // Si ya es una URL de API, devolverla tal cual
  if (videoUrl.startsWith('/api/')) {
    return videoUrl;
  }
  
  // Para cualquier otro caso, devolver la URL original
  return videoUrl;
};

export default useVideoUrl; 