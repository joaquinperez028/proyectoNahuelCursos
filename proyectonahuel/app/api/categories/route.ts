import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Category from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

// GET /api/categories - Obtener todas las categorías
export async function GET() {
  try {
    await connectToDatabase();
    
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, title: 1 });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/categories - Iniciando creación de categoría');
    
    const session = await getServerSession(authOptions);
    console.log('📋 Sesión obtenida:', {
      exists: !!session,
      email: session?.user?.email,
      role: session?.user?.role
    });
    
    if (!session || session.user.role !== 'admin') {
      console.log('❌ No autorizado - Sesión:', session ? 'Existe' : 'No existe', 'Rol:', session?.user?.role);
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('✅ Usuario autorizado, conectando a DB...');
    await connectToDatabase();
    console.log('✅ Conectado a la base de datos');
    
    const body = await request.json();
    console.log('📦 Datos recibidos:', body);
    
    const { title, description, icon, order } = body;

    if (!title || !description || !icon) {
      console.log('❌ Datos faltantes:', { title: !!title, description: !!description, icon: !!icon });
      return NextResponse.json(
        { error: 'Título, descripción e ícono son requeridos' },
        { status: 400 }
      );
    }

    console.log('🏗️ Creando categoría...');
    const category = new Category({
      title,
      description,
      icon,
      order: order || 0,
    });

    await category.save();
    console.log('✅ Categoría creada exitosamente:', category._id);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating category:', error);
    
    if ((error as any).code === 11000) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese título' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 