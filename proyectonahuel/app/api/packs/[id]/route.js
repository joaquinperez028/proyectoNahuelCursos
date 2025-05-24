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