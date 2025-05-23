import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Progress from '@/models/Progress';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    console.log('API: Iniciando solicitud GET /api/users');
    
    const session = await getServerSession(authOptions);
    console.log('API: Sesión del usuario:', session ? `Email: ${session.user?.email}` : 'No hay sesión');
    
    // Verificar si el usuario está autenticado
    if (!session?.user?.email) {
      console.log('API: Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autorizado. Debe iniciar sesión para acceder a estos datos.' },
        { status: 401 }
      );
    }
    
    try {
      await connectToDatabase();
      console.log('API: Conexión a la base de datos establecida');
    } catch (dbError) {
      console.error('API: Error al conectar a la base de datos:', dbError);
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos. Por favor, intente nuevamente más tarde.' },
        { status: 500 }
      );
    }
    
    try {
      const currentUser = await User.findOne({ email: session.user.email });
      console.log('API: Usuario actual encontrado:', currentUser ? `ID: ${currentUser._id}, Rol: ${currentUser.role}` : 'No encontrado');
      
      // Verificar si el usuario es administrador
      if (!currentUser) {
        console.log('API: Usuario no encontrado en la base de datos');
        return NextResponse.json(
          { error: 'Usuario no encontrado en la base de datos.' },
          { status: 404 }
        );
      }
      
      if (currentUser.role !== 'admin') {
        console.log('API: Usuario no es administrador');
        return NextResponse.json(
          { error: 'No tienes permisos para ver esta información. Se requiere rol de administrador.' },
          { status: 403 }
        );
      }
      
      // Obtener todos los usuarios
      const usersData = await User.find({}).lean();
      console.log(`API: Se encontraron ${usersData.length} usuarios`);
      
      // Obtener todos los cursos para mapear IDs a nombres
      const courses = await Course.find({}).lean();
      console.log(`API: Se encontraron ${courses.length} cursos`);
      
      const coursesMap = new Map(courses.map(course => {
        const courseId = course._id as mongoose.Types.ObjectId;
        return [courseId.toString(), course];
      }));
      
      // Obtener progreso de cursos para todos los usuarios
      const progressRecords = await Progress.find({}).lean();
      console.log(`API: Se encontraron ${progressRecords.length} registros de progreso`);
      
      const progressMap = new Map();
      
      progressRecords.forEach(record => {
        const userId = record.userId as mongoose.Types.ObjectId;
        const courseId = record.courseId as mongoose.Types.ObjectId;
        const userIdStr = userId.toString();
        const courseIdStr = courseId.toString();
        
        if (!progressMap.has(userIdStr)) {
          progressMap.set(userIdStr, new Map());
        }
        progressMap.get(userIdStr).set(courseIdStr, {
          totalProgress: record.totalProgress,
          isCompleted: record.isCompleted,
          completedAt: record.completedAt
        });
      });
      
      // Formatear la respuesta
      const users = await Promise.all(usersData.map(async (user) => {
        // Obtener detalles de los cursos del usuario
        const userCourses = (user.courses || []).map((courseId: mongoose.Types.ObjectId) => {
          const courseIdStr = courseId.toString();
          const courseInfo = coursesMap.get(courseIdStr);
          
          // Obtener el progreso del curso para este usuario
          const userId = user._id as mongoose.Types.ObjectId;
          const userIdStr = userId.toString();
          const userProgress = progressMap.has(userIdStr) 
            ? progressMap.get(userIdStr).get(courseIdStr) 
            : null;
          
          return courseInfo ? {
            id: courseIdStr,
            title: courseInfo.title,
            price: courseInfo.price,
            progress: userProgress ? userProgress.totalProgress : 0,
            isCompleted: userProgress ? userProgress.isCompleted : false,
            completedAt: userProgress ? userProgress.completedAt : null,
            purchaseDate: null // No tenemos esta información en el modelo actual
          } : null;
        }).filter(Boolean);
        
        const userId = user._id as mongoose.Types.ObjectId;
        
        return {
          id: userId.toString(),
          name: user.name || 'Usuario sin nombre',
          email: user.email,
          image: user.image,
          role: user.role || 'user',
          isActive: true, // Esto deberías determinarlo basado en tus reglas de negocio
          courses: userCourses,
          createdAt: user.createdAt
        };
      }));
      
      console.log(`API: Respuesta formateada con ${users.length} usuarios`);
      return NextResponse.json({ users });
      
    } catch (dataError) {
      console.error('API: Error al procesar los datos:', dataError);
      return NextResponse.json(
        { error: 'Error al procesar los datos de usuarios.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API: Error general al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 