import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Progress from '@/models/Progress';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await connectToDatabase();

    // Single aggregation query to get ALL profile data at once
    const profilePipeline = [
      {
        $match: { email: session.user.email }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'courses',
          foreignField: '_id',
          as: 'enrolledCourses',
          pipeline: [
            {
              $project: {
                title: 1,
                thumbnailUrl: 1,
                price: 1,
                createdAt: 1,
                updatedAt: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'progresses',
          let: { userId: '$_id', courseIds: '$courses' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $in: ['$courseId', '$$courseIds'] }
                  ]
                }
              }
            }
          ],
          as: 'progressData'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          image: 1,
          role: 1,
          createdAt: 1,
          lastLogin: 1,
          updatedAt: 1,
          enrolledCourses: 1,
          progressData: 1
        }
      }
    ];

    const [profileResult] = await User.aggregate(profilePipeline);
    
    if (!profileResult) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Process courses and progress in memory (super fast)
    const activeCourses = profileResult.enrolledCourses.map((course: any) => {
      const progress = profileResult.progressData.find((p: any) => 
        p.courseId.toString() === course._id.toString()
      );
      
      return {
        id: course._id.toString(),
        title: course.title,
        progress: progress?.totalProgress || 0,
        startDate: course.createdAt,
        lastUpdate: progress?.updatedAt || course.updatedAt,
        thumbnailUrl: course.thumbnailUrl
      };
    });

    // Process certificates
    const certificates = profileResult.progressData
      .filter((p: any) => p.certificateIssued && p.certificateUrl)
      .map((p: any) => {
        const course = profileResult.enrolledCourses.find((c: any) => 
          c._id.toString() === p.courseId.toString()
        );
        return {
          id: p.certificateId || p.courseId.toString(),
          courseTitle: course?.title || 'Curso',
          issueDate: p.completedAt || p.updatedAt,
          certificateUrl: p.certificateUrl
        };
      });

    // Calculate stats
    const stats = {
      totalCourses: activeCourses.length,
      completedCourses: certificates.length,
      certificatesEarned: certificates.length,
      totalHoursLearned: Math.round(
        activeCourses.reduce((acc: number, course: any) => acc + (course.progress / 100) * 20, 0)
      )
    };

    // Get admin stats only if needed (single aggregation)
    let adminStats = null;
    if (profileResult.role === 'admin') {
      const [adminData] = await User.aggregate([
        {
          $facet: {
            userCount: [{ $count: "total" }],
            courseCount: [
              { $lookup: { from: 'courses', pipeline: [{ $count: "total" }], as: 'courses' } },
              { $unwind: '$courses' },
              { $replaceRoot: { newRoot: '$courses' } }
            ]
          }
        }
      ]);

      adminStats = {
        totalUsers: adminData.userCount[0]?.total || 0,
        totalCourses: adminData.courseCount[0]?.total || 0,
        totalSales: 0, // Implementar según modelo de ventas
        monthlySales: 0
      };
    }

    // Create purchases from course data (no additional query needed)
    const purchases = profileResult.enrolledCourses.map((course: any) => ({
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

    // Set aggressive caching headers
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5min cache, 10min stale
      },
    });
    
  } catch (error) {
    console.error('Error en profile-optimized API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 