import { connectDB } from '@/lib/mongodb';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import User from '@/models/User';
import { notFound } from 'next/navigation';

interface CertificatePageProps {
  params: {
    id: string;
  };
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(date).toLocaleDateString('es-ES', options);
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const certificateId = params.id;
  
  if (!certificateId) {
    notFound();
  }
  
  // Conectar a la base de datos
  await connectDB();
  
  // Buscar el certificado
  const progress = await Progress.findOne({
    certificateId: certificateId,
    certificateIssued: true
  });
  
  if (!progress) {
    notFound();
  }
  
  // Obtener detalles del usuario y curso
  const [user, course] = await Promise.all([
    User.findById(progress.userId),
    Course.findById(progress.courseId)
  ]);
  
  if (!user || !course) {
    notFound();
  }
  
  // Fecha de emisión
  const issueDate = progress.completedAt || progress.updatedAt;
  
  return (
    <div className="flex flex-col items-center py-12 px-4">
      {/* Botón para imprimir */}
      <div className="mb-8 flex justify-center">
        <button 
          onClick={() => window.print()} 
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-md flex items-center print:hidden"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir certificado
        </button>
      </div>
      
      {/* Certificado */}
      <div className="w-full max-w-5xl aspect-[1.4/1] bg-white text-black relative border-8 border-blue-500 shadow-xl print:shadow-none">
        <div className="border-2 border-green-500 m-3 h-[calc(100%-24px)] flex flex-col items-center justify-between p-16">
          {/* Encabezado */}
          <div className="text-center pt-10">
            <h1 className="text-5xl font-bold text-gray-800">CERTIFICADO</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mt-2">DE FINALIZACIÓN</h2>
            <div className="w-40 h-1 bg-blue-500 mx-auto mt-4"></div>
          </div>
          
          {/* Contenido */}
          <div className="text-center space-y-10 flex-grow flex flex-col justify-center">
            <div>
              <p className="text-xl text-gray-700">Este certificado se otorga a:</p>
              <h2 className="text-4xl font-bold text-gray-900 mt-3">{user.name}</h2>
            </div>
            
            <div>
              <p className="text-xl text-gray-700">Por haber completado con éxito el curso:</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-3">{course.title}</h3>
            </div>
          </div>
          
          {/* Pie de página */}
          <div className="text-center space-y-4 pb-10">
            <p className="text-lg text-gray-700">
              Emitido el {formatDate(issueDate)}
            </p>
            <p className="text-sm text-gray-600">
              ID del certificado: {certificateId}
            </p>
            <p className="text-xs text-gray-500">
              Verifica la autenticidad de este certificado en: 
              proyectonahuel.vercel.app/certificados/verificar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 