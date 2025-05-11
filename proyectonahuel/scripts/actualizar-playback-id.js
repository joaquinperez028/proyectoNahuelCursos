/**
 * Script para actualizar el playbackId de un curso específico
 * 
 * Uso:
 * 1. Ejecuta: node scripts/actualizar-playback-id.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// ID del curso y playbackId correcto
const CURSO_ID = process.env.CURSO_ID || ''; // Pasar como variable de entorno o cambiar aquí
const PLAYBACK_ID_CORRECTO = 'cy5yo02Us6yS501uC00BKfwZ54TeYE4T01HBeXFZmprOHIo';

// Definir esquema del curso
const CourseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  videoId: String,
  playbackId: String,
  introVideoId: String,
  introPlaybackId: String,
  thumbnailUrl: String,
  videos: [{
    title: String,
    description: String,
    videoId: String,
    playbackId: String,
    order: Number
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Función para conectar a la base de datos
async function connectDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/proyectonahuel';
    
    if (!MONGODB_URI) {
      throw new Error('MongoDB URI no configurada');
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('Conexión a MongoDB establecida.');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    throw error;
  }
}

// Función principal
async function actualizarPlaybackId() {
  try {
    console.log('Conectando a la base de datos...');
    await connectDB();
    
    // Usar el esquema para definir el modelo Course
    const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);
    
    if (!CURSO_ID) {
      // Si no se proporcionó un ID específico, mostrar todos los cursos para seleccionar
      console.log('Listando todos los cursos disponibles:');
      const cursos = await Course.find({}, 'title _id playbackId');
      
      if (cursos.length === 0) {
        console.log('No se encontraron cursos en la base de datos.');
        return;
      }
      
      console.log('\nCursos disponibles:');
      cursos.forEach((curso, index) => {
        console.log(`${index + 1}. ID: ${curso._id} - Título: ${curso.title}`);
        console.log(`   PlaybackID actual: ${curso.playbackId || 'No definido'}`);
        console.log('---');
      });
      
      console.log('\nPara actualizar un curso específico, ejecuta el script nuevamente con la variable CURSO_ID:');
      console.log('CURSO_ID=id_del_curso node scripts/actualizar-playback-id.js');
      
      return;
    }
    
    // Buscar el curso por su ID
    console.log(`Buscando curso con ID: ${CURSO_ID}`);
    const curso = await Course.findById(CURSO_ID);
    
    if (!curso) {
      console.error(`No se encontró ningún curso con el ID: ${CURSO_ID}`);
      return;
    }
    
    // Guardar el playbackId antiguo para mostrarlo
    const playbackIdAntiguo = curso.playbackId;
    
    // Actualizar el playbackId
    curso.playbackId = PLAYBACK_ID_CORRECTO;
    await curso.save();
    
    console.log('¡Actualización exitosa!');
    console.log(`Curso: ${curso.title}`);
    console.log(`PlaybackID anterior: ${playbackIdAntiguo}`);
    console.log(`PlaybackID nuevo: ${PLAYBACK_ID_CORRECTO}`);
    
  } catch (error) {
    console.error('Error al actualizar el playbackId:', error);
  } finally {
    // Cerrar la conexión a MongoDB
    await mongoose.connection.close();
    console.log('Conexión a la base de datos cerrada.');
  }
}

// Ejecutar la función principal
actualizarPlaybackId().catch(console.error); 