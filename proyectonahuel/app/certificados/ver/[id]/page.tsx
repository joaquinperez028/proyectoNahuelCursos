import { connectDB } from '@/lib/mongodb';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import User from '@/models/User';
import { notFound } from 'next/navigation';
import CertificateClientWrapper from './CertificateClientWrapper';
import Link from 'next/link';

interface PageProps<T = {}> {
  params: Promise<T>;
}

interface CertificateParams {
  id: string;
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(date).toLocaleDateString('es-ES', options);
}

export default async function CertificatePage({ params }: PageProps<CertificateParams>) {
  const resolvedParams = await params;
  const certificateId = resolvedParams.id;
  
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
  
  // URL real de verificación
  const verificationUrl = "https://proyecto-nahuel-cursos-tn5c.vercel.app/certificados/verificar";
  
  return (
    <div className="flex flex-col items-center py-12 px-4">
      {/* ID del certificado y botón de verificación */}
      <div className="text-center mb-8 max-w-3xl w-full flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-400">ID del certificado: {certificateId}</p>
        <Link 
          href={verificationUrl}
          target="_blank" 
          className="px-4 py-2 bg-[#111827] border border-[#3CBFAE] text-[#3CBFAE] rounded-md hover:bg-[#1f2937] transition-colors text-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Verifica certificado
        </Link>
      </div>
      
      {/* Botón para imprimir (ahora dentro del wrapper cliente) */}
      <CertificateClientWrapper />
      
      {/* Certificado */}
      <div className="w-full max-w-3xl aspect-[4/3] bg-[#111827] text-white relative shadow-xl print:shadow-none rounded-lg overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-gradient-radial from-teal-500/30 to-transparent" />
        
        <div className="h-full flex flex-col items-center justify-between p-10 md:p-16 relative z-10">
          {/* Encabezado */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#3CBFAE] tracking-wider">
              CERTIFICADO DE
            </h1>
            <h2 className="text-4xl md:text-5xl font-bold text-[#3CBFAE] tracking-wider mt-2">
              FINALIZACIÓN
            </h2>
          </div>
          
          {/* Contenido */}
          <div className="text-center space-y-12 flex-grow flex flex-col justify-center w-full">
            <div>
              <p className="text-xl text-gray-400 uppercase tracking-wider mb-4">OTORGADO A</p>
              <div className="w-full border-b border-gray-500 py-2">
                <h2 className="text-3xl font-bold text-white">{user.name}</h2>
              </div>
            </div>
            
            <div>
              <p className="text-lg text-gray-300 italic">¡Por completar con éxito el curso!</p>
              <div className="w-full border-b border-gray-500 py-2 mt-4">
                <h3 className="text-xl font-semibold text-gray-100">{course.title}</h3>
              </div>
            </div>
          </div>
          
          {/* Firma y fecha */}
          <div className="flex items-center justify-between w-full mt-10">
            <div className="text-sm text-gray-400">
              Emitido el {formatDate(issueDate)}
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-2 border-[#3CBFAE] flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-lg italic font-signature">Nahuel Cursos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 