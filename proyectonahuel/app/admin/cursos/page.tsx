import { connectToDatabase } from "@/lib/mongodb";
import Course from "@/models/Course";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const dynamic = 'force-dynamic';

// Definir una interfaz para el curso
interface CourseType {
  _id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl?: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  onSale: boolean;
  discountPercentage: number;
  featured: boolean;
}

async function getAdminStatus() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

async function getCourses(): Promise<CourseType[]> {
  try {
    await connectToDatabase();
    const courses = await Course.find({}).sort({ createdAt: -1 }).populate('createdBy', 'name').lean();
    
    return courses.map((course: any) => ({
      ...course,
      _id: course._id ? course._id.toString() : '',
      createdBy: {
        ...course.createdBy,
        _id: course.createdBy && course.createdBy._id ? course.createdBy._id.toString() : '',
        name: course.createdBy?.name || ''
      },
      title: course.title || '',
      description: course.description || '',
      price: course.price || 0,
      thumbnailUrl: course.thumbnailUrl || '',
      createdAt: course.createdAt ? new Date(course.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: course.updatedAt ? new Date(course.updatedAt).toISOString() : new Date().toISOString(),
      onSale: course.onSale || false,
      discountPercentage: course.discountPercentage || 0,
      featured: course.featured || false,
    }));
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return [];
  }
}

export default async function AdminCoursesPage() {
  const isAdmin = await getAdminStatus();
  
  if (!isAdmin) {
    redirect('/');
  }
  
  const courses = await getCourses();
  
  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[var(--neutral-100)]">
            Administración de Cursos
          </h1>
          <Link
            href="/admin/cursos/nuevo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            + Crear nuevo curso
          </Link>
        </div>
        
        {courses.length === 0 ? (
          <div className="bg-white shadow overflow-hidden rounded-lg p-10 text-center">
            <p className="text-gray-500 mb-4">No hay cursos disponibles.</p>
            <Link
              href="/admin/cursos/nuevo"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Crear el primer curso
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Curso
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          {course.thumbnailUrl ? (
                            <Image
                              src={course.thumbnailUrl}
                              alt={course.title}
                              fill
                              className="rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-gray-500 text-xs">Sin img</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {course.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {course.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--neutral-200)]">${course.price.toFixed(2)}</div>
                      {course.onSale && (
                        <div className="flex items-center mt-1">
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                            {course.discountPercentage}% descuento
                          </span>
                          <span className="text-green-600 text-xs ml-2">
                            ${(course.price - (course.price * (course.discountPercentage / 100))).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--neutral-200)]">{course.createdBy.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {course.featured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Destacado
                          </span>
                        )}
                        {course.onSale && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Oferta
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/cursos/${course._id}`} 
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          Ver
                        </Link>
                        <Link 
                          href={`/admin/cursos/editar/${course._id}`} 
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Editar
                        </Link>
                        <Link 
                          href={`/admin/cursos/eliminar/${course._id}`} 
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Eliminar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 