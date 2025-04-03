import { connectToDatabase } from './connection';
import { ObjectId } from 'mongodb';

// Datos de prueba: Cursos sobre criptomonedas
const cursosDePrueba = [
  {
    _id: new ObjectId(),
    titulo: 'Fundamentos de inversión en Bitcoin y Ethereum',
    descripcion: 'Aprende los conceptos básicos para invertir en las dos criptomonedas más importantes del mercado. Este curso cubre desde los fundamentos técnicos hasta estrategias prácticas de inversión.',
    precio: 99.99,
    video: 'https://www.youtube.com/embed/Yb6825iv0Vk',
    videoPreview: 'https://www.youtube.com/embed/Yb6825iv0Vk',
    fechaCreacion: new Date(),
    categorias: ['Bitcoin', 'Ethereum', 'Principiantes']
  },
  {
    _id: new ObjectId(),
    titulo: 'Análisis técnico para trading de criptomonedas',
    descripcion: 'Domina las técnicas de análisis de gráficos y patrones para tomar mejores decisiones en el mercado de criptomonedas. Aprenderás a identificar tendencias y momentos óptimos para comprar o vender.',
    precio: 149.99,
    video: 'https://www.youtube.com/embed/yd0cSAH31oA',
    videoPreview: 'https://www.youtube.com/embed/yd0cSAH31oA',
    fechaCreacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días antes
    categorias: ['Trading', 'Análisis Técnico', 'Intermedio']
  },
  {
    _id: new ObjectId(),
    titulo: 'DeFi: Finanzas descentralizadas desde cero',
    descripcion: 'Explora el mundo de DeFi y aprende a utilizar protocolos como Uniswap, Aave y Compound para generar rendimientos con tus activos digitales. Un curso completo para entender el futuro de las finanzas.',
    precio: 199.99,
    video: 'https://www.youtube.com/embed/k9HYC0EJU6E',
    videoPreview: 'https://www.youtube.com/embed/k9HYC0EJU6E',
    fechaCreacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días antes
    categorias: ['DeFi', 'Avanzado', 'Yield Farming']
  },
  {
    _id: new ObjectId(),
    titulo: 'NFTs: Inversión en tokens no fungibles',
    descripcion: 'Descubre cómo funcionan los NFTs y por qué están revolucionando el mundo del arte digital y el coleccionismo. Aprenderás a evaluar proyectos, comprar, vender y hasta crear tus propios NFTs.',
    precio: 129.99,
    video: 'https://www.youtube.com/embed/FkUn86bH34M',
    videoPreview: 'https://www.youtube.com/embed/FkUn86bH34M',
    fechaCreacion: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 días antes
    categorias: ['NFT', 'Arte Digital', 'Coleccionables']
  }
];

// Valoraciones de ejemplo para los cursos
const valoracionesEjemplo = [
  {
    cursoId: cursosDePrueba[0]._id,
    usuarioId: new ObjectId(),
    calificacion: 5,
    comentario: '¡Excelente curso para principiantes! Me ayudó a entender Bitcoin desde cero.',
    fechaCreacion: new Date()
  },
  {
    cursoId: cursosDePrueba[0]._id,
    usuarioId: new ObjectId(),
    calificacion: 4,
    comentario: 'Muy buen contenido, aunque algunas partes podrían profundizarse más.',
    fechaCreacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    cursoId: cursosDePrueba[1]._id,
    usuarioId: new ObjectId(),
    calificacion: 5,
    comentario: 'Las estrategias de trading presentadas son muy efectivas, ya estoy viendo resultados.',
    fechaCreacion: new Date()
  }
];

/**
 * Función para verificar y crear la colección si no existe
 */
async function asegurarColecciones(db) {
  const colecciones = await db.listCollections().toArray();
  const coleccionesExistentes = colecciones.map(c => c.name);
  
  const coleccionesRequeridas = ['cursos', 'valoraciones', 'usuarios'];
  
  for (const coleccion of coleccionesRequeridas) {
    if (!coleccionesExistentes.includes(coleccion)) {
      console.log(`Creando colección: ${coleccion}`);
      await db.createCollection(coleccion);
    }
  }
}

/**
 * Función para crear cursos de ejemplo en la base de datos
 * Con manejo mejorado de errores y reintentos
 */
export async function sembrarCursos(forzar = false) {
  console.log("Iniciando proceso de sembrado de datos...");
  let intentos = 0;
  const maxIntentos = 3;
  
  while (intentos < maxIntentos) {
    try {
      intentos++;
      console.log(`Intento ${intentos} de ${maxIntentos}...`);
      
      // Conectar a la base de datos
      const { db } = await connectToDatabase();
      
      // Asegurar que las colecciones existan
      await asegurarColecciones(db);
      
      // Verificar si ya hay cursos en la base de datos
      const cursosExistentes = await db.collection('cursos').countDocuments();
      
      if (cursosExistentes > 0 && !forzar) {
        console.log(`Ya existen ${cursosExistentes} cursos en la base de datos. No se sembrarán datos adicionales.`);
        return { 
          success: true, 
          message: 'Ya existen cursos en la base de datos',
          cursosExistentes
        };
      }
      
      if (forzar && cursosExistentes > 0) {
        console.log('Forzando creación de cursos aunque ya existan algunos...');
      }
      
      // Insertar los cursos de prueba
      const resultado = await db.collection('cursos').insertMany(cursosDePrueba);
      console.log(`${resultado.insertedCount} cursos han sido creados con éxito`);
      
      // Crear las valoraciones de ejemplo
      const resultadoValoraciones = await db.collection('valoraciones').insertMany(valoracionesEjemplo);
      console.log(`${resultadoValoraciones.insertedCount} valoraciones han sido creadas con éxito`);
      
      return { 
        success: true, 
        message: 'Datos sembrados correctamente',
        cursos: resultado.insertedCount,
        valoraciones: resultadoValoraciones.insertedCount 
      };
    } catch (error) {
      console.error(`Error al sembrar datos (intento ${intentos}):`, error);
      
      if (intentos >= maxIntentos) {
        return { 
          success: false, 
          message: `Error después de ${maxIntentos} intentos: ${error.message}` 
        };
      }
      
      // Esperar antes de reintentar (tiempo exponencial)
      const retryDelay = Math.min(1000 * Math.pow(2, intentos), 10000);
      console.log(`Reintentando en ${retryDelay/1000} segundos...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
} 