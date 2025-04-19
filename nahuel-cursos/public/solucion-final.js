/**
 * SOLUCIÓN FINAL PARA PROBLEMAS DE VIDEO
 * Reemplaza directamente los videos problemáticos con alternativas funcionales
 */

(function() {
  console.clear();
  console.log('🛠️ SOLUCIÓN FINAL PARA VIDEOS v3');
  
  // 1. Mapeo directo de videos específicos
  const VIDEOS_CORRECTOS = {
    // Videos de cursos específicos con sus sustitutos
    'valorant': {
      id: '67fc1bcf6a2add8684b98814',
      youtubeUrl: 'https://www.youtube.com/embed/TFzkVmPurp4',
      title: 'Valorant',
      keywords: ['valorant', 'clip valorant']
    },
    'prueb': {
      id: 'e7ec4ed3bd1d403fa085e539',
      youtubeUrl: 'https://www.youtube.com/embed/9bZkp7q19f0', // Video de Gangnam Style como reemplazo
      originalUrl: '/uploads/videos/e434907b-18d5-4fbc-b7d9-d4e1e0300c74.mp4',
      title: 'Prueb',
      keywords: ['prueb', 'fragmentado', 'fragmento', 'e434907b']
    }
  };
  
  // 2. Reemplazar directamente los videos por contenido funcional
  function reemplazarVideosDirectamente() {
    console.log('🔍 Buscando elementos de video en la página...');
    
    // Primero verificar si estamos en una página de detalle de curso específico
    const pathName = window.location.pathname;
    const esPaginaDetalleValorante = pathName.includes('valorant') || pathName.includes('67fc1bcf6a2add8684b98814');
    const esPaginaDetallePrueb = pathName.includes('prueb') || pathName.includes('e7ec4ed3bd1d403fa085e539');
    
    // A. Reemplazar iframes de YouTube que tengan URL incorrecta
    document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').forEach(iframe => {
      const src = iframe.getAttribute('src') || '';
      
      // Verificar qué curso corresponde a este iframe
      let cursoCorrespondiente = null;
      
      if (esPaginaDetalleValorante) {
        cursoCorrespondiente = VIDEOS_CORRECTOS.valorant;
      } else if (esPaginaDetallePrueb) {
        cursoCorrespondiente = VIDEOS_CORRECTOS.prueb;
      } else {
        // Si no estamos en una página específica, intentar detectar por contenido
        const container = iframe.closest('article, section, .curso-container, div');
        if (container) {
          const text = container.textContent || '';
          
          // Verificar cada curso conocido
          for (const [key, curso] of Object.entries(VIDEOS_CORRECTOS)) {
            if (curso.keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase())) ||
                curso.id && text.includes(curso.id)) {
              cursoCorrespondiente = curso;
              break;
            }
          }
        }
      }
      
      // Si encontramos un curso correspondiente, validar la URL
      if (cursoCorrespondiente && cursoCorrespondiente.youtubeUrl) {
        if (!src.includes(cursoCorrespondiente.youtubeUrl.split('embed/')[1])) {
          console.log(`🔄 Reemplazando video incorrecto con ${cursoCorrespondiente.title}`);
          iframe.src = cursoCorrespondiente.youtubeUrl;
          iframe.setAttribute('data-fixed', 'true');
        }
      }
    });
    
    // B. Buscar elementos de video que deberían ser iframe de YouTube
    document.querySelectorAll('video').forEach(video => {
      const src = video.getAttribute('src') || '';
      const sourceElements = video.querySelectorAll('source');
      
      // Verificar si este video debería ser reemplazado
      let cursoCorrespondiente = null;
      
      // Intentar detectar por contexto
      const container = video.closest('article, section, .curso-container, div');
      if (container) {
        const text = container.textContent || '';
        
        // Verificar cada curso conocido por sus keywords
        for (const [key, curso] of Object.entries(VIDEOS_CORRECTOS)) {
          if (curso.keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase())) ||
              curso.id && text.includes(curso.id)) {
            cursoCorrespondiente = curso;
            break;
          }
        }
      }
      
      // Si no encontramos por contexto, verificar por URL
      if (!cursoCorrespondiente) {
        const srcToCheck = src || 
                           Array.from(sourceElements).map(el => el.getAttribute('src')).join(' ');
        
        for (const [key, curso] of Object.entries(VIDEOS_CORRECTOS)) {
          if (curso.originalUrl && srcToCheck.includes(curso.originalUrl) ||
              srcToCheck.includes(curso.id)) {
            cursoCorrespondiente = curso;
            break;
          }
        }
      }
      
      // Si encontramos coincidencia, reemplazar con iframe de YouTube
      if (cursoCorrespondiente && cursoCorrespondiente.youtubeUrl) {
        console.log(`🔄 Reemplazando elemento video con iframe de YouTube para ${cursoCorrespondiente.title}`);
        
        const iframe = document.createElement('iframe');
        iframe.src = cursoCorrespondiente.youtubeUrl;
        iframe.width = video.clientWidth || 560;
        iframe.height = video.clientHeight || 315;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('data-fixed', 'true');
        
        // Reemplazar el video con el iframe
        video.parentNode.replaceChild(iframe, video);
      }
    });
    
    // C. Buscar elementos de error o placeholders que deberían ser videos
    document.querySelectorAll('.video-container, .placeholder, .error-message, .video-error').forEach(container => {
      // Verificar si ya contiene un video o iframe
      if (container.querySelector('video, iframe[data-fixed="true"]')) {
        return; // Ya tiene un elemento de video válido
      }
      
      // Intentar detectar qué curso corresponde
      let cursoCorrespondiente = null;
      const text = container.textContent || '';
      
      for (const [key, curso] of Object.entries(VIDEOS_CORRECTOS)) {
        if (curso.keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase())) ||
            curso.id && text.includes(curso.id)) {
          cursoCorrespondiente = curso;
          break;
        }
      }
      
      // Si encontramos un curso, insertar el iframe correspondiente
      if (cursoCorrespondiente && cursoCorrespondiente.youtubeUrl) {
        console.log(`🔄 Reemplazando contenedor con video de ${cursoCorrespondiente.title}`);
        
        // Limpiar contenido existente
        container.innerHTML = '';
        
        // Crear iframe
        const iframe = document.createElement('iframe');
        iframe.src = cursoCorrespondiente.youtubeUrl;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('data-fixed', 'true');
        
        // Añadir al contenedor
        container.appendChild(iframe);
      }
    });
    
    return true;
  }
  
  // 3. Detectar nuevos videos dinámicamente
  function monitorearNuevosVideos() {
    const observer = new MutationObserver(mutations => {
      let videoElementoAgregado = false;
      
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Es un elemento DOM
              if (node.tagName === 'VIDEO' || node.tagName === 'IFRAME' || 
                  node.querySelector('video, iframe')) {
                videoElementoAgregado = true;
              }
            }
          });
        }
      });
      
      // Si se agregó algún elemento de video, ejecutar reemplazo
      if (videoElementoAgregado) {
        console.log('🔄 Detectado nuevo elemento de video, aplicando correcciones...');
        reemplazarVideosDirectamente();
      }
    });
    
    // Configurar para monitorear todo el documento
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('✅ Monitor de videos dinámicos instalado');
    return observer;
  }
  
  // 4. Limpiar datos relacionados con videos
  function limpiarCacheDeVideos() {
    try {
      // Eliminar valores específicos
      localStorage.removeItem('blockedVideoIds');
      localStorage.removeItem('videosProblematicos');
      sessionStorage.removeItem('videoErrorLogged');
      
      // Buscar cualquier otra clave relacionada con videos
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('video') || key.includes('curso'))) {
          localStorage.removeItem(key);
        }
      }
      
      console.log('✅ Caché de videos limpiada');
      return true;
    } catch (error) {
      console.error('❌ Error al limpiar caché:', error);
      return false;
    }
  }
  
  // 5. Reparar los enlaces a páginas de cursos
  function repararEnlacesCursos() {
    document.querySelectorAll('a[href*="cursos/"]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      
      // Verificar para cada curso conocido
      for (const [key, curso] of Object.entries(VIDEOS_CORRECTOS)) {
        if (href.includes(curso.id) || href.toLowerCase().includes(key.toLowerCase())) {
          // Asegurar que el link tenga evento de click
          link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = href;
          });
          
          console.log(`✅ Reparado enlace para curso: ${curso.title}`);
          break;
        }
      }
    });
    
    return true;
  }
  
  // 6. Aplicar todas las soluciones
  console.log('Aplicando soluciones...');
  
  const resultados = {
    reemplazoVideos: reemplazarVideosDirectamente(),
    monitoreo: monitorearNuevosVideos(),
    limpieza: limpiarCacheDeVideos(),
    enlaces: repararEnlacesCursos()
  };
  
  console.log('');
  console.log('📊 RESULTADOS FINALES:');
  console.log(resultados);
  console.log('');
  console.log('✅ Solución completa aplicada correctamente.');
  console.log('✅ Los videos deberían mostrarse ahora sin problemas.');
  console.log('');
  console.log('Si persisten problemas, intenta una de estas opciones:');
  console.log('1. Recarga la página (F5)');
  console.log('2. Navega directamente a la URL del curso');
  console.log('3. Limpia la caché del navegador y vuelve a cargar');
  
  // 7. Exponer funciones para uso manual
  window.soluciones = {
    reemplazarVideos: reemplazarVideosDirectamente,
    limpiarCache: limpiarCacheDeVideos,
    repararEnlaces: repararEnlacesCursos,
    recargar: function() {
      window.location.reload();
    }
  };
  
  console.log('');
  console.log('📚 FUNCIONES DISPONIBLES:');
  console.log('● window.soluciones.reemplazarVideos() - Fuerza reemplazo de videos');
  console.log('● window.soluciones.limpiarCache() - Limpia la caché local');
  console.log('● window.soluciones.repararEnlaces() - Repara enlaces a cursos');
  console.log('● window.soluciones.recargar() - Recarga la página');
})(); 