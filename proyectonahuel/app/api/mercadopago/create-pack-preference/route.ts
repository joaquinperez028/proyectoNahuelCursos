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
    
    // Obtener pack con sus cursos
    const pack = await Pack.findById(packId).populate('courses', 'title');
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
    const packCourseIds = pack.courses.map((course: any) => course._id.toString());
    
    // Encontrar cursos que ya posee
    const ownedCourses = pack.courses.filter((course: any) => 
      userCourseIds.includes(course._id.toString())
    );
    
    if (ownedCourses.length > 0) {
      return NextResponse.json({ 
        error: `No puedes comprar este pack porque ya tienes acceso a: ${ownedCourses.map((c: any) => c.title).join(', ')}` 
      }, { status: 400 });
    }
    
    // Crear la preferencia de pago para el pack
    const preferenceData = {
      items: [
        {
          id: packId,
          title: pack.name,
          description: pack.description.substring(0, 255),
          unit_price: pack.price,
          quantity: 1,
          currency_id: 'ARS',
          category_id: 'education',
        }
      ],
      payer: {
        name: session.user.name || 'Usuario',
        email: session.user.email || 'usuario@example.com',
        identification: {
          type: 'DNI',
          number: '00000000'
        }
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/compra/exitosa?pack_id=${packId}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/compra/fallida?pack_id=${packId}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/compra/pendiente?pack_id=${packId}`
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
      external_reference: `pack-${packId}-${session.user.id}`,
      statement_descriptor: 'Pack Cursos',
      payment_methods: {
        excluded_payment_types: [
          { id: 'cash' }
        ],
        installments: 3
      }
    };
    const preference = new Preference(client);
    const response = await preference.create({ body: preferenceData });
    return NextResponse.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    });
  } catch (error) {
    console.error('Error al crear preferencia de MercadoPago para pack:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
} 