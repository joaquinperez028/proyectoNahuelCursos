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

    const db = await connectToDatabase();
    
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
    
    // Validar datos requeridos
    if (!data.titulo || !data.descripcion || data.precio === undefined || !data.video || !data.videoPreview) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    const db = await connectToDatabase();
    
    // Crear el nuevo curso
    const resultado = await db.collection('cursos').insertOne({
      ...data,
      fechaCreacion: new Date(),
      categorias: data.categorias || []
    });
    
    if (!resultado.acknowledged) {
      throw new Error('Error al crear el curso');
    }
    
    return NextResponse.json(
      { mensaje: 'Curso creado exitosamente', id: resultado.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear curso:', error);
    return NextResponse.json(
      { error: 'Error al crear el curso' },
      { status: 500 }
    );
  }
} 