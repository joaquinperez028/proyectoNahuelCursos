import clientPromise from './mongodb';
import { Db } from 'mongodb';

/**
 * Conexión global a la base de datos de MongoDB
 */
let db: Db;

/**
 * Función para conectar a la base de datos de MongoDB
 * @returns Una promesa que resuelve a la instancia de la base de datos
 */
export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }
  
  try {
    const client = await clientPromise;
    db = client.db(process.env.MONGODB_DB || 'nahuel-cursos');
    return db;
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    throw new Error('No se pudo conectar a la base de datos');
  }
} 