import Image from 'next/image';

type CertificateCardProps = {
  id: string;
  courseTitle: string;
  issueDate: string;
  certificateUrl?: string;
  onDownload: (id: string) => void;
};

export default function CertificateCard({
  id,
  courseTitle,
  issueDate,
  certificateUrl,
  onDownload
}: CertificateCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-[#2A2A3C] rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#4CAF50] rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{courseTitle}</h3>
            <p className="text-sm text-[#B4B4C0]">Emitido el: {formatDate(issueDate)}</p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onDownload(id)}
            className="px-4 py-2 bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] transition-colors duration-200 text-sm font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
} 