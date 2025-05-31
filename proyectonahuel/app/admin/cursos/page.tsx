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
    image: string;
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
    const courses = await Course.find({}).sort({ createdAt: -1 }).populate('createdBy', 'name image').lean();
    
    return courses.map((course: any) => ({
      ...course,
      _id: course._id ? course._id.toString() : '',
      createdBy: {
        ...course.createdBy,
        _id: course.createdBy && course.createdBy._id ? course.createdBy._id.toString() : '',
        name: course.createdBy?.name || '',
        image: course.createdBy?.image || ''
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--neutral-900)] font-semibold shadow hover:bg-[var(--accent-dark)] transition-colors border border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
          >
            + Crear nuevo curso
          </Link>
        </div>
        
        {courses.length === 0 ? (
          <div className="bg-[var(--neutral-900)] shadow-lg rounded-xl p-10 text-center border border-[var(--neutral-800)]">
            <p className="text-[var(--neutral-400)] mb-4">No hay cursos disponibles.</p>
            <Link
              href="/admin/cursos/nuevo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--neutral-900)] font-semibold shadow hover:bg-[var(--accent-dark)] transition-colors border border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
            >
              Crear el primer curso
            </Link>
          </div>
        ) : (
          <div className="bg-[var(--neutral-950)] shadow-xl rounded-xl border border-[var(--neutral-800)] overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--neutral-800)]">
              <thead className="bg-[var(--neutral-900)]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[var(--neutral-400)] uppercase tracking-wider">
                    Curso
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[var(--neutral-400)] uppercase tracking-wider">
                    Precio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[var(--neutral-400)] uppercase tracking-wider">
                    Instructor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[var(--neutral-400)] uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[var(--neutral-400)] uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[var(--neutral-950)] divide-y divide-[var(--neutral-800)]">
                {courses.map((course) => (
                  <tr key={course._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 relative">
                          {course.thumbnailUrl ? (
                            <Image
                              src={course.thumbnailUrl}
                              alt={course.title}
                              fill
                              className="rounded-md object-cover border border-[var(--neutral-800)] bg-[var(--neutral-900)]"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-[var(--neutral-800)] rounded-md flex items-center justify-center border border-[var(--neutral-700)]">
                              <span className="text-[var(--neutral-500)] text-xs">Sin img</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 min-w-0">
                          <div className="text-base font-semibold text-[var(--neutral-100)] truncate max-w-xs">
                            {course.title}
                          </div>
                          <div className="text-xs text-[var(--neutral-400)] truncate max-w-xs">
                            {course.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--neutral-100)] font-medium">${course.price.toFixed(2)}</div>
                      {course.onSale && (
                        <div className="flex items-center mt-1">
                          <span className="bg-red-900 text-red-200 text-xs px-2 py-0.5 rounded-full">
                            {course.discountPercentage}% desc.
                          </span>
                          <span className="text-green-400 text-xs ml-2 font-semibold">
                            ${(course.price - (course.price * (course.discountPercentage / 100))).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--neutral-300)] font-medium">{course.createdBy.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {course.featured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-blue-200">
                            Destacado
                          </span>
                        )}
                        {course.onSale && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-900 text-red-200">
                            Oferta
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Link 
                          href={`/cursos/${course._id}`} 
                          className="px-3 py-1 rounded-md bg-[var(--neutral-800)] text-[var(--accent)] text-xs font-semibold hover:bg-[var(--accent)] hover:text-[var(--neutral-950)] border border-[var(--accent)] transition-colors"
                        >
                          Ver
                        </Link>
                        <Link 
                          href={`/admin/cursos/editar/${course._id}`} 
                          className="px-3 py-1 rounded-md bg-[var(--neutral-800)] text-blue-300 text-xs font-semibold hover:bg-blue-700 hover:text-white border border-blue-700 transition-colors"
                        >
                          Editar
                        </Link>
                        <Link 
                          href={`/admin/cursos/eliminar/${course._id}`} 
                          className="px-3 py-1 rounded-md bg-[var(--neutral-800)] text-red-300 text-xs font-semibold hover:bg-red-800 hover:text-white border border-red-800 transition-colors"
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