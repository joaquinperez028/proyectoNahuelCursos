import { Mux } from '@mux/mux-node';

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  throw new Error('Las credenciales de MUX no están configuradas');
}

// Inicializar el cliente de MUX
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

const { Video } = muxClient;

// Función para crear un nuevo Asset en MUX
export const createMuxAsset = async (videoUrl: string) => {
  try {
    const asset = await Video.Assets.create({
      input: videoUrl,
      playback_policy: 'signed',
    });
    
    return {
      assetId: asset.id,
      playbackId: asset.playback_ids?.[0]?.id,
    };
  } catch (error) {
    console.error('Error al crear el asset en MUX:', error);
    throw error;
  }
};

// Función para eliminar un Asset en MUX
export const deleteMuxAsset = async (assetId: string) => {
  try {
    await Video.Assets.del(assetId);
    return true;
  } catch (error) {
    console.error('Error al eliminar el asset en MUX:', error);
    throw error;
  }
};

// Crear un token de visualización firmado
export const createMuxPlaybackToken = (playbackId: string, expiryInSeconds = 3600) => {
  const expiry = Math.floor(Date.now() / 1000) + expiryInSeconds;

  const token = Video.JWT.create({
    type: 'token',
    playback_id: playbackId,
    exp: expiry,
  });
  
  return token;
}; 