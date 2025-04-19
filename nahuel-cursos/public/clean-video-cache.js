/**
 * Script para limpiar la caché de videos problemáticos
 * 
 * Este script puede ser cargado en cualquier momento para interrumpir
 * bucles de solicitudes de videos problemáticos
 */

(function() {
  // Verificar si ejecutamos en el navegador
  if (typeof window === 'undefined') return;
  
  console.log('🧹 Limpiando caché de videos...');
  
  // Limpiar cualquier solicitud pendiente de videos
  if (window.fetch && window.fetch._origFetch !== window.fetch) {
    try {
      window.fetch = window.fetch._origFetch || window.fetch;
      console.log('✅ Restaurada función fetch original');
    } catch (e) {
      console.error('Error al restaurar fetch:', e);
    }
  }
  
  // Almacenar IDs problemáticos conocidos
  const problematicIds = [
    '67fc1bcf6a2add8684b98814',
    '67fc1bcf6a2add0604b98814',
    'e4349070-10d5-4fbc-b7d9-d4e1e030c74',
    'e4349070-1bd5-4fbc-b7d9-d4e1e03b0c74'
  ];
  
  // Asegurarse de que estén en la lista de bloqueados
  try {
    const blockedIds = JSON.parse(localStorage.getItem('blockedVideoIds') || '[]');
    let updated = false;
    
    problematicIds.forEach(id => {
      if (!blockedIds.includes(id)) {
        blockedIds.push(id);
        updated = true;
      }
    });
    
    if (updated) {
      localStorage.setItem('blockedVideoIds', JSON.stringify(blockedIds));
      console.log('✅ Lista de videos bloqueados actualizada');
    } else {
      console.log('ℹ️ Lista de videos bloqueados ya está actualizada');
    }
  } catch (e) {
    console.error('Error al actualizar lista de bloqueados:', e);
    // Forzar la creación de la lista en caso de error
    localStorage.setItem('blockedVideoIds', JSON.stringify(problematicIds));
  }
  
  // Interceptar futuras solicitudes fetch para evitar bucles
  if (!window.fetch._origFetch) {
    const origFetch = window.fetch;
    window.fetch._origFetch = origFetch;
    
    window.fetch = function(url, options) {
      // Verificar si la URL contiene algún ID problemático
      const urlStr = url.toString();
      const blockedIds = JSON.parse(localStorage.getItem('blockedVideoIds') || '[]');
      
      if (blockedIds.some(id => urlStr.includes(id))) {
        console.warn('🚫 Bloqueada solicitud a recurso problemático:', urlStr);
        return Promise.reject(new Error('URL bloqueada: recurso problemático'));
      }
      
      return origFetch(url, options);
    };
    
    console.log('✅ Instalado interceptor de solicitudes');
  }
  
  console.log('✅ Limpieza de caché completada');
  
  // Refrescar la página después de 1 segundo si hay algún video problemático en la URL actual
  const currentUrl = window.location.href;
  if (problematicIds.some(id => currentUrl.includes(id))) {
    console.log('🔄 Detectado video problemático en la URL actual, refrescando en 1 segundo...');
    setTimeout(() => {
      window.location.href = window.location.href.split('?')[0]; // Eliminar parámetros
    }, 1000);
  }
})(); 