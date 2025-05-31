import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import Pack from '@/models/Pack';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Obtener todos los packs con sus cursos
    const packs = await Pack.find({}).populate('courses', '_id title price');
    
    const results = [];
    
    for (const pack of packs) {
      try {
        // Calcular el precio total de todos los cursos
        const totalCoursesPrice = pack.courses.reduce((sum: number, course: any) => sum + (course.price || 0), 0);
        
        if (totalCoursesPrice === 0) {
          results.push({
            packId: pack._id,
            packName: pack.name,
            status: 'error',
            message: 'No se pudo calcular el precio (cursos sin precio)'
          });
          continue;
        }

        // Calcular el precio con 10% de descuento
        const correctPackPrice = Math.round(totalCoursesPrice * 0.9);
        
        // Actualizar el pack
        await Pack.findByIdAndUpdate(pack._id, {
          price: correctPackPrice,
          originalPrice: totalCoursesPrice
        });

        results.push({
          packId: pack._id,
          packName: pack.name,
          status: 'updated',
          oldPrice: pack.price,
          newPrice: correctPackPrice,
          originalPrice: totalCoursesPrice,
          discount: '10%'
        });

      } catch (error) {
        results.push({
          packId: pack._id,
          packName: pack.name,
          status: 'error',
          message: `Error: ${error}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Precios de packs actualizados correctamente',
      results: results
    });

  } catch (error) {
    console.error('Error al arreglar precios de packs:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error 
    }, { status: 500 });
  }
} 