import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Category from '@/models/Category';
import Course from '@/models/Course';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

// GET /api/categories/[id] - Obtener una categoría por ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await context.params;
    const category = await Category.findById(id);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Actualizar una categoría
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const { id } = await context.params;
    const { title, description, icon, order, isActive } = await request.json();

    if (!title || !description || !icon) {
      return NextResponse.json(
        { error: 'Título, descripción e ícono son requeridos' },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        title,
        description,
        icon,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    
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

// DELETE /api/categories/[id] - Eliminar una categoría
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const { id } = await context.params;
    
    // Verificar si hay cursos usando esta categoría
    const coursesWithCategory = await Course.countDocuments({ category: id });
    
    if (coursesWithCategory > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar la categoría. Hay ${coursesWithCategory} curso(s) usando esta categoría.` },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 