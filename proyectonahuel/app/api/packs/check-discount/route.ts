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
    const pack = await Pack.findById(packId).populate('courses', '_id title price');
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
    
    const ownedCourses = pack.courses.filter((course: any) => 
      userCourseIds.includes(course._id.toString())
    );
    
    const coursesToBuy = pack.courses.filter((course: any) => 
      !userCourseIds.includes(course._id.toString())
    );

    // Si no tiene ningún curso del pack, no hay descuento adicional (solo el 10% del pack)
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

    // NUEVA LÓGICA DE PRECIOS:
    // 1. Calcular precio total de todos los cursos
    const totalCoursesPrice = pack.courses.reduce((sum: number, course: any) => sum + course.price, 0);
    
    // 2. Precio base del pack con 10% descuento
    const packBasePrice = Math.round(totalCoursesPrice * 0.9);
    
    // 3. Precio de cursos que ya tiene
    const ownedCoursesPrice = ownedCourses.reduce((sum: number, course: any) => sum + course.price, 0);
    
    // 4. Precio final = Precio base del pack - Precio de cursos que ya tiene
    let finalPrice = packBasePrice - ownedCoursesPrice;
    
    // 5. VALIDACIÓN: Evitar precios negativos o cero
    if (finalPrice <= 0) {
      finalPrice = Math.max(1, Math.round(packBasePrice * 0.1)); // Mínimo 10% del precio base o $1
    }
    
    // 6. Descuento total = Precio original - Precio final
    const totalDiscount = totalCoursesPrice - finalPrice;

    return NextResponse.json({
      hasDiscount: true,
      totalCoursesPrice: totalCoursesPrice,
      packBasePrice: packBasePrice,
      adjustedPrice: finalPrice,
      totalDiscount: totalDiscount,
      discountFromPack: totalCoursesPrice - packBasePrice, // 10% descuento
      discountFromOwned: ownedCoursesPrice, // Descuento por cursos ya poseídos
      discountPercentage: Math.round((totalDiscount / totalCoursesPrice) * 100),
      ownedCourses: ownedCourses.map((c: any) => ({
        _id: c._id,
        title: c.title,
        price: c.price
      })),
      coursesToBuy: coursesToBuy.map((c: any) => ({
        _id: c._id,
        title: c.title,
        price: c.price
      })),
      message: `Descuento del pack (10%) + Ya tenés ${ownedCourses.length} curso${ownedCourses.length !== 1 ? 's' : ''} por $${ownedCoursesPrice}`
    });

  } catch (error) {
    console.error('Error al verificar descuento del pack:', error);
    return NextResponse.json({ hasDiscount: false });
  }
} 