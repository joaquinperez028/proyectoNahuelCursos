import mongoose from 'mongoose';

// Importar todos los modelos para asegurar que se registren antes de usarlos
import '../models/User';
import '../models/Course';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI no está definido en las variables de entorno');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('Conexión a MongoDB establecida');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    throw error;
  }
}; 