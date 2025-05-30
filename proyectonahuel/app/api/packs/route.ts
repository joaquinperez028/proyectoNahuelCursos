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
    if (!data.name || !data.description || !data.price || !data.originalPrice || !Array.isArray(data.courses) || data.courses.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Preparar datos para crear el pack
    const packData: any = {
      name: data.name,
      description: data.description,
      price: Math.round(data.price * 100), // Convertir a centavos
      originalPrice: Math.round(data.originalPrice * 100), // Convertir a centavos
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
    return NextResponse.json(newPack, { status: 201 });
  } catch (error) {
    console.error('Error al crear pack:', error);
    return NextResponse.json({ error: 'Error al crear el pack' }, { status: 500 });
  }
} 