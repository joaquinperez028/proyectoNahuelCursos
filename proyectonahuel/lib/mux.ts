import Mux from '@mux/mux-node';

// Credenciales
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID || 'development_token_id';
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET || 'development_token_secret';

// Cliente MUX (singleton)
let muxClient: any = null;

// Estados válidos para un asset
const READY_STATES = ['ready', 'preparing'];
const MAX_CHECK_ATTEMPTS = 10;
const CHECK_INTERVAL = 3000; // 3 segundos

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
              playback_ids: [{ id: 'dev_playback_id' }],
              status: 'ready'
            }),
            get: async () => ({
              status: 'ready',
              playback_ids: [{ id: 'dev_playback_id', policy: 'public' }]
            })
          }
        }
      };
    }
  }
  return muxClient;
}

/**
 * Espera a que un asset esté listo
 */
const waitForAssetReady = async (assetId: string): Promise<boolean> => {
  const client = getMuxClient();
  let attempts = 0;

  while (attempts < MAX_CHECK_ATTEMPTS) {
    try {
      const asset = await client.Video.Assets.get(assetId);
      console.log(`Estado del asset ${assetId}:`, asset.status);
      
      if (READY_STATES.includes(asset.status)) {
        return true;
      }
      
      if (asset.status === 'errored') {
        console.error('El asset ha fallado:', asset.errors);
        return false;
      }
      
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
      attempts++;
    } catch (error) {
      console.error('Error al verificar estado del asset:', error);
      return false;
    }
  }
  
  console.error('Tiempo de espera agotado para el asset:', assetId);
  return false;
};

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
        ready: true
      };
    }
    
    // Obtener cliente
    const client = getMuxClient();
    
    // Crear asset con política pública
    const asset = await client.Video.Assets.create({
      input: [{ url: videoUrl }],
      playback_policy: ['public'],
      test: false
    });
    
    console.log('Asset creado en MUX:', {
      id: asset.id,
      playbackId: asset.playback_ids?.[0]?.id,
      policy: asset.playback_ids?.[0]?.policy,
      status: asset.status
    });

    // Esperar a que el asset esté listo
    const isReady = await waitForAssetReady(asset.id);
    
    if (!isReady) {
      throw new Error('El asset no pudo ser procesado correctamente');
    }
    
    // Obtener el asset actualizado para asegurarnos de tener la información más reciente
    const readyAsset = await client.Video.Assets.get(asset.id);
    
    return {
      assetId: readyAsset.id,
      playbackId: readyAsset.playback_ids?.[0]?.id,
      ready: true
    };
  } catch (error) {
    console.error('Error al crear el asset en MUX:', error);
    throw error;
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
 * Genera un token de reproducción JWT para MUX
 */
export const createMuxPlaybackToken = (playbackId: string, expiryInSeconds = 3600) => {
  try {
    // En desarrollo sin credenciales, no usamos tokens
    if (process.env.NODE_ENV === 'development' && !process.env.MUX_SIGNING_KEY) {
      console.log('Modo desarrollo: no se generan tokens JWT para MUX');
      return ''; // En MUX, si no se proporciona un token, se usa reproducción pública
    }
    
    // Verificar que tengamos las credenciales necesarias
    const signingKey = process.env.MUX_SIGNING_KEY;
    const signingKeyId = process.env.MUX_SIGNING_KEY_ID;
    
    if (!signingKey || !signingKeyId) {
      console.warn('Faltan credenciales para generar token JWT de MUX');
      return '';
    }
    
    // Importar jsonwebtoken
    const jwt = require('jsonwebtoken');
    
    // Tiempo actual en segundos
    const now = Math.floor(Date.now() / 1000);
    
    // Crear payload del token
    const payload = {
      sub: playbackId,
      exp: now + expiryInSeconds,
      aud: 'v',  // 'v' para video
      kid: signingKeyId
    };
    
    // Generar token JWT
    const token = jwt.sign(payload, signingKey, { algorithm: 'RS256' });
    
    return token;
  } catch (error) {
    console.error('Error al generar token JWT para MUX:', error);
    return '';
  }
}; 