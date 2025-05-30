import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Pack from '@/models/Pack';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import Payment from '@/models/Payment';

export async function GET(request, context) {
  await connectToDatabase();
  const pack = await Pack.findById(context.params.id).populate('courses', 'title');
  if (!pack) {
    return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 });
  }
  return NextResponse.json(pack);
}

export async function PATCH(request, context) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado y es admin
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Verificar si el usuario es admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar packs' },
        { status: 403 }
      );
    }
    
    const packId = context.params.id;
    const pack = await Pack.findById(packId);
    
    if (!pack) {
      return NextResponse.json(
        { error: 'Pack no encontrado' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Actualizar el estado active del pack
    pack.active = data.active;
    await pack.save();
    
    return NextResponse.json({
      message: `Pack ${data.active ? 'activado' : 'desactivado'} correctamente`,
      pack
    });
  } catch (error) {
    console.error('Error al modificar el pack:', error);
    return NextResponse.json(
      { error: 'Error al modificar el pack' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado y es admin
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Verificar si el usuario es admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar packs' },
        { status: 403 }
      );
    }
    
    const packId = context.params.id;
    const pack = await Pack.findById(packId);
    
    if (!pack) {
      return NextResponse.json(
        { error: 'Pack no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si hay pagos asociados al pack
    const paymentsCount = await Payment.countDocuments({ packId: packId });
    if (paymentsCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el pack porque tiene pagos asociados' },
        { status: 400 }
      );
    }
    
    // Eliminar el pack
    await Pack.findByIdAndDelete(packId);
    
    return NextResponse.json(
      { message: 'Pack eliminado correctamente' }
    );
  } catch (error) {
    console.error('Error al eliminar el pack:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el pack' },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado y es admin
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Verificar si el usuario es admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar packs' },
        { status: 403 }
      );
    }
    
    const packId = context.params.id;
    const pack = await Pack.findById(packId);
    
    if (!pack) {
      return NextResponse.json(
        { error: 'Pack no encontrado' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validar campos requeridos
    if (!data.name || !data.description || !data.price || !data.originalPrice || !Array.isArray(data.courses) || data.courses.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    
    // Preparar datos para actualizar
    const updateData = {
      name: data.name,
      description: data.description,
      price: Math.round(data.price * 100), // Convertir a centavos
      originalPrice: Math.round(data.originalPrice * 100), // Convertir a centavos
      courses: data.courses,
    };
    
    // Manejar imagen según el método usado
    if (data.imageData) {
      // Si se subió un archivo
      updateData.imageData = data.imageData;
      updateData.imageUrl = undefined; // Limpiar URL si se usa archivo
    } else if (data.imageUrl) {
      // Si se proporcionó una URL
      updateData.imageUrl = data.imageUrl;
      updateData.imageData = undefined; // Limpiar datos si se usa URL
    }
    
    // Actualizar el pack
    const updatedPack = await Pack.findByIdAndUpdate(packId, updateData, { new: true });
    
    return NextResponse.json({
      message: 'Pack actualizado correctamente',
      pack: updatedPack
    });
  } catch (error) {
    console.error('Error al actualizar el pack:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el pack' },
      { status: 500 }
    );
  }
} 