import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import Pack from '@/models/Pack';
import User from '@/models/User';
import { connectToDB } from '@/lib/database';

// Configurar MercadoPago con la clave de acceso
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string 
});

export async function POST(request: Request) {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { packId } = await request.json();
    if (!packId) {
      return NextResponse.json({ error: 'ID del pack requerido' }, { status: 400 });
    }
    
    // Obtener pack con sus cursos (incluyendo precios)
    const pack = await Pack.findById(packId).populate('courses', 'title price');
    if (!pack) {
      return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 });
    }
    
    // Verificar elegibilidad del usuario
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    // Verificar si el usuario ya tiene algún curso del pack
    const userCourseIds = user.courses.map((id: any) => id.toString());
    
    // Encontrar cursos que ya posee y cursos que necesita comprar
    const ownedCourses = pack.courses.filter((course: any) => 
      userCourseIds.includes(course._id.toString())
    );
    
    const coursesToBuy = pack.courses.filter((course: any) => 
      !userCourseIds.includes(course._id.toString())
    );
    
    // Si ya tiene todos los cursos del pack
    if (coursesToBuy.length === 0) {
      return NextResponse.json({ 
        error: 'Ya tenés acceso a todos los cursos incluidos en este pack.' 
      }, { status: 400 });
    }
    
    // NUEVA LÓGICA DE PRECIOS:
    // 1. Calcular precio total de todos los cursos
    const totalCoursesPrice = pack.courses.reduce((sum: number, course: any) => sum + course.price, 0);
    
    // 2. Aplicar 10% de descuento al total
    const packBasePrice = Math.round(totalCoursesPrice * 0.9); // 10% descuento
    
    // 3. Calcular precio de cursos que ya tiene el usuario
    const ownedCoursesPrice = ownedCourses.reduce((sum: number, course: any) => sum + course.price, 0);
    
    // 4. Precio final = Precio base del pack - Precio de cursos que ya tiene
    const finalPrice = packBasePrice - ownedCoursesPrice;
    
    // Información para mostrar al usuario
    const packInfo = {
      totalCoursesPrice: totalCoursesPrice,
      packBasePrice: packBasePrice, // Con 10% descuento
      ownedCoursesPrice: ownedCoursesPrice,
      finalPrice: finalPrice,
      discountFromCourses: totalCoursesPrice - packBasePrice, // Descuento del 10%
      discountFromOwned: ownedCoursesPrice, // Descuento por cursos que ya tiene
      totalDiscount: (totalCoursesPrice - finalPrice),
      ownedCourses: ownedCourses.map((c: any) => ({ title: c.title, price: c.price })),
      coursesToBuy: coursesToBuy.map((c: any) => ({ title: c.title, price: c.price })),
      discountReason: ownedCourses.length > 0 
        ? `Descuento pack (10%) + Ya tenés ${ownedCourses.length} curso${ownedCourses.length !== 1 ? 's' : ''}`
        : 'Descuento pack (10%)'
    };
    
    // Crear la preferencia de pago para el pack
    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: [
          {
            id: packId,
            title: pack.name,
            description: pack.description.substring(0, 255),
            unit_price: finalPrice,
            quantity: 1,
            currency_id: 'ARS',
          }
        ],
        payer: {
          email: user.email,
          name: user.name
        },
        external_reference: `pack_${packId}_${user._id}`,
        statement_descriptor: 'NahuelCursos',
        back_urls: {
          success: `${process.env.NEXTAUTH_URL}/compra/exito`,
          failure: `${process.env.NEXTAUTH_URL}/compra/error`,
          pending: `${process.env.NEXTAUTH_URL}/compra/pendiente`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXTAUTH_URL}/api/mercadopago/webhook`,
        metadata: {
          pack_id: packId,
          user_id: user._id.toString(),
          original_price: totalCoursesPrice,
          adjusted_price: finalPrice,
          owned_courses: ownedCourses.length,
          courses_to_buy: coursesToBuy.length,
        }
      }
    });

    return NextResponse.json({
      preferenceId: response.id,
      packInfo,
      message: ownedCourses.length > 0 
        ? `Precio ajustado: ya tenés ${ownedCourses.length} curso${ownedCourses.length !== 1 ? 's' : ''} del pack`
        : null
    });
  } catch (error) {
    console.error('Error al crear preferencia de MercadoPago para pack:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
} 