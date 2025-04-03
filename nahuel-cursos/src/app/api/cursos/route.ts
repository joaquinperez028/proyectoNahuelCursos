import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth/auth';
import { ObjectId } from 'mongodb';

const CURSOS_POR_PAGINA = 10;

// GET /api/cursos - Obtener cursos paginados con filtros opcionales
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const busqueda = searchParams.get('busqueda') || '';
    const ordenPrecio = searchParams.get('ordenPrecio') || '';
    const ordenFecha = searchParams.get('ordenFecha') || 'desc';

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
    
    // Obtener los cursos paginados
    const cursos = await db.collection('cursos')
      .find(filtro)
      .sort(orden)
      .skip(skip)
      .limit(CURSOS_POR_PAGINA)
      .toArray();
    
    // Enviar respuesta con meta información de paginación
    return NextResponse.json({
      cursos,
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
      { error: 'Error al obtener los cursos' },
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
      const { db } = await connectToDatabase();
      console.log('Conexión a base de datos exitosa');
      
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
      
      console.log('Insertando curso en la base de datos');
      
      // Crear el nuevo curso
      const resultado = await db.collection('cursos').insertOne(cursoParaGuardar);
      
      if (!resultado.acknowledged) {
        console.error('Error al insertar en la base de datos: operación no reconocida');
        throw new Error('Error al crear el curso en la base de datos');
      }
      
      console.log('Curso creado exitosamente, ID:', resultado.insertedId);
      
      return NextResponse.json(
        { 
          mensaje: 'Curso creado exitosamente', 
          id: resultado.insertedId,
          curso: {
            _id: resultado.insertedId,
            ...cursoParaGuardar
          }
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