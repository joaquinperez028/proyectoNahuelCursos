import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import Pack from '@/models/Pack';
import Course from '@/models/Course';

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    // Si es admin, devolver todos los packs
    if (session?.user?.role === 'admin') {
      const packs = await Pack.find()
        .populate('courses', 'title price thumbnailUrl')
        .lean();
      return NextResponse.json(packs);
    }
    
    // Si no es admin, solo devolver packs activos
    const packs = await Pack.find({ active: true })
      .populate('courses', 'title price thumbnailUrl')
      .lean();
    return NextResponse.json(packs);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener packs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }
    await connectToDatabase();
    const data = await request.json();
    
    // Validación de campos requeridos (los precios ya no son requeridos)
    if (!data.name || !data.description || !Array.isArray(data.courses) || data.courses.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos (name, description, courses)' }, { status: 400 });
    }

    // Obtener los cursos seleccionados para calcular precios
    const selectedCourses = await Course.find({ _id: { $in: data.courses } });
    if (selectedCourses.length !== data.courses.length) {
      return NextResponse.json({ error: 'Algunos cursos no existen' }, { status: 400 });
    }

    // Calcular precios automáticamente
    const totalCoursesPrice = selectedCourses.reduce((sum, course) => sum + (course.price || 0), 0);
    if (totalCoursesPrice <= 0) {
      return NextResponse.json({ error: 'Los cursos seleccionados deben tener precios configurados y mayor a $0' }, { status: 400 });
    }

    const packPriceWithDiscount = Math.round(totalCoursesPrice * 0.9); // 10% descuento
    
    // VALIDACIÓN: Asegurar precio mínimo del pack
    if (packPriceWithDiscount <= 0) {
      return NextResponse.json({ error: 'El precio calculado del pack debe ser mayor a $0' }, { status: 400 });
    }

    // Preparar datos para crear el pack
    const packData: any = {
      name: data.name,
      description: data.description,
      price: packPriceWithDiscount, // Precio calculado automáticamente
      originalPrice: totalCoursesPrice, // Total de cursos sin descuento
      courses: data.courses,
      active: true
    };

    // Agregar imagen según el método usado
    if (data.imageData) {
      // Si se subió un archivo
      packData.imageData = data.imageData;
    } else if (data.imageUrl) {
      // Si se proporcionó una URL
      packData.imageUrl = data.imageUrl;
    }

    const newPack = await Pack.create(packData);
    
    // Retornar el pack creado con información adicional de precios
    return NextResponse.json({
      ...newPack.toObject(),
      pricing: {
        totalCoursesPrice,
        packPrice: packPriceWithDiscount,
        discount: totalCoursesPrice - packPriceWithDiscount,
        discountPercentage: 10
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear pack:', error);
    return NextResponse.json({ error: 'Error al crear el pack' }, { status: 500 });
  }
} 