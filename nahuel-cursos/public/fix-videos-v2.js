/**
 * SOLUCIÓN MEJORADA PARA VIDEOS - v2
 * Este script corrige problemas con videos fragmentados sin romper los que ya funcionan
 */

(function() {
  console.clear();
  console.log('🎬 CORRECCIÓN ESPECÍFICA PARA VIDEOS - v2');
  
  // 1. Información de diagnóstico
  console.log('Analizando estado actual de reproducción de videos...');
  
  // Detectar videos en la página
  const videos = document.querySelectorAll('video');
  const iframes = document.querySelectorAll('iframe');
  console.log(`Videos en la página: ${videos.length}`);
  console.log(`Iframes en la página: ${iframes.length}`);
  
  // 2. Crear un registro para el análisis
  const videosInfo = {
    fragmentados: [],
    youtube: [],
    otros: []
  };
  
  // Analizar las URLs actuales de videos
  document.querySelectorAll('video source, video[src], iframe[src]').forEach(el => {
    const src = el.getAttribute('src') || '';
    if (!src) return;
    
    if (src.includes('youtube.com') || src.includes('youtu.be')) {
      videosInfo.youtube.push(src);
    } 
    else if (
      src.includes('fragmentado') || 
      src.includes('chunks') || 
      src.includes('e434907b') ||
      (src.includes('.mp4') && src.includes('-'))
    ) {
      videosInfo.fragmentados.push(src);
    }
    else {
      videosInfo.otros.push(src);
    }
  });
  
  console.log('Análisis de videos:', videosInfo);
  
  // 3. Función para corregir video fragmentado específico
  function corregirVideoFragmentado() {
    // Aquí tratamos específicamente con el video e434907b-18d5-4fbc-b7d9-d4e1e0300c74.mp4
    
    // A. Buscar y restaurar videos que fueron reemplazados por YouTube
    document.querySelectorAll('iframe[src*="youtube.com"]').forEach(iframe => {
      const parentContainer = iframe.closest('.video-container');
      if (!parentContainer) return;
      
      // Verificar si debería ser un video fragmentado
      const dataOriginalSrc = parentContainer.getAttribute('data-original-src');
      const textContent = parentContainer.textContent || '';
      
      if (
        dataOriginalSrc && dataOriginalSrc.includes('e434907b') ||
        textContent.includes('e434907b')
      ) {
        console.log('🔄 Restaurando video fragmentado que fue reemplazado por YouTube');
        
        // Crear un nuevo elemento video
        const newVideo = document.createElement('video');
        newVideo.controls = true;
        newVideo.style.width = '100%';
        newVideo.style.height = '100%';
        
        // Intentar múltiples URLs para el video fragmentado
        const urls = [
          '/uploads/videos/e434907b-18d5-4fbc-b7d9-d4e1e0300c74.mp4',
          '/api/videos/fragmentados/e434907b-18d5-4fbc-b7d9-d4e1e0300c74',
          '/api/videos/fragmentados/archivo/e434907b-18d5-4fbc-b7d9-d4e1e0300c74.mp4'
        ];
        
        // Intentar con diferentes URLs en caso de fallo
        newVideo.innerHTML = urls.map(url => 
          `<source src="${url}?t=${Date.now()}" type="video/mp4">`
        ).join('');
        
        // Mensaje de error
        newVideo.innerHTML += '<p>No se pudo cargar el video.</p>';
        
        // Reemplazar el iframe
        iframe.replaceWith(newVideo);
        
        // Guardar la referencia original
        parentContainer.setAttribute('data-fixed-video', 'true');
      }
    });
    
    // B. Parchar cualquier video fragmentado existente con múltiples fuentes
    document.querySelectorAll('video').forEach(video => {
      const src = video.getAttribute('src') || '';
      if (
        src.includes('e434907b') || 
        src.includes('fragmentado') ||
        (video.querySelector('source[src*="e434907b"]'))
      ) {
        console.log('🔧 Corrigiendo video fragmentado existente');
        
        // Limpiar fuentes actuales
        video.innerHTML = '';
        video.removeAttribute('src');
        
        // Añadir múltiples fuentes en diferentes formatos
        const urls = [
          '/uploads/videos/e434907b-18d5-4fbc-b7d9-d4e1e0300c74.mp4',
          '/api/videos/fragmentados/e434907b-18d5-4fbc-b7d9-d4e1e0300c74',
          '/api/videos/fragmentados/archivo/e434907b-18d5-4fbc-b7d9-d4e1e0300c74.mp4'
        ];
        
        // Añadir todas las fuentes con timestamp para evitar caché
        urls.forEach(url => {
          const source = document.createElement('source');
          source.src = `${url}?t=${Date.now()}`;
          source.type = 'video/mp4';
          video.appendChild(source);
        });
        
        // Forzar recarga del video
        video.load();
      }
    });
    
    return true;
  }
  
  // 4. Función para restaurar videos de Valorant o cualquier otro que haya sido reemplazado
  function restaurarVideosOriginales() {
    // Información de mapeo - videoID: URL original correcta
    const correctVideoMappings = {
      'valorant': 'https://www.youtube.com/embed/TFzkVmPurp4',
      '67fc1bcf6a2add8684b98814': 'https://www.youtube.com/embed/TFzkVmPurp4'
    };
    
    // Buscar contenedores de video que contengan texto relacionado con estos videos
    document.querySelectorAll('.curso-container, .video-container, article, section').forEach(container => {
      const text = container.textContent || '';
      
      // Revisar cada mapeo
      Object.entries(correctVideoMappings).forEach(([keyword, correctUrl]) => {
        if (text.includes(keyword)) {
          // Buscar cualquier iframe de YouTube que no sea el correcto
          container.querySelectorAll('iframe[src*="youtube.com"]').forEach(iframe => {
            const currentSrc = iframe.getAttribute('src');
            if (currentSrc && !currentSrc.includes(correctUrl.split('embed/')[1])) {
              console.log(`🔄 Restaurando video de ${keyword} a URL correcta`);
              iframe.setAttribute('src', correctUrl);
            }
          });
        }
      });
    });
    
    return true;
  }
  
  // 5. Función para monitorear dinámicamente los videos que se carguen
  function instalarMonitorDeVideos() {
    // Crear objeto para almacenar referencias originales
    window.__videoFixes = window.__videoFixes || {
      originalCreateElement: null,
      videoMappings: {
        // VideoID fragmentado: Múltiples URLs alternativas para intentar
        'e434907b-18d5-4fbc-b7d9-d4e1e0300c74': [
          '/uploads/videos/e434907b-18d5-4fbc-b7d9-d4e1e0300c74.mp4',
          '/api/videos/fragmentados/e434907b-18d5-4fbc-b7d9-d4e1e0300c74',
          '/api/videos/fragmentados/archivo/e434907b-18d5-4fbc-b7d9-d4e1e0300c74.mp4'
        ],
        // URLs de YouTube correctas para IDs específicos
        '67fc1bcf6a2add8684b98814': 'https://www.youtube.com/embed/TFzkVmPurp4',
        'TFzkVmPurp4': 'https://www.youtube.com/embed/TFzkVmPurp4'
      }
    };
    
    // Observar cambios en el DOM para detectar nuevos videos
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            // Verificar si es un elemento DOM
            if (node.nodeType === 1) {
              // Buscar videos o iframes añadidos
              if (node.tagName === 'VIDEO' || node.tagName === 'IFRAME') {
                console.log('🔍 Detectado nuevo elemento de video:', node);
                
                // Verificar si necesita corrección
                const src = node.getAttribute('src') || '';
                
                // Aplicar correcciones específicas basadas en el src
                if (src.includes('dQw4w9WgXcQ')) { // Este es el video de Rick Roll que usamos como fallback
                  // Intentar encontrar qué video debería ser
                  const parentText = node.parentElement?.textContent || '';
                  
                  if (parentText.includes('valorant') || parentText.includes('67fc1bcf6a2add8684b98814')) {
                    console.log('🔄 Reemplazando video de Rick Roll con el video correcto de Valorant');
                    node.setAttribute('src', 'https://www.youtube.com/embed/TFzkVmPurp4');
                  }
                  else if (parentText.includes('e434907b') || parentText.includes('fragmentado')) {
                    console.log('🔄 Reemplazando video de Rick Roll con el video fragmentado');
                    // Si es un iframe, reemplazarlo con un elemento video
                    if (node.tagName === 'IFRAME') {
                      const video = document.createElement('video');
                      video.controls = true;
                      video.style.width = '100%';
                      video.style.height = '100%';
                      
                      // Añadir múltiples fuentes
                      window.__videoFixes.videoMappings['e434907b-18d5-4fbc-b7d9-d4e1e0300c74'].forEach(url => {
                        const source = document.createElement('source');
                        source.src = `${url}?t=${Date.now()}`;
                        source.type = 'video/mp4';
                        video.appendChild(source);
                      });
                      
                      node.replaceWith(video);
                    }
                  }
                }
              }
            }
          });
        }
      });
    });
    
    // Configurar el observer para que monitoree todo el documento
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('✅ Monitor de videos dinámicos instalado');
    return observer;
  }
  
  // 6. Aplicar las correcciones
  const resultado = {
    videosFragmentados: corregirVideoFragmentado(),
    videosOriginales: restaurarVideosOriginales(),
    monitor: instalarMonitorDeVideos()
  };
  
  console.log('📊 RESULTADO:', resultado);
  console.log('');
  console.log('✅ Correcciones específicas para videos aplicadas');
  console.log('✅ La página debería mostrar correctamente ambos tipos de videos ahora');
  console.log('');
  console.log('ℹ️ Si los videos siguen sin funcionar, recarga la página e intenta navegar directamente a la URL del curso correspondiente');
  
  // 7. Proporcionar funciones para debug manual
  window.fixVideos = {
    fragmentado: corregirVideoFragmentado,
    originales: restaurarVideosOriginales,
    clearCache: function() {
      localStorage.removeItem('blockedVideoIds');
      localStorage.removeItem('videosProblematicos');
      sessionStorage.removeItem('videoErrorLogged');
      console.log('🧹 Caché de videos limpiada');
    },
    reload: function() {
      window.location.reload();
    }
  };
  
  console.log('');
  console.log('🛠️ Puedes usar estas funciones de debug si es necesario:');
  console.log('● window.fixVideos.fragmentado() - Intenta arreglar el video fragmentado');
  console.log('● window.fixVideos.originales() - Restaura videos originales como el de Valorant');
  console.log('● window.fixVideos.clearCache() - Limpia la caché de videos');
  console.log('● window.fixVideos.reload() - Recarga la página');
})(); 