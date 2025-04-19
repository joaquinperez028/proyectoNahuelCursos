/**
 * SOLUCIÓN FINAL PARA BUCLE DE VIDEOS
 * Ejecuta este script en la consola para detener el bucle y reiniciar la aplicación
 */

(function() {
  console.clear();
  console.log('🔄 APLICANDO SOLUCIÓN FINAL...');
  
  // 1. Detener cualquier solicitud en curso
  window.stop();
  
  // 2. Limpiar la caché del navegador para esta página
  try {
    // Limpiar localStorage
    localStorage.removeItem('blockedVideoIds');
    localStorage.removeItem('videosProblematicos');
    console.log('✅ Cache de localStorage limpiada');
    
    // Limpiar sessionStorage
    sessionStorage.removeItem('videoErrorLogged');
    console.log('✅ Cache de sessionStorage limpiada');
    
    // Limpiar caché de fetch
    if ('caches' in window) {
      caches.keys().then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          return caches.delete(key);
        }));
      }).then(() => {
        console.log('✅ Cache de API limpiada');
      });
    }
  } catch (error) {
    console.error('❌ Error al limpiar cache:', error);
  }
  
  // 3. Mostrar mensaje al usuario
  console.log('🔄 Reiniciando aplicación...');
  console.log('Los archivos de video han sido corregidos. La página se recargará en 3 segundos...');
  
  // 4. Recargar la página con parámetros que fuerzan un refresco completo
  setTimeout(() => {
    window.location.href = window.location.pathname + '?t=' + Date.now();
  }, 3000);
})(); 