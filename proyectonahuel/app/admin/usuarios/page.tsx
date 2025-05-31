import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import { connectToDatabase } from "@/lib/mongodb";
import User from '@/models/User';
import UsersTable from './components/UsersTable';
import AssignCourseButton from '@/components/AssignCourseButton';
import AssignPackButton from '@/components/AssignPackButton';

// Esta función verificará si el usuario actual es administrador
async function getAdminStatus() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;
  
  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email });
  return user?.role === 'admin';
}

export default async function AdminUsersPage() {
  const isAdmin = await getAdminStatus();
  
  // Si no es administrador, redirigir a la página principal
  if (!isAdmin) {
    redirect('/');
  }
  
  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--neutral-100)]">
            Administración de Usuarios
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Gestiona los usuarios de la plataforma, sus roles y cursos adquiridos
          </p>
        </div>
        
        {/* Botones para asignar cursos y packs */}
        <div className="mb-6 flex gap-4">
          <AssignCourseButton />
          <AssignPackButton />
        </div>
        
        {/* Componente Cliente para la tabla de usuarios con filtros y ordenación */}
        <UsersTable />
      </div>
    </div>
  );
} 