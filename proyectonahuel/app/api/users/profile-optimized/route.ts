import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Progress from '@/models/Progress';
import Payment from '@/models/Payment';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('❌ API Profile: No hay sesión o email');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('🔍 API Profile: Sesión encontrada para email:', session.user.email);

    await connectToDatabase();

    // Single optimized query with aggregation pipeline
    const [profileResult] = await User.aggregate([
      { 
        $match: { email: session.user.email } 
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'courses',
          foreignField: '_id',
          as: 'enrolledCoursesData'
        }
      },
      {
        $lookup: {
          from: 'progresses',
          localField: '_id',
          foreignField: 'userId',
          as: 'progressData'
        }
      },
      {
        $lookup: {
          from: 'certificates',
          localField: '_id',
          foreignField: 'userId',
          as: 'certificatesData'
        }
      }
    ]);

    if (!profileResult) {
      console.log('❌ API Profile: Usuario no encontrado para email:', session.user.email);
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    console.log('✅ API Profile: Usuario encontrado:', {
      email: profileResult.email,
      name: profileResult.name,
      role: profileResult.role
    });

    // Validación adicional: asegurar que el email coincide
    if (profileResult.email !== session.user.email) {
      console.error('🚨 API Profile: MISMATCH DE EMAILS!', {
        sessionEmail: session.user.email,
        profileEmail: profileResult.email
      });
      return NextResponse.json({ error: 'Error de datos de usuario' }, { status: 500 });
    }

    // Process active courses with progress
    const activeCourses = profileResult.enrolledCoursesData.map((course: any) => {
      const progress = profileResult.progressData.find((p: any) => 
        p.courseId.toString() === course._id.toString()
      );
      
      return {
        id: course._id.toString(),
        title: course.title,
        progress: progress ? progress.totalProgress : 0,
        startDate: progress?.startDate || course.createdAt,
        lastUpdate: progress?.lastUpdate || progress?.updatedAt || course.updatedAt,
        thumbnailUrl: course.thumbnailUrl,
        totalLessons: course.videos?.length || 0,
        completedLessons: progress?.videoProgress?.filter((v: any) => v.completed)?.length || 0,
        isCompleted: progress?.isCompleted || false
      };
    });

    // Process certificates
    const certificates = profileResult.certificatesData.map((cert: any) => {
      const course = profileResult.enrolledCoursesData.find((c: any) => 
        c._id.toString() === cert.courseId.toString()
      );
      
      return {
        id: cert._id.toString(),
        courseTitle: course?.title || 'Curso no encontrado',
        issueDate: cert.issueDate,
        certificateUrl: cert.certificateUrl
      };
    });

    // Calculate stats - count completed courses from progress data
    const completedCourses = profileResult.progressData.filter((p: any) => p.isCompleted).length;
    
    const stats = {
      totalCourses: profileResult.enrolledCoursesData.length,
      completedCourses: completedCourses,
      certificatesEarned: certificates.length,
      totalHoursLearned: activeCourses.reduce((total: number, course: any) => {
        const hours = Math.floor((course.progress / 100) * (course.totalLessons * 0.5));
        return total + hours;
      }, 0)
    };

    // Admin stats with REAL sales data
    let adminStats = null;
    if (profileResult.role === 'admin') {
      // Get real sales data from Payment model
      const [salesData] = await Payment.aggregate([
        {
          $facet: {
            totalSalesData: [
              { $match: { status: 'approved' } },
              { $group: { _id: null, total: { $sum: '$amount' } } }
            ],
            monthlySalesData: [
              {
                $match: {
                  status: 'approved',
                  paymentDate: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    $lte: new Date()
                  }
                }
              },
              { $group: { _id: null, total: { $sum: '$amount' } } }
            ]
          }
        }
      ]);

      // Get user and course counts
      const [userCount, courseCount] = await Promise.all([
        User.countDocuments(),
        Course.countDocuments()
      ]);

      adminStats = {
        totalUsers: userCount,
        totalCourses: courseCount,
        totalSales: salesData.totalSalesData[0]?.total || 0,
        monthlySales: salesData.monthlySalesData[0]?.total || 0
      };
    }

    // Create purchases from course data (no additional query needed)
    const purchases = profileResult.enrolledCoursesData.map((course: any) => ({
      id: course._id.toString(),
      courseTitle: course.title,
      date: course.createdAt,
      paymentMethod: 'Compra en plataforma',
      amount: course.price || 0
    }));

    const response = {
      user: {
        name: profileResult.name,
        email: profileResult.email,
        image: profileResult.image,
        role: profileResult.role,
        registrationDate: profileResult.createdAt,
        lastLogin: profileResult.lastLogin || profileResult.updatedAt
      },
      activeCourses,
      certificates,
      purchases,
      stats,
      adminStats,
      timestamp: Date.now() // For caching
    };

    console.log('✅ API Profile: Enviando respuesta para:', response.user.email);

    // VALIDACIÓN FINAL: Asegurar que la respuesta corresponde al usuario de la sesión
    if (response.user.email !== session.user.email) {
      console.error('🚨 RESPUESTA CON EMAIL INCORRECTO:', {
        sessionEmail: session.user.email,
        responseEmail: response.user.email
      });
      return NextResponse.json({ error: 'Error crítico de datos de usuario' }, { status: 500 });
    }

    // Desactivar completamente el caché del navegador
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });
    
  } catch (error) {
    console.error('❌ Error in profile-optimized API:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 