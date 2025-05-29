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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    console.log('📊 DEBUG - Profile Result:', {
      email: profileResult.email,
      coursesCount: profileResult.courses?.length || 0,
      enrolledCoursesDataCount: profileResult.enrolledCoursesData?.length || 0,
      progressDataCount: profileResult.progressData?.length || 0,
      certificatesDataCount: profileResult.certificatesData?.length || 0
    });

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

    console.log('📤 DEBUG - Final Response:', {
      userEmail: response.user.email,
      activeCoursesCount: response.activeCourses.length,
      certificatesCount: response.certificates.length,
      purchasesCount: response.purchases.length,
      stats: response.stats
    });

    // Set aggressive caching headers
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5min cache, 10min stale
      },
    });
    
  } catch (error) {
    console.error('Error in profile-optimized API:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 