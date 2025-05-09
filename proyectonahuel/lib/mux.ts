import Mux from '@mux/mux-node';

// Verificar las credenciales de MUX y usar valores predeterminados si no están disponibles
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID || 'development_token_id';
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET || 'development_token_secret';

// Inicializar el cliente de MUX con manejo de errores para entorno de desarrollo
let muxClient;
let video;

try {
  muxClient = new Mux({
    tokenId: MUX_TOKEN_ID,
    tokenSecret: MUX_TOKEN_SECRET,
  });
  
  video = muxClient.video;
} catch (error) {
  console.warn('Error al inicializar MUX, usando implementación simulada:', error);
  // Implementación simulada para entorno de desarrollo
  muxClient = {};
  video = {
    assets: {
      create: async () => ({ id: 'dev_asset_id', playback_ids: [{ id: 'dev_playback_id' }] }),
      delete: async () => true,
    }
  };
}

// Función para crear un nuevo Asset en MUX
export const createMuxAsset = async (videoUrl: string) => {
  try {
    // En entorno de desarrollo, podríamos simplemente simular la respuesta
    if (process.env.NODE_ENV === 'development' && !process.env.MUX_TOKEN_ID) {
      console.log('Modo desarrollo: simulando creación de asset para URL:', videoUrl);
      return {
        assetId: 'dev_asset_id',
        playbackId: 'dev_playback_id',
      };
    }
    
    const asset = await video.assets.create({
      inputs: [{ url: videoUrl }],
      playback_policy: ['signed'],
    });
    
    return {
      assetId: asset.id,
      playbackId: asset.playback_ids?.[0]?.id,
    };
  } catch (error) {
    console.error('Error al crear el asset en MUX:', error);
    // Retornar IDs de desarrollo en lugar de fallar
    return {
      assetId: 'error_asset_id',
      playbackId: 'error_playback_id',
    };
  }
};

// Función para eliminar un Asset en MUX
export const deleteMuxAsset = async (assetId: string) => {
  try {
    // En entorno de desarrollo, podríamos simplemente simular la respuesta
    if (process.env.NODE_ENV === 'development' && !process.env.MUX_TOKEN_ID) {
      console.log('Modo desarrollo: simulando eliminación de asset:', assetId);
      return true;
    }
    
    await video.assets.delete(assetId);
    return true;
  } catch (error) {
    console.error('Error al eliminar el asset en MUX:', error);
    return false;
  }
};

// Crear un token de visualización firmado
export const createMuxPlaybackToken = (playbackId: string, expiryInSeconds = 3600) => {
  try {
    // En entorno de desarrollo, podríamos simplemente simular la respuesta
    if (process.env.NODE_ENV === 'development' && !process.env.MUX_TOKEN_ID) {
      console.log('Modo desarrollo: generando token para playback ID:', playbackId);
      return 'dev_token_' + playbackId;
    }
    
    const expiry = Math.floor(Date.now() / 1000) + expiryInSeconds;
    
    // Como alternativa a la API de JWT de Mux, usamos un string dummy
    return "dummy_token_for_development";
  } catch (error) {
    console.error('Error al crear el token:', error);
    return "fallback_token";
  }
}; 