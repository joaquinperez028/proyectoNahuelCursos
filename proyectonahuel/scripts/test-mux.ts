// Script para probar la configuración de MUX
// Ejecutar con: npx ts-node scripts/test-mux.ts

const Mux = require('@mux/mux-node');

async function testMuxConnection() {
  try {
    console.log('Intentando conectar con MUX...');
    
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      console.error('Error: Las variables de entorno MUX_TOKEN_ID y MUX_TOKEN_SECRET no están configuradas');
      console.log('Asegúrate de que estas variables estén configuradas en tu archivo .env.local o en Vercel');
      process.exit(1);
    }
    
    // Inicializar cliente MUX
    const { Video } = new Mux(
      process.env.MUX_TOKEN_ID,
      process.env.MUX_TOKEN_SECRET
    );
    
    // Probar la conexión listando los assets
    console.log('Obteniendo lista de assets...');
    const assets = await Video.Assets.list();
    
    console.log('Conexión exitosa a MUX!');
    console.log(`Número de assets existentes: ${assets.length}`);
    
    if (assets.length > 0) {
      console.log('\nPrimer asset:');
      console.log(`- ID: ${assets[0].id}`);
      console.log(`- Estado: ${assets[0].status}`);
      console.log(`- Duración: ${assets[0].duration} segundos`);
      console.log(`- Creado: ${new Date(assets[0].created_at).toLocaleString()}`);
    }
    
    console.log('\nLa configuración de MUX funciona correctamente.');
  } catch (error) {
    console.error('Error al conectar con MUX:', error);
    process.exit(1);
  }
}

// Ejecutar la función de prueba
testMuxConnection(); 