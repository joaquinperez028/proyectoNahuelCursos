import clientPromise from './mongodb';
import { Db, MongoClient } from 'mongodb';

/**
 * Conexión global a la base de datos de MongoDB
 */
let cachedDb: Db | null = null;
let cachedClient: MongoClient | null = null;
let connectionPromise: Promise<{ db: Db }> | null = null;

/**
 * Opciones de conexión para MongoDB
 */
const connectOptions = {
  // Tiempo máximo para establecer una conexión
  connectTimeoutMS: 5000,
  // Tiempo máximo para operaciones de lectura/escritura
  socketTimeoutMS: 5000,
  // Tiempo máximo de inactividad antes de cerrar conexión
  maxIdleTimeMS: 10000,
  // Evita el reintento infinito
  serverSelectionTimeoutMS: 5000
};

/**
 * Función para conectar a la base de datos de MongoDB
 * Con optimizaciones para evitar múltiples conexiones simultáneas
 * @returns Una promesa que resuelve a la instancia de la base de datos
 */
export async function connectToDatabase() {
  // Si ya tenemos una conexión establecida, la reusamos
  if (cachedDb) {
    return { db: cachedDb };
  }
  
  // Si hay una conexión en progreso, esperamos a que termine
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // Iniciamos el proceso de conexión y guardamos la promesa
  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('Iniciando conexión a MongoDB...');
      const startTime = Date.now();
      
      // Establecemos un timeout general para toda la conexión
      const timeout = setTimeout(() => {
        reject(new Error('Timeout al conectar a MongoDB después de 5 segundos'));
      }, 5000);
      
      // Intentamos establecer la conexión
      const client = await clientPromise;
      
      // Si llegamos aquí, la conexión se estableció correctamente
      clearTimeout(timeout);
      
      // Seleccionamos la base de datos
      const dbName = process.env.MONGODB_DB || 'nahuel-cursos';
      cachedDb = client.db(dbName);
      cachedClient = client;
      
      console.log(`Conexión a MongoDB establecida en ${Date.now() - startTime}ms`);
      
      resolve({ db: cachedDb });
      
      // Limpiamos la promesa en curso
      connectionPromise = null;
    } catch (error) {
      console.error('Error al conectar a MongoDB:', error);
      
      // Limpiamos la promesa en curso
      connectionPromise = null;
      
      // Limpiamos la conexión fallida
      cachedDb = null;
      cachedClient = null;
      
      reject(new Error(`No se pudo conectar a la base de datos: ${error.message}`));
    }
  });
  
  return connectionPromise;
} 