import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Category from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const { title, description, icon, order } = await request.json();

    if (!title || !description || !icon) {
      return NextResponse.json(
        { error: 'Título, descripción e ícono son requeridos' },
        { status: 400 }
      );
    }

    const category = new Category({
      title,
      description,
      icon,
      order: order || 0,
    });

    await category.save();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    
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