import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('La variable de entorno MONGODB_URI no está definida');
}

interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Creamos un objeto global para almacenar la conexión
const globalWithMongoose = global as unknown as {
  mongoose: MongooseConnection;
};

// Inicializamos la conexión global si no existe
if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = {
    conn: null,
    promise: null,
  };
}

/**
 * Función para conectar a MongoDB con Mongoose
 */
export async function connectMongoose() {
  // Si ya estamos conectados, devolvemos la conexión
  if (globalWithMongoose.mongoose.conn) {
    console.log('MONGOOSE: Usando conexión existente');
    return globalWithMongoose.mongoose.conn;
  }

  // Si hay una promesa de conexión en curso, esperamos a que se resuelva
  if (globalWithMongoose.mongoose.promise) {
    console.log('MONGOOSE: Esperando conexión en curso');
    return globalWithMongoose.mongoose.promise;
  }

  // Configuración para la conexión
  const options = {
    connectTimeoutMS: 20000,
    socketTimeoutMS: 60000,
    serverSelectionTimeoutMS: 20000,
    maxPoolSize: 10
  };

  console.log('MONGOOSE: Iniciando nueva conexión a MongoDB');
  
  // Crear una nueva promesa de conexión
  globalWithMongoose.mongoose.promise = mongoose
    .connect(MONGODB_URI, options)
    .then((mongoose) => {
      console.log('MONGOOSE: Conexión exitosa a MongoDB');
      return mongoose;
    })
    .catch((error) => {
      console.error('MONGOOSE: Error al conectar a MongoDB:', error);
      globalWithMongoose.mongoose.promise = null;
      throw error;
    });

  // Almacenar la conexión en la variable global
  globalWithMongoose.mongoose.conn = await globalWithMongoose.mongoose.promise;
  
  return globalWithMongoose.mongoose.conn;
}

// Evento para desconexión
mongoose.connection.on('disconnected', () => {
  console.log('MONGOOSE: Desconectado de MongoDB');
  globalWithMongoose.mongoose.conn = null;
});

export default connectMongoose; 