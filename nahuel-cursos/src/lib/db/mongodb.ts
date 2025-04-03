import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Por favor define la variable de entorno MONGODB_URI');
}

const uri = process.env.MONGODB_URI;

// Opciones optimizadas para evitar timeouts
const options = {
  connectTimeoutMS: 10000, // 10 segundos máximo para conectar
  socketTimeoutMS: 45000, // 45 segundos máximo para operaciones
  serverSelectionTimeoutMS: 10000, // 10 segundos máximo para selección de servidor
  maxPoolSize: 10, // Limitar el número de conexiones en el pool
  minPoolSize: 1, // Mantener al menos una conexión abierta
};

let client;
let clientPromise: Promise<MongoClient>;

// Función para crear una nueva conexión con manejo de errores
const createConnection = () => {
  const client = new MongoClient(uri, options);
  const connectionPromise = client.connect()
    .catch(error => {
      console.error('Error al conectar a MongoDB:', error);
      // Lanzar el error para que se maneje en el nivel superior
      throw error;
    });
  
  return connectionPromise;
};

if (process.env.NODE_ENV === 'development') {
  // En desarrollo, usamos una variable global para preservar la conexión entre recargas de página
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = createConnection();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // En producción, siempre creamos una nueva conexión
  clientPromise = createConnection();
  
  // Añadir manejo de errores para producción
  clientPromise.catch(error => {
    console.error('Error fatal en la conexión a MongoDB en producción:', error);
  });
}

export default clientPromise; 