import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth/auth';
import { ObjectId } from 'mongodb';
import CursoModel from '@/models/curso';  // Importar el modelo Mongoose de curso
import { connectMongoose } from '@/lib/db/mongoose';  // Importar la conexión de Mongoose

const CURSOS_POR_PAGINA = 10;

// GET /api/cursos - Obtener cursos paginados con filtros opcionales
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const busqueda = searchParams.get('busqueda') || '';
    const ordenPrecio = searchParams.get('ordenPrecio') || '';
    const ordenFecha = searchParams.get('ordenFecha') || 'desc';

    // Conectar a la base de datos
    console.log('API Cursos: Conectando a la base de datos...');
    const { db } = await connectToDatabase();
    
    // Construir el filtro de búsqueda
    const filtro: any = {};
    if (busqueda) {
      filtro.$text = { $search: busqueda };
    }
    
    // Construir la opciones de ordenado
    const orden: any = {};
    if (ordenPrecio) {
      orden.precio = ordenPrecio === 'asc' ? 1 : -1;
    }
    if (ordenFecha) {
      orden.fechaCreacion = ordenFecha === 'asc' ? 1 : -1;
    }
    
    // Si no hay orden específico, ordenar por fecha de creación descendente
    if (Object.keys(orden).length === 0) {
      orden.fechaCreacion = -1;
    }
    
    // Calcular el salto para la paginación
    const skip = (pagina - 1) * CURSOS_POR_PAGINA;
    
    // Obtener el total de cursos que coinciden con el filtro
    const total = await db.collection('cursos').countDocuments(filtro);
    
    console.log(`API Cursos: Encontrados ${total} cursos en total.`);
    
    // Obtener los cursos paginados
    const cursos = await db.collection('cursos')
      .find(filtro)
      .sort(orden)
      .skip(skip)
      .limit(CURSOS_POR_PAGINA)
      .toArray();
    
    console.log(`API Cursos: Obtenidos ${cursos.length} cursos para la página ${pagina}.`);
    
    // Inspeccionar y procesar las URLs de video para asegurar que sean válidas
    const cursosConVideosProcesados = cursos.map(curso => {
      const cursoConVideosProcesados = {...curso};
      
      // Logs para depuración
      console.log(`API Cursos: Procesando curso: ${curso._id}`);
      console.log(`- Título: ${curso.titulo}`);
      console.log(`- Video original: ${curso.video}`);
      console.log(`- Video preview original: ${curso.videoPreview}`);
      
      // Verificar si el campo video es un ObjectId o una cadena que representa un ObjectId
      if (curso.video) {
        if (ObjectId.isValid(curso.video.toString())) {
          console.log(`- Video parece ser un ObjectId`);
          cursoConVideosProcesados.video = curso.video.toString();
        } else if (typeof curso.video === 'string' && curso.video.startsWith('http')) {
          console.log(`- Video es una URL externa: ${curso.video}`);
          // Mantener URLs externas
        } else {
          console.log(`- Video tiene un formato no reconocido: ${typeof curso.video}`);
        }
      } else {
        console.log(`- No se encontró campo video`);
      }
      
      // Verificar si el campo videoPreview es un ObjectId o una cadena que representa un ObjectId
      if (curso.videoPreview) {
        if (ObjectId.isValid(curso.videoPreview.toString())) {
          console.log(`- VideoPreview parece ser un ObjectId`);
          cursoConVideosProcesados.videoPreview = curso.videoPreview.toString();
        } else if (typeof curso.videoPreview === 'string' && curso.videoPreview.startsWith('http')) {
          console.log(`- VideoPreview es una URL externa: ${curso.videoPreview}`);
          // Mantener URLs externas
        } else {
          console.log(`- VideoPreview tiene un formato no reconocido: ${typeof curso.videoPreview}`);
        }
      } else {
        console.log(`- No se encontró campo videoPreview`);
      }
      
      return cursoConVideosProcesados;
    });
    
    // Enviar respuesta con meta información de paginación
    return NextResponse.json({
      cursos: cursosConVideosProcesados,
      meta: {
        pagina,
        totalPaginas: Math.ceil(total / CURSOS_POR_PAGINA),
        total,
        porPagina: CURSOS_POR_PAGINA
      }
    });
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los cursos', detalles: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

// POST /api/cursos - Crear un nuevo curso (solo admin)
export async function POST(request: Request) {
  try {
    // Verificar autenticación y permisos de administrador
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    console.log('Datos recibidos para crear curso:', data);
    
    // Validar datos requeridos
    const erroresValidacion = [];
    if (!data.titulo || typeof data.titulo !== 'string' || data.titulo.trim() === '') {
      erroresValidacion.push('El título es requerido');
    }
    
    if (!data.descripcion || typeof data.descripcion !== 'string' || data.descripcion.trim() === '') {
      erroresValidacion.push('La descripción es requerida');
    }
    
    if (data.precio === undefined || isNaN(parseFloat(data.precio)) || parseFloat(data.precio) < 0) {
      erroresValidacion.push('El precio debe ser un número mayor o igual a 0');
    }
    
    if (!data.video || typeof data.video !== 'string' || data.video.trim() === '') {
      erroresValidacion.push('La URL del video completo es requerida');
    }
    
    if (!data.videoPreview || typeof data.videoPreview !== 'string' || data.videoPreview.trim() === '') {
      erroresValidacion.push('La URL del video de vista previa es requerida');
    }
    
    if (erroresValidacion.length > 0) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: erroresValidacion },
        { status: 400 }
      );
    }
    
    try {
      // Establecer conexión con Mongoose
      await connectMongoose();
      console.log('Conexión a Mongoose exitosa');
      
      // Normalizar y validar datos
      const cursoParaGuardar = {
        titulo: data.titulo.trim(),
        descripcion: data.descripcion.trim(),
        precio: parseFloat(data.precio),
        video: data.video.trim(),
        videoPreview: data.videoPreview.trim(),
        fechaCreacion: new Date(),
        categorias: Array.isArray(data.categorias) 
          ? data.categorias.filter(cat => cat && typeof cat === 'string' && cat.trim() !== '')
          : []
      };
      
      console.log('Creando curso con el modelo Mongoose');
      
      // Crear el nuevo curso usando el modelo Mongoose
      const nuevoCurso = new CursoModel(cursoParaGuardar);
      const cursoGuardado = await nuevoCurso.save();
      
      if (!cursoGuardado || !cursoGuardado._id) {
        console.error('Error al guardar el curso con Mongoose');
        throw new Error('Error al crear el curso en la base de datos');
      }
      
      console.log('Curso creado exitosamente con Mongoose, ID:', cursoGuardado._id);
      
      return NextResponse.json(
        { 
          mensaje: 'Curso creado exitosamente', 
          id: cursoGuardado._id,
          curso: cursoGuardado
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('Error de base de datos al crear curso:', dbError);
      return NextResponse.json(
        { error: 'Error al guardar el curso en la base de datos' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error general al crear curso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la solicitud' },
      { status: 500 }
    );
  }
} 