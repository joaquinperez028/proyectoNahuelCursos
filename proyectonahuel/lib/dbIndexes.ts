import { connectToDatabase } from './mongodb';
import Course from '@/models/Course';
import Review from '@/models/Review';

/**
 * Configura índices optimizados para mejorar el rendimiento de las consultas
 * Este archivo se puede ejecutar una vez para configurar los índices necesarios
 */
export async function setupDatabaseIndexes() {
  try {
    await connectToDatabase();
    
    console.log('🔧 Configurando índices de base de datos...');
    
    // Índices para el modelo Course
    await Course.collection.createIndex({ category: 1, createdAt: -1 });
    await Course.collection.createIndex({ createdAt: -1 });
    await Course.collection.createIndex({ onSale: 1 });
    await Course.collection.createIndex({ price: 1 });
    
    // Índices para el modelo Review
    await Review.collection.createIndex({ courseId: 1 });
    await Review.collection.createIndex({ courseId: 1, rating: 1 });
    
    console.log('✅ Índices configurados correctamente');
    
    return { success: true, message: 'Índices configurados' };
  } catch (error) {
    console.error('❌ Error configurando índices:', error);
    return { success: false, error: error };
  }
}

/**
 * Función para verificar el rendimiento de las consultas
 */
export async function checkQueryPerformance() {
  try {
    await connectToDatabase();
    
    console.log('📊 Verificando rendimiento de consultas...');
    
    // Consulta de prueba con explain para verificar uso de índices
    const explainResult = await Course.collection.find({})
      .sort({ createdAt: -1 })
      .limit(12)
      .explain('executionStats');
    
    console.log('Consulta cursos - Tiempo de ejecución:', explainResult.executionStats.executionTimeMillis, 'ms');
    console.log('Documentos examinados:', explainResult.executionStats.totalDocsExamined);
    console.log('Índices usados:', explainResult.executionStats.indexesUsed || 'Ninguno específico');
    
    return explainResult.executionStats;
  } catch (error) {
    console.error('❌ Error verificando rendimiento:', error);
    return null;
  }
} 