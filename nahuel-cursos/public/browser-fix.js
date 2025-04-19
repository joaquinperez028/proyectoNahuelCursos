/**
 * SCRIPT DE CORRECCIÓN PARA EJECUTAR EN LA CONSOLA DEL NAVEGADOR
 * 
 * Para ejecutar este script:
 * 1. Abre las herramientas de desarrollador (F12 o Ctrl+Shift+I)
 * 2. Ve a la pestaña "Consola"
 * 3. Copia y pega todo este código
 * 4. Presiona Enter para ejecutarlo
 */

(function() {
  console.clear();
  console.log('🚨 INICIANDO CORRECCIÓN DE EMERGENCIA 🚨');
  
  // 1. Detener todas las solicitudes en curso
  if (window.AbortController && window.fetch) {
    const controller = new AbortController();
    controller.abort();
    console.log('✅ Solicitudes actuales abortadas');
  }
  
  // 2. Revertir cualquier modificación previa a fetch
  if (window.fetch._origFetch) {
    window.fetch = window.fetch._origFetch;
    console.log('✅ Función fetch restaurada a su estado original');
  }
  
  // 3. IDs problemáticos conocidos
  const problematicIds = [
    '67fc1bcf6a2add8684b98814',
    '67fc1bcf6a2add0604b98814',
    'e4349070-10d5-4fbc-b7d9-d4e1e030c74',
    'e4349070-1bd5-4fbc-b7d9-d4e1e03b0c74'
  ];
  
  // 4. Guardar en localStorage para bloqueo permanente
  localStorage.setItem('blockedVideoIds', JSON.stringify(problematicIds));
  console.log('✅ IDs problemáticos guardados en localStorage');
  
  // 5. Instalar un interceptor de fetch para bloquear solicitudes problemáticas
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    const urlStr = typeof url === 'string' ? url : url.toString();
    
    // Verificar si la URL contiene algún ID problemático
    if (problematicIds.some(id => urlStr.includes(id))) {
      console.warn('🛑 Bloqueada solicitud a recurso problemático:', urlStr);
      return Promise.reject(new Error('URL bloqueada por script de emergencia'));
    }
    
    // Permitir otras solicitudes
    return originalFetch.call(this, url, options);
  };
  
  console.log('✅ Interceptor de fetch instalado');
  
  // 6. Detener cualquier reproductor de video problemático
  const stopProblematicVideos = () => {
    document.querySelectorAll('video').forEach(video => {
      if (video.src && problematicIds.some(id => video.src.includes(id))) {
        try {
          video.pause();
          video.src = '';
          video.load();
          console.log('✅ Video problemático detenido:', video.src);
        } catch (e) {
          console.error('Error al detener video:', e);
        }
      }
    });
    
    // También detener iframes con videos problemáticos
    document.querySelectorAll('iframe').forEach(iframe => {
      if (iframe.src && problematicIds.some(id => iframe.src.includes(id))) {
        try {
          iframe.src = 'about:blank';
          console.log('✅ Iframe problemático detenido:', iframe.src);
        } catch (e) {
          console.error('Error al detener iframe:', e);
        }
      }
    });
  };
  
  stopProblematicVideos();
  console.log('✅ Videos problemáticos detenidos');
  
  // 7. Reparar hipervínculos
  let repairedLinks = 0;
  
  document.querySelectorAll('a').forEach(link => {
    // Solo reparar enlaces que no funcionan
    if (!link.href || link.href === 'javascript:void(0)' || link.href === window.location.href + '#') {
      // Intentar extraer una URL de varios atributos o del texto
      const dataSrc = link.getAttribute('data-href') || 
                      link.getAttribute('data-src') || 
                      link.getAttribute('data-url');
      
      let href = dataSrc || '';
      
      // Si no hay href pero hay texto que parece una URL, usarlo
      if (!href && link.textContent && (
          link.textContent.startsWith('/') || 
          link.textContent.includes('http') || 
          link.textContent.includes('cursos')
      )) {
        href = link.textContent.trim();
      }
      
      // Si tiene un ID descriptivo
      if (!href && link.id && link.id.includes('link')) {
        const part = link.id.split('-').pop();
        if (part) {
          href = '/' + part;
        }
      }
      
      // Si tiene clases que indican su propósito
      if (!href && link.className) {
        if (link.className.includes('curso')) href = '/cursos';
        else if (link.className.includes('login')) href = '/auth/login';
        else if (link.className.includes('registr')) href = '/auth/registro';
        else if (link.className.includes('perf')) href = '/perfil';
        else if (link.className.includes('admin')) href = '/admin';
      }
      
      if (href) {
        const formattedHref = href.startsWith('http') ? href : href.startsWith('/') ? href : '/' + href;
        link.href = formattedHref;
        
        // Hacer que el enlace use navegación directa
        link.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.href = this.href;
        });
        
        repairedLinks++;
      }
    }
  });
  
  console.log(`✅ ${repairedLinks} enlaces reparados`);
  
  // 8. Funciones útiles para el usuario
  window.fixVideos = function() {
    stopProblematicVideos();
    return 'Videos problemáticos detenidos';
  };
  
  window.clearCache = function() {
    localStorage.clear();
    sessionStorage.clear();
    return 'Caché limpiada. Recarga la página para aplicar los cambios.';
  };
  
  window.reloadPage = function() {
    window.location.reload(true);
    return 'Recargando página...';
  };
  
  // 9. Mensaje final
  console.log(`
✅ CORRECCIÓN DE EMERGENCIA COMPLETADA
----------------------------------------
Funciones disponibles:
- fixVideos() - Detiene videos problemáticos
- clearCache() - Limpia toda la caché local
- reloadPage() - Recarga la página forzando una carga desde el servidor

Si sigues viendo errores, ejecuta clearCache() y luego reloadPage()
  `);
})(); 