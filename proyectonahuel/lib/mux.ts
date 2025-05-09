import Mux from '@mux/mux-node';

// Credenciales
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID || 'development_token_id';
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET || 'development_token_secret';

// Cliente MUX (singleton)
let muxClient: any = null;

/**
 * Obtiene una instancia del cliente MUX
 */
function getMuxClient() {
  if (!muxClient) {
    try {
      muxClient = new Mux(MUX_TOKEN_ID, MUX_TOKEN_SECRET);
    } catch (error) {
      console.error('Error al inicializar MUX:', error);
      
      // Cliente simulado para desarrollo
      muxClient = {
        Video: {
          Assets: {
            create: async () => ({ 
              id: 'dev_asset_id', 
              playback_ids: [{ id: 'dev_playback_id' }] 
            }),
          }
        }
      };
    }
  }
  return muxClient;
}

/**
 * Crea un asset en MUX desde una URL
 */
export const createMuxAsset = async (videoUrl: string) => {
  try {
    // Modo desarrollo
    if (process.env.NODE_ENV === 'development' && !process.env.MUX_TOKEN_ID) {
      console.log('Modo desarrollo: simulando creación de asset para URL:', videoUrl);
      return {
        assetId: 'dev_asset_id',
        playbackId: 'dev_playback_id',
      };
    }
    
    // Obtener cliente
    const client = getMuxClient();
    
    // Crear asset
    const asset = await client.Video.Assets.create({
      input: [{ url: videoUrl }],
      playback_policy: ['public'],
    });
    
    return {
      assetId: asset.id,
      playbackId: asset.playback_ids?.[0]?.id,
    };
  } catch (error) {
    console.error('Error al crear el asset en MUX:', error);
    return {
      assetId: 'error_asset_id',
      playbackId: 'error_playback_id',
    };
  }
};

/**
 * Elimina un asset de MUX por su ID
 */
export const deleteMuxAsset = async (assetId: string) => {
  try {
    // Modo desarrollo
    if (process.env.NODE_ENV === 'development' && !process.env.MUX_TOKEN_ID) {
      console.log('Modo desarrollo: simulando eliminación de asset:', assetId);
      return true;
    }
    
    // Obtener cliente
    const client = getMuxClient();
    
    // Eliminar asset (intentamos ambos métodos posibles)
    try {
      if (typeof client.Video.Assets.delete === 'function') {
        await client.Video.Assets.delete(assetId);
      } else if (typeof client.Video.Assets.remove === 'function') {
        await client.Video.Assets.remove(assetId);
      } else {
        throw new Error('Método de eliminación de assets no disponible');
      }
      return true;
    } catch (innerError) {
      console.error('Error específico al eliminar asset:', innerError);
      return false;
    }
  } catch (error) {
    console.error('Error general al eliminar el asset en MUX:', error);
    return false;
  }
};

/**
 * Genera un token de reproducción (simulado)
 */
export const createMuxPlaybackToken = (playbackId: string, expiryInSeconds = 3600) => {
  // En producción, aquí implementaríamos la generación real del token JWT
  return 'simulated_token_' + playbackId;
}; 