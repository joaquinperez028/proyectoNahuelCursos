import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";
import User from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/options";

// PUT /api/reviews/[id] - Actualizar una reseña
export async function PUT(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop();
  
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Buscar la reseña
    const review = await Review.findById(id);
    
    if (!review) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar si el usuario es el autor de la reseña
    if (review.userId.toString() !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta reseña' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validar datos
    if (!data.rating || !data.comment) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    if (data.rating < 1 || data.rating > 5) {
      return NextResponse.json(
        { error: 'La puntuación debe estar entre 1 y 5' },
        { status: 400 }
      );
    }
    
    // Actualizar la reseña
    review.rating = data.rating;
    review.comment = data.comment;
    
    await review.save();
    await review.populate('userId', 'name image');
    
    return NextResponse.json(review);
  } catch (error) {
    console.error('Error al actualizar la reseña:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la reseña' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - Eliminar una reseña
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop();
  
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Buscar la reseña
    const review = await Review.findById(id);
    
    if (!review) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar si el usuario es el autor de la reseña o es admin
    if (review.userId.toString() !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta reseña' },
        { status: 403 }
      );
    }
    
    // Eliminar la reseña
    await Review.findByIdAndDelete(id);
    
    return NextResponse.json(
      { message: 'Reseña eliminada correctamente' }
    );
  } catch (error) {
    console.error('Error al eliminar la reseña:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la reseña' },
      { status: 500 }
    );
  }
} 