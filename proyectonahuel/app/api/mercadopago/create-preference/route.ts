import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import mercadopago from 'mercadopago';
import Course from '@/models/Course';
import { connectToDB } from '@/lib/database';

// Configurar MercadoPago con la clave de acceso
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN as string
});

export async function POST(request: Request) {
  try {
    // Conectar a la base de datos
    await connectToDB();

    // Verificar que el usuario esté autenticado
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener los datos del cuerpo de la solicitud
    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'ID del curso requerido' }, { status: 400 });
    }

    // Obtener el curso de la base de datos
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Calcular el precio final (con descuento si está en oferta)
    const finalPrice = course.onSale && course.discountPercentage > 0
      ? course.price - (course.price * (course.discountPercentage / 100))
      : course.price;

    // Crear la preferencia de pago
    const preference = {
      items: [
        {
          id: courseId,
          title: course.title,
          description: course.description.substring(0, 255), // Limitamos la descripción a 255 caracteres
          unit_price: finalPrice,
          quantity: 1,
          currency_id: 'ARS', // Moneda Argentina
          category_id: 'education',
        }
      ],
      payer: {
        name: session.user.name || 'Usuario',
        email: session.user.email || 'usuario@example.com',
        identification: {
          type: 'DNI',
          number: '00000000' // Esto debería ser proporcionado por el usuario
        }
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/compra/exitosa?course_id=${courseId}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/compra/fallida?course_id=${courseId}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/compra/pendiente?course_id=${courseId}`
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
      external_reference: `${courseId}-${session.user.id}`, // Referencia para identificar la compra
      statement_descriptor: 'Curso Online',
      payment_methods: {
        excluded_payment_types: [
          {
            id: 'cash' // Excluimos pago en efectivo
          }
        ],
        installments: 3 // Permitimos hasta 3 cuotas
      }
    };

    // Crear la preferencia en MercadoPago
    const response = await mercadopago.preferences.create(preference);

    // Retornar la respuesta con la URL de pago
    return NextResponse.json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point
    });
  } catch (error) {
    console.error('Error al crear preferencia de MercadoPago:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
} 