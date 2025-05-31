import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import Pack from '@/models/Pack';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ hasDiscount: false });
    }

    await connectToDatabase();
    
    const { packId } = await request.json();
    if (!packId) {
      return NextResponse.json({ error: 'Pack ID requerido' }, { status: 400 });
    }

    // Obtener pack con sus cursos
    const pack = await Pack.findById(packId).populate('courses', '_id title');
    if (!pack) {
      return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 });
    }

    // Obtener usuario
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ hasDiscount: false });
    }

    // Verificar qué cursos del pack ya tiene el usuario
    const userCourseIds = user.courses.map((id: any) => id.toString());
    const packCourseIds = pack.courses.map((course: any) => course._id.toString());
    
    const ownedCourses = pack.courses.filter((course: any) => 
      userCourseIds.includes(course._id.toString())
    );
    
    const coursesToBuy = pack.courses.filter((course: any) => 
      !userCourseIds.includes(course._id.toString())
    );

    // Si no tiene ningún curso del pack, no hay descuento
    if (ownedCourses.length === 0) {
      return NextResponse.json({ hasDiscount: false });
    }

    // Si ya tiene todos los cursos, no puede comprar el pack
    if (coursesToBuy.length === 0) {
      return NextResponse.json({ 
        hasDiscount: false,
        allCoursesOwned: true,
        message: 'Ya tenés todos los cursos de este pack'
      });
    }

    // Calcular precio ajustado
    const totalCourses = pack.courses.length;
    const coursesToBuyCount = coursesToBuy.length;
    const adjustedPrice = Math.round((coursesToBuyCount / totalCourses) * pack.price);
    const discount = pack.price - adjustedPrice;

    return NextResponse.json({
      hasDiscount: true,
      originalPrice: pack.price,
      adjustedPrice: adjustedPrice,
      discount: discount,
      discountPercentage: Math.round((discount / pack.price) * 100),
      ownedCourses: ownedCourses.map((c: any) => ({
        _id: c._id,
        title: c.title
      })),
      coursesToBuy: coursesToBuy.map((c: any) => ({
        _id: c._id,
        title: c.title
      })),
      message: `Ya tenés ${ownedCourses.length} de ${totalCourses} cursos. Precio ajustado: $${adjustedPrice / 100}`
    });

  } catch (error) {
    console.error('Error al verificar descuento del pack:', error);
    return NextResponse.json({ hasDiscount: false });
  }
} 