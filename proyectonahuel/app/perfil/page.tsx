import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import MakeAdminButton from "@/components/MakeAdminButton";
import Image from "next/image";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  // Redirigir a inicio de sesión si no hay sesión
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Mi Perfil</h1>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header del perfil */}
          <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "Usuario"}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-semibold">
                  {session.user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{session.user.name}</h2>
                <p className="text-gray-600">{session.user.email}</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    session.user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.user.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contenido del perfil */}
          <div className="px-6 py-5 sm:px-8 sm:py-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Información de la cuenta</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Información básica sobre tu cuenta y preferencias.
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-5">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                    <dd className="mt-1 text-sm text-gray-900">{session.user.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Correo electrónico</dt>
                    <dd className="mt-1 text-sm text-gray-900">{session.user.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Rol</dt>
                    <dd className="mt-1 text-sm text-gray-900">{session.user.role === 'admin' ? 'Administrador' : 'Usuario'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">ID de usuario</dt>
                    <dd className="mt-1 text-sm text-gray-900">{session.user.id || 'No disponible'}</dd>
                  </div>
                </dl>
              </div>
              
              {/* Botón para convertirse en administrador */}
              <MakeAdminButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 