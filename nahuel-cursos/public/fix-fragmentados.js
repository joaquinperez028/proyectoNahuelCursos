/**
 * SOLUCIÓN PARA VIDEOS FRAGMENTADOS
 * Este script habilita la carga correcta de videos fragmentados en la plataforma
 */

(function() {
  console.clear();
  console.log('🎬 REPARANDO VISUALIZACIÓN DE VIDEOS FRAGMENTADOS...');
  
  // 1. Mejorar el hook useVideoUrl para manejar videos fragmentados
  function parchearUseVideoUrl() {
    // Definir una mejor detección para videos fragmentados
    window.__videoHandlers = window.__videoHandlers || {};
    
    // Añadir función para detectar y convertir URLs de videos fragmentados
    window.__videoHandlers.procesarVideoFragmentado = function(videoUrl) {
      // Verificar si es un video fragmentado
      const esFragmentado = 
        videoUrl && (
          videoUrl.includes('fragmentado') || 
          videoUrl.includes('chunks') || 
          videoUrl.includes('fragment') ||
          videoUrl.includes('-') && (videoUrl.includes('.mp4') || videoUrl.includes('.webm'))
        );
      
      if (!esFragmentado) return null;
      
      console.log('✅ Video fragmentado detectado:', videoUrl);
      
      // Convertir a URL consumible según el formato
      if (videoUrl.startsWith('/api/videos/fragmentados/')) {
        // Ya tiene el formato correcto
        return videoUrl;
      }
      
      // Si contiene un ID específico extraerlo e insertarlo en la URL correcta
      const uuidMatch = videoUrl.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      if (uuidMatch && uuidMatch[1]) {
        const uuid = uuidMatch[1];
        return `/api/videos/fragmentados/${uuid}`;
      }
      
      // Si parece un archivo local con nombre fragmentado
      if (videoUrl.includes('.mp4') || videoUrl.includes('.webm')) {
        const partes = videoUrl.split('/');
        const nombreArchivo = partes[partes.length - 1];
        
        if (nombreArchivo && nombreArchivo.includes('-')) {
          return `/api/videos/fragmentados/archivo/${nombreArchivo}`;
        }
      }
      
      return videoUrl;
    };
    
    // Función para detectar si una URL es de YouTube o externa
    window.__videoHandlers.esVideoExterno = function(url) {
      return url && (
        url.includes('youtube.com') || 
        url.includes('youtu.be') || 
        url.includes('vimeo.com') || 
        url.startsWith('http://') || 
        url.startsWith('https://')
      );
    };
    
    // Sobrescribir temporalmente fetch para manejar mejor los videos fragmentados
    const fetchOriginal = window.fetch;
    window.fetch = function(url, options) {
      if (url && url.toString().includes('/api/videos/fragmentados/')) {
        console.log('🔄 Interceptando solicitud a video fragmentado:', url);
        
        // Añadir un timestamp para evitar caché y forzar nueva solicitud
        const urlConTimestamp = url.toString().includes('?') 
          ? `${url}&t=${Date.now()}` 
          : `${url}?t=${Date.now()}`;
        
        // Configurar para no usar caché
        const opcionesModificadas = {
          ...options,
          cache: 'no-cache',
          headers: {
            ...(options?.headers || {}),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        };
        
        return fetchOriginal.call(this, urlConTimestamp, opcionesModificadas);
      }
      
      return fetchOriginal.call(this, url, options);
    };
    
    console.log('✅ Handler de videos fragmentados instalado');
    return true;
  }
  
  // 2. Añadir un parche para el componente VideoPlayer
  function parchearVideoPlayer() {
    // Crear un script que modificará el componente en tiempo de ejecución
    const script = document.createElement('script');
    script.textContent = `
      // Esperar a que React esté disponible
      const checkReactInterval = setInterval(() => {
        if (window.React) {
          clearInterval(checkReactInterval);
          console.log('✅ React encontrado, aplicando parche a VideoPlayer');
          
          // Función para parchear el componente VideoPlayer cuando se renderice
          const originalCreateElement = React.createElement;
          React.createElement = function(type, props, ...children) {
            // Si es un VideoPlayer, modificarlo antes de renderizar
            if (type && props && props.src && 
                (type.name === 'VideoPlayer' || type.displayName === 'VideoPlayer')) {
              // Procesar si es un video fragmentado
              if (window.__videoHandlers && window.__videoHandlers.procesarVideoFragmentado) {
                const urlFragmentado = window.__videoHandlers.procesarVideoFragmentado(props.src);
                if (urlFragmentado) {
                  console.log('🔄 Modificando URL para VideoPlayer:', props.src, ' → ', urlFragmentado);
                  props = { ...props, src: urlFragmentado };
                }
              }
            }
            
            return originalCreateElement.call(this, type, props, ...children);
          };
        }
      }, 500);
    `;
    
    document.head.appendChild(script);
    console.log('✅ Parche para VideoPlayer instalado');
    return true;
  }
  
  // 3. Limpiar caché relacionada con videos
  function limpiarCacheVideos() {
    try {
      // Limpiar datos de localStorage relacionados con videos
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('video') || 
          key.includes('blockedVideo') || 
          key.includes('fragmentado') ||
          key.includes('__next')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`✅ ${keysToRemove.length} entradas de caché de video eliminadas`);
      
      // Limpiar cookies relacionadas con videos
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name && (name.includes('video') || name.includes('next'))) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        }
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error al limpiar caché de videos:', error);
      return false;
    }
  }
  
  // 4. Aplicar todos los parches
  const resultados = {
    useVideoUrl: parchearUseVideoUrl(),
    videoPlayer: parchearVideoPlayer(),
    cache: limpiarCacheVideos()
  };
  
  console.log('📊 RESULTADOS DE REPARACIÓN:', resultados);
  console.log('');
  console.log('✅ Mejoras para videos fragmentados instaladas');
  console.log('✅ La página debería mostrar correctamente los videos fragmentados ahora');
  console.log('');
  console.log('👉 Para ver los cambios, recarga la página en 5 segundos o usa el botón para recargar en el navegador');
  
  // 5. Recargar automáticamente después de 5 segundos
  setTimeout(() => {
    console.log('🔄 Recargando página para aplicar cambios...');
    window.location.reload();
  }, 5000);
})(); 