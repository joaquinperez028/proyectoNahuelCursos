import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import Pack from '@/models/Pack';
import Course from '@/models/Course';

export async function GET() {
  try {
    await connectToDatabase();
    const packs = await Pack.find().populate('courses', 'title price thumbnailUrl').lean();
    return NextResponse.json(packs);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener packs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    await connectToDatabase();
    const data = await request.json();
    if (!data.name || !data.description || !data.price || !data.originalPrice || !Array.isArray(data.courses) || data.courses.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    const newPack = await Pack.create({
      name: data.name,
      description: data.description,
      price: data.price,
      originalPrice: data.originalPrice,
      courses: data.courses,
      imageUrl: data.imageUrl || '',
      active: true
    });
    return NextResponse.json(newPack, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear el pack' }, { status: 500 });
  }
} 