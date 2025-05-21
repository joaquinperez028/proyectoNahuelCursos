import { NextResponse } from "next/server";
import { connectToDatabase } from '@/lib/mongodb';
import Course from "@/models/Course";

// GET /api/courses/featured - Obtener cursos destacados
export async function GET() {
  try {
    await connectToDatabase();
    
    const featuredCourses = await Course.find({ featured: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .lean();
    
    return NextResponse.json(featuredCourses);
  } catch (error) {
    console.error('Error al obtener cursos destacados:', error);
    return NextResponse.json(
      { error: 'Error al obtener los cursos destacados' },
      { status: 500 }
    );
  }
} 