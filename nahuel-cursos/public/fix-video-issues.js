/**
 * SCRIPT DE EMERGENCIA - DETENER BUCLES DE VIDEO
 * 
 * Este script detiene inmediatamente cualquier bucle de solicitud
 * relacionado con videos problemáticos y repara la navegación.
 */

(function() {
  console.clear();
  console.log('🚨 INICIANDO REPARACIÓN DE EMERGENCIA 🚨');
  
  // 1. Identificar IDs problemáticos
  const problematicIds = [
    '67fc1bcf6a2add8684b98814',
    '67fc1bcf6a2add0604b98814',
    'e4349070-10d5-4fbc-b7d9-d4e1e030c74',
    'e4349070-1bd5-4fbc-b7d9-d4e1e03b0c74'
  ];
  
  // 2. Cancelar todas las solicitudes pendientes
  if (window.AbortController && window.fetch) {
    console.log('Abortando todas las solicitudes pendientes...');
    const controller = new AbortController();
    controller.abort();
    
    // Restaurar función fetch original si fue modificada
    if (window.fetch._origFetch) {
      window.fetch = window.fetch._origFetch;
    }
  }
  
  // 3. Forzar bloqueo completo de cualquier solicitud a videos problemáticos
  window.fetch = function(url, options) {
    const urlStr = url.toString();
    
    // Bloquear completamente cualquier solicitud a videos problemáticos
    if (problematicIds.some(id => urlStr.includes(id))) {
      console.warn('🛑 Bloqueada solicitud a video problemático:', urlStr);
      return Promise.reject(new Error('Solicitud bloqueada por script de emergencia'));
    }
    
    // Continuar normalmente con otras solicitudes
    return window.fetch._origFetch ? 
      window.fetch._origFetch(url, options) : 
      Object.getPrototypeOf(window.fetch).call(this, url, options);
  };
  
  // 4. Guardar IDs problemáticos en localStorage
  try {
    localStorage.setItem('blockedVideoIds', JSON.stringify(problematicIds));
    console.log('✅ IDs problemáticos guardados en localStorage');
  } catch (e) {
    console.error('Error al guardar IDs en localStorage:', e);
  }
  
  // 5. Eliminar cualquier elemento de video problemático de la página
  const removeProblematicVideos = () => {
    // Buscar y eliminar elementos de video problemáticos
    const allElements = document.querySelectorAll('video, iframe');
    let count = 0;
    
    allElements.forEach(el => {
      const src = el.src || '';
      if (problematicIds.some(id => src.includes(id))) {
        // Reemplazar con un mensaje de error
        const container = document.createElement('div');
        container.style.cssText = 'background: black; color: white; text-align: center; padding: 20px; border-radius: 8px;';
        container.innerHTML = '<p>Video no disponible</p>';
        
        if (el.parentNode) {
          el.parentNode.replaceChild(container, el);
          count++;
        }
      }
    });
    
    console.log(`✅ Eliminados ${count} videos problemáticos de la página`);
  };
  
  // Ejecutar inmediatamente y cada 100ms por si se añaden nuevos elementos
  removeProblematicVideos();
  const interval = setInterval(removeProblematicVideos, 100);
  
  // Detener el intervalo después de 5 segundos
  setTimeout(() => {
    clearInterval(interval);
    console.log('✅ Monitoreo de videos problemáticos finalizado');
  }, 5000);
  
  // 6. Reparar hipervínculos
  const fixHyperlinks = () => {
    const links = document.querySelectorAll('a');
    let count = 0;
    
    links.forEach(link => {
      // Si el enlace no tiene href o onclick, intentar repararlo
      if (!link.href || link.href === window.location.href + '#' || link.href === 'javascript:void(0)') {
        // Extraer la URL del atributo data-href o del texto interno si existe
        let possibleUrl = link.getAttribute('data-href') || '';
        
        // Si el enlace contiene texto que parece una URL, usarla
        if (!possibleUrl && link.textContent && (
            link.textContent.startsWith('/') || 
            link.textContent.includes('http') || 
            link.textContent.includes('cursos')
          )) {
          possibleUrl = link.textContent.trim();
        }
        
        // Si el enlace tiene un ID que indica su destino
        if (!possibleUrl && link.id && link.id.startsWith('link-')) {
          possibleUrl = '/' + link.id.replace('link-', '');
        }
        
        // Si encontramos una URL posible, aplicarla
        if (possibleUrl) {
          link.href = possibleUrl.startsWith('http') ? possibleUrl : '/' + possibleUrl.replace(/^\/+/, '');
          link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = this.href;
          });
          count++;
        }
      }
    });
    
    console.log(`✅ Reparados ${count} hipervínculos`);
  };
  
  // Ejecutar después de que la página termine de cargar
  if (document.readyState === 'complete') {
    fixHyperlinks();
  } else {
    window.addEventListener('load', fixHyperlinks);
  }
  
  // 7. Proveer funciones útiles para el usuario
  window.clearVideoCache = function() {
    localStorage.removeItem('blockedVideoIds');
    sessionStorage.clear();
    console.log('🧹 Caché de videos limpiada');
    return 'Caché limpiada. Recarga la página para aplicar los cambios.';
  };
  
  window.fixBrokenLinks = function() {
    fixHyperlinks();
    return 'Intento de reparación de enlaces completado.';
  };
  
  // Mensaje final
  console.log('✅ Reparación de emergencia completada');
  console.log('');
  console.log('Funciones disponibles:');
  console.log('- clearVideoCache() - Limpia la caché de videos bloqueados');
  console.log('- fixBrokenLinks() - Intenta reparar enlaces rotos en la página actual');
})(); 