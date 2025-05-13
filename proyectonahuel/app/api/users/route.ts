import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Progress from '@/models/Progress';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const currentUser = await User.findOne({ email: session.user.email });
    
    // Verificar si el usuario es administrador
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta información' },
        { status: 403 }
      );
    }
    
    // Obtener todos los usuarios
    const usersData = await User.find({}).lean();
    
    // Obtener todos los cursos para mapear IDs a nombres
    const courses = await Course.find({}).lean();
    const coursesMap = new Map(courses.map(course => {
      const courseId = course._id as mongoose.Types.ObjectId;
      return [courseId.toString(), course];
    }));
    
    // Obtener progreso de cursos para todos los usuarios
    const progressRecords = await Progress.find({}).lean();
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
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 