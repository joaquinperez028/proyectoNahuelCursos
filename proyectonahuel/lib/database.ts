import mongoose from 'mongoose';

let isConnected = false;

export const connectToDB = async () => {
  mongoose.set('strictQuery', true);

  if (isConnected) {
    console.log('MongoDB ya está conectado');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    isConnected = true;
    console.log('MongoDB conectado');
  } catch (error) {
    console.log('Error al conectar a MongoDB:', error);
  }
}; 