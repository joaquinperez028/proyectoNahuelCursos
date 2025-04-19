/**
 * Hook para procesar URLs de videos y asegurarse de que sean accesibles
 * VERSIÓN MEJORADA - Con soporte para videos fragmentados y protección anti-bucles
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

// Verificar si es un video fragmentado
const isFragmentedVideo = (url: string): boolean => {
  if (!url) return false;
  
  return url.includes('fragmentado') || 
         url.includes('chunks') || 
         url.includes('fragment') ||
         (url.includes('-') && (url.includes('.mp4') || url.includes('.webm')));
};

// Procesar URL para video fragmentado
const processFragmentedVideoUrl = (url: string): string => {
  // Si ya tiene el formato correcto
  if (url.startsWith('/api/videos/fragmentados/')) {
    return url;
  }
  
  // Si contiene un UUID, extraerlo
  const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch && uuidMatch[1]) {
    return `/api/videos/fragmentados/${uuidMatch[1]}`;
  }
  
  // Si es un archivo con nombre específico
  if (url.includes('.mp4') || url.includes('.webm')) {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    
    if (fileName && fileName.includes('-')) {
      return `/api/videos/fragmentados/archivo/${fileName}`;
    }
  }
  
  // Formato desconocido, devolver tal cual
  return url;
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
  
  // 1. SEGURIDAD: Si es un ID problemático, devolver inmediatamente video seguro
  if (isProblematicId(videoUrl)) {
    console.log('⚠️ VIDEO PROBLEMÁTICO DETECTADO - Usando fallback seguro:', videoUrl);
    return 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // URL de fallback segura
  }
  
  // 2. VIDEOS FRAGMENTADOS: Procesamiento especial
  if (isFragmentedVideo(videoUrl)) {
    console.log('🎬 Video fragmentado detectado:', videoUrl);
    return processFragmentedVideoUrl(videoUrl);
  }
  
  // 3. URLs EXTERNAS: Para YouTube, Vimeo o cualquier URL externa, devolverla tal cual
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }
  
  // 4. MONGODB IDs: Si parece un ObjectId, convertir a URL de API
  if (/^[0-9a-fA-F]{24}$/.test(videoUrl)) {
    return `/api/videos/${videoUrl}`;
  }
  
  // 5. API URLs: Si ya es una URL de API, devolverla tal cual
  if (videoUrl.startsWith('/api/')) {
    return videoUrl;
  }
  
  // 6. DEFAULT: Para cualquier otro caso, devolver la URL original
  return videoUrl;
};

export default useVideoUrl; 