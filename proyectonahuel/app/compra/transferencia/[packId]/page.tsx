'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Pack {
  _id: string;
  name: string;
  price: number;
  originalPrice: number;
  imageUrl?: string;
  courses: { _id: string; title: string }[];
}

export default function TransferPaymentPackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const packId = params ? (params.packId as string) : '';

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pack, setPack] = useState<Pack | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountName: 'Nahuel Cursos SRL',
    accountNumber: '0000000000000000000000',
    bank: 'Banco Nacional',
    cbu: '0000000000000000000000',
    alias: 'NAHUEL.CURSOS'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPack = async () => {
      if (status !== 'authenticated' || !packId) return;
      try {
        const response = await fetch(`/api/packs/${packId}`);
        if (!response.ok) {
          throw new Error('No se pudo obtener la información del pack');
        }
        const data = await response.json();
        setPack(data);
      } catch (error) {
        setError('No se pudo cargar la información del pack');
      } finally {
        setLoading(false);
      }
    };
    fetchPack();
  }, [packId, status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Formato de archivo no válido. Por favor, sube un archivo JPG, PNG o PDF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. El tamaño máximo es 5MB');
      return;
    }
    setReceipt(file);
    setError(null);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setPreviewUrl('/pdf-icon.svg');
    } else {
      setPreviewUrl('/file-icon.svg');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt) {
      setError('Por favor, sube un comprobante de pago');
      return;
    }
    if (!session?.user?.id) {
      setError('No se pudo obtener la información del usuario');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', receipt);
      formData.append('packId', packId);
      formData.append('userId', session.user.id);
      formData.append('amount', (pack?.price || 0).toString());
      const response = await fetch('/api/payments/transfer', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al procesar el pago');
      }
      setSuccess(true);
      setTimeout(() => {
        router.push('/compra/pendiente?pack_id=' + packId);
      }, 3000);
    } catch (error) {
      setError('Ocurrió un error al procesar tu solicitud');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--neutral-50)] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="w-full max-w-3xl flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--neutral-50)] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6 text-[var(--success)] flex justify-center">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--neutral-800)] mb-4">¡Comprobante recibido!</h1>
          <p className="text-[var(--neutral-600)] mb-6">
            Tu comprobante ha sido enviado correctamente. Estamos procesando tu pago.
            Serás redirigido automáticamente...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--neutral-50)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--neutral-800)]">Pago por Transferencia</h1>
          <p className="mt-2 text-[var(--neutral-600)]">
            Complete el pago y suba el comprobante para acceder al pack
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {pack && (
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 relative h-48 md:h-auto">
                <Image 
                  src={pack.imageUrl || '/placeholder-course.jpg'} 
                  alt={pack.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 md:w-2/3">
                <h2 className="text-xl font-bold text-[var(--neutral-800)] mb-2">{pack.name}</h2>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-[var(--primary)]">${(pack.price / 100).toFixed(2)}</span>
                  <span className="ml-2 text-sm text-[var(--neutral-500)] line-through">
                    ${(pack.originalPrice / 100).toFixed(2)}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-sm text-[var(--neutral-700)] font-semibold">Cursos incluidos:</span>
                  <ul className="list-disc pl-5 text-[var(--neutral-700)] text-sm">
                    {pack.courses.map((c) => (
                      <li key={c._id}>{c.title}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          <h2 className="text-xl font-bold text-[var(--neutral-800)] mb-4">Datos Bancarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[var(--neutral-500)]">Nombre de la cuenta</p>
              <p className="font-medium text-[var(--neutral-800)]">{bankDetails.accountName}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">Banco</p>
              <p className="font-medium text-[var(--neutral-800)]">{bankDetails.bank}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">Número de cuenta</p>
              <p className="font-medium text-[var(--neutral-800)]">{bankDetails.accountNumber}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">CBU</p>
              <p className="font-medium text-[var(--neutral-800)]">{bankDetails.cbu}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">Alias</p>
              <p className="font-medium text-[var(--neutral-800)]">{bankDetails.alias}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-bold text-[var(--neutral-800)] mb-4">Subir Comprobante de Pago</h2>
          <div className="mb-6">
            <label className="block text-[var(--neutral-700)] text-sm font-medium mb-2">
              Comprobante de transferencia
            </label>
            <div className="border-2 border-dashed border-[var(--neutral-300)] rounded-lg p-6 text-center">
              <input
                type="file"
                id="receipt"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {receipt && previewUrl ? (
                <div className="mb-4">
                  {previewUrl.startsWith('data:image/') ? (
                    <div className="relative mx-auto h-48 w-64">
                      <Image
                        src={previewUrl}
                        alt="Vista previa del comprobante"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <svg className="h-16 w-16 text-[var(--neutral-400)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <p className="mt-2 text-sm font-medium text-[var(--neutral-700)]">Archivo PDF seleccionado</p>
                    </div>
                  )}
                  <p className="mt-2 text-sm text-[var(--neutral-600)]">
                    {receipt?.name} ({(receipt?.size || 0) / 1024 < 1000 
                      ? `${Math.round((receipt?.size || 0) / 1024)} KB` 
                      : `${(receipt?.size || 0) / 1024 / 1024 < 10 
                        ? ((receipt?.size || 0) / 1024 / 1024).toFixed(2) 
                        : Math.round((receipt?.size || 0) / 1024 / 1024)} MB`}
                  )
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setReceipt(null);
                      setPreviewUrl(null);
                    }}
                    className="mt-2 text-sm text-[var(--primary)] hover:text-[var(--primary-dark)]"
                  >
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                <>
                  <label
                    htmlFor="receipt"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <svg className="h-12 w-12 text-[var(--neutral-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-[var(--neutral-600)]">
                      <span className="font-medium text-[var(--primary)]">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-[var(--neutral-500)]">
                      JPG, PNG o PDF (máx. 5MB)
                    </p>
                  </label>
                </>
              )}
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">Recomendaciones para el comprobante:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Asegúrate de que se vea claramente la fecha y hora de la transferencia</li>
                <li>El monto debe coincidir exactamente con el precio del pack</li>
                <li>Incluye el número de transacción o comprobante completo</li>
                <li>La imagen debe ser nítida y legible</li>
              </ul>
            </div>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={!receipt || uploading}
            className={`flex-1 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white py-3 px-6 rounded-lg font-medium transition-all flex justify-center items-center 
              ${(!receipt || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : 'Enviar comprobante'}
          </button>
          <Link
            href={`/cursos/packs`}
            className="flex-1 bg-[var(--neutral-200)] hover:bg-[var(--neutral-300)] text-[var(--neutral-800)] py-3 px-6 rounded-lg font-medium transition-all text-center ml-4"
          >
            Cancelar
          </Link>
        </form>
      </div>
    </div>
  );
} 