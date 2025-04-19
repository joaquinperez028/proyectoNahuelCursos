/**
 * Script para diagnosticar y arreglar problemas con videos
 * 
 * Ejecutar este script en la consola del navegador para:
 * 1. Ver qué videos están bloqueados actualmente
 * 2. Limpiar la caché de videos si es necesario
 * 3. Forzar una recarga limpia de la página
 */

(function() {
  console.clear();
  console.log('🔍 DIAGNÓSTICO DE VIDEOS');
  console.log('=======================');
  
  // Verificar la lista de IDs bloqueados
  const blockedIds = JSON.parse(localStorage.getItem('blockedVideoIds') || '[]');
  console.log('Videos bloqueados actualmente:', blockedIds);
  
  // Buscar elementos de video en la página
  const videoElements = document.querySelectorAll('video');
  const iframeElements = document.querySelectorAll('iframe');
  
  console.log(`📊 ESTADÍSTICAS:`);
  console.log(`- ${videoElements.length} elementos <video> en la página`);
  console.log(`- ${iframeElements.length} elementos <iframe> en la página`);
  console.log(`- ${blockedIds.length} videos bloqueados en total`);
  
  // Verificar si hay solicitudes fetch pendientes
  console.log('\n🔄 VERIFICANDO SOLICITUDES ACTIVAS...');
  
  // Revisar redes de solicitudes activas
  const pendingFetches = [];
  const fetchMonkeyPatched = window.fetch !== window.fetch._origFetch;
  
  console.log(`- Monitoreo de fetch: ${fetchMonkeyPatched ? '✅ Activo' : '❌ Inactivo'}`);
  
  // Instalamos un nuevo monitor si no existe
  if (!fetchMonkeyPatched && !window._pendingRequests) {
    window._pendingRequests = [];
    window._origFetch = window.fetch;
    
    window.fetch = function(url, options) {
      const requestInfo = { url: url.toString(), time: new Date() };
      window._pendingRequests.push(requestInfo);
      
      return window._origFetch(url, options)
        .then(response => {
          // Eliminar de la lista de pendientes
          const index = window._pendingRequests.findIndex(r => r === requestInfo);
          if (index !== -1) window._pendingRequests.splice(index, 1);
          return response;
        })
        .catch(err => {
          // Eliminar de la lista de pendientes en caso de error
          const index = window._pendingRequests.findIndex(r => r === requestInfo);
          if (index !== -1) window._pendingRequests.splice(index, 1);
          throw err;
        });
    };
    
    console.log('- ✅ Instalado monitor de solicitudes');
  }
  
  // Mostrar solicitudes activas
  if (window._pendingRequests && window._pendingRequests.length) {
    console.log('- ⚠️ Solicitudes activas:');
    window._pendingRequests.forEach((req, i) => {
      console.log(`  ${i+1}. ${req.url} (iniciada hace ${Math.round((new Date() - req.time)/1000)}s)`);
      
      // Verificar si es un video problemático
      blockedIds.forEach(id => {
        if (req.url.includes(id)) {
          console.warn(`  ⛔ ESTA SOLICITUD CONTIENE UN ID PROBLEMÁTICO: ${id}`);
        }
      });
    });
  } else {
    console.log('- ✅ No hay solicitudes activas');
  }
  
  // Ver si hay bucles o errores en la consola
  console.log('\n🚨 ACCIONES RECOMENDADAS:');
  
  if (window._pendingRequests && window._pendingRequests.some(req => 
      blockedIds.some(id => req.url.includes(id)))) {
    console.log('- ⛔ HAY SOLICITUDES ACTIVAS A VIDEOS PROBLEMÁTICOS');
    console.log('  Recomendación: Ejecuta "cleanVideos()" y recarga la página');
  } else if (blockedIds.length > 0) {
    console.log('- ℹ️ Hay videos bloqueados pero no se detectan solicitudes problemáticas');
    console.log('  Parece que el sistema de bloqueo está funcionando correctamente');
  } else {
    console.log('- ✅ No se detectan problemas con videos');
  }
  
  // Función para limpiar
  window.cleanVideos = function() {
    console.log('\n🧹 LIMPIANDO CACHÉ DE VIDEOS...');
    
    // Restaurar función fetch original
    if (window._origFetch) {
      window.fetch = window._origFetch;
      delete window._origFetch;
      delete window._pendingRequests;
      console.log('- ✅ Restaurada función fetch original');
    }
    
    // Cancelar cualquier solicitud pendiente (solo informativo)
    console.log('- ℹ️ Las solicitudes pendientes serán canceladas al recargar');
    
    // Cargar script de limpieza
    const script = document.createElement('script');
    script.src = '/clean-video-cache.js';
    script.onload = () => {
      console.log('- ✅ Script de limpieza ejecutado');
      console.log('- 🔄 Recargando página en 2 segundos...');
      
      setTimeout(() => {
        window.location.reload(true); // Forzar recarga desde el servidor
      }, 2000);
    };
    document.head.appendChild(script);
  };
  
  console.log('\n🛠️ COMANDOS DISPONIBLES:');
  console.log('- cleanVideos() - Limpia la caché y recarga la página');
  console.log('- localStorage.removeItem("blockedVideoIds") - Elimina la lista de videos bloqueados');
})(); 