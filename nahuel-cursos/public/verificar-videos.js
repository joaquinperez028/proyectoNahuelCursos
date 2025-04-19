/**
 * Script para verificar el estado de los videos en la base de datos
 * Para usar, abre la consola del navegador y ejecuta:
 * verificarCursos()
 */

async function verificarCursos() {
  try {
    console.log('Verificando cursos en la base de datos...');
    
    // Obtener los cursos de la API
    const response = await fetch('/api/cursos?pagina=1');
    if (!response.ok) {
      throw new Error('Error al obtener los cursos: ' + response.statusText);
    }
    
    const data = await response.json();
    console.log('Cursos encontrados:', data.cursos.length);
    
    let problematicos = 0;
    
    // Verificar cada curso
    for (const curso of data.cursos) {
      console.group('Curso: ' + curso.titulo);
      console.log('ID:', curso._id);
      let tieneProblemas = false;
      
      // Verificar URLs de video
      if (curso.video) {
        console.log('Video URL:', curso.video);
        const videoType = getVideoType(curso.video);
        console.log('Video tipo:', videoType);
        
        if (videoType === 'unknown') {
          console.warn('⚠️ URL de video principal no reconocida');
          tieneProblemas = true;
        }
      } else {
        console.warn('⚠️ No tiene URL de video principal');
        tieneProblemas = true;
      }
      
      if (curso.videoPreview) {
        console.log('Preview URL:', curso.videoPreview);
        const previewType = getVideoType(curso.videoPreview);
        console.log('Preview tipo:', previewType);
        
        if (previewType === 'unknown') {
          console.warn('⚠️ URL de video preview no reconocida');
          tieneProblemas = true;
        }
        
        // Intentar acceder directamente
        if (previewType === 'api' || previewType === 'objectid') {
          const url = previewType === 'objectid' 
            ? '/api/videos/' + curso.videoPreview
            : curso.videoPreview;
            
          console.log('Verificando acceso a:', url);
          try {
            const response = await fetch(url, { method: 'HEAD' });
            console.log('Respuesta:', response.status, response.statusText);
            if (!response.ok) {
              console.error('❌ Error al acceder al video de preview');
              tieneProblemas = true;
            } else {
              console.log('✅ Video de preview accesible');
            }
          } catch (error) {
            console.error('❌ Error al acceder al video de preview:', error);
            tieneProblemas = true;
          }
        }
      } else {
        console.warn('⚠️ No tiene URL de video preview');
        tieneProblemas = true;
      }
      
      if (tieneProblemas) {
        problematicos++;
      }
      
      console.groupEnd();
    }
    
    console.log(`Verificación completa. Cursos con problemas: ${problematicos}/${data.cursos.length}`);
    return {
      total: data.cursos.length,
      problematicos
    };
  } catch (error) {
    console.error('Error al verificar cursos:', error);
    return {
      error: error.message
    };
  }
}

function getVideoType(url) {
  if (!url) return 'none';
  
  // Comprobar si es un ObjectId
  if (/^[0-9a-fA-F]{24}$/.test(url)) {
    return 'objectid';
  }
  
  // Comprobar si es una API URL
  if (url.startsWith('/api/videos/')) {
    return 'api';
  }
  
  // Comprobar si es YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  // Comprobar si es Vimeo
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  
  // Comprobar si es un archivo local
  if (url.includes('/uploads/') || url.startsWith('/uploads/')) {
    return 'local';
  }
  
  // URL externa genérica
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return 'external';
  }
  
  return 'unknown';
}

async function repararVideosJson() {
  try {
    console.log('Intentando reparar videos...');
    
    // Obtener los cursos de la API
    const response = await fetch('/api/cursos/repair-videos');
    if (!response.ok) {
      throw new Error('Error al reparar los videos: ' + response.statusText);
    }
    
    const data = await response.json();
    console.log('Resultado de la reparación:', data);
    return data;
  } catch (error) {
    console.error('Error al reparar videos:', error);
    return {
      error: error.message
    };
  }
}

// Mensaje de carga
console.log('Script de verificación de videos cargado. Ejecuta verificarCursos() para analizar los videos en la base de datos.'); 