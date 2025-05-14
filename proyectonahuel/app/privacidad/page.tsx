'use client';

import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="bg-[var(--card)] p-6 sm:p-8 rounded-lg shadow-lg border border-[var(--border)]">
        <h1 className="text-3xl font-bold text-[var(--neutral-100)] sm:text-4xl mb-8">
          Política de privacidad
        </h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              1. Introducción
            </h2>
            <p className="text-[var(--neutral-300)]">
              En nuestra plataforma, respetamos tu privacidad y estamos comprometidos a proteger tus datos personales. 
              Esta política explica cómo recopilamos, utilizamos y protegemos tu información.
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              2. Datos Recopilados
            </h2>
            <ul className="space-y-2 text-[var(--neutral-300)]">
              <li>Información personal (nombre, email, teléfono) al momento del registro.</li>
              <li>Datos de pago para procesar transacciones de forma segura.</li>
              <li>Información sobre tu navegación en la plataforma para mejorar la experiencia.</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              3. Uso de la Información
            </h2>
            <ul className="space-y-2 text-[var(--neutral-300)]">
              <li>Procesar inscripciones y pagos.</li>
              <li>Enviar notificaciones sobre el progreso de los cursos.</li>
              <li>Mejorar los servicios y ofrecer soporte personalizado.</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              4. Compartición de Datos
            </h2>
            <p className="text-[var(--neutral-300)]">
              No compartimos tus datos con terceros, excepto para el procesamiento de pagos y cumplimiento legal.
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              5. Seguridad
            </h2>
            <p className="text-[var(--neutral-300)]">
              Implementamos medidas de seguridad para proteger tu información contra accesos no autorizados.
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              6. Derechos del Usuario
            </h2>
            <ul className="space-y-2 text-[var(--neutral-300)]">
              <li>Acceder, modificar o eliminar tu información personal en cualquier momento.</li>
              <li>Solicitar la eliminación de tu cuenta y datos asociados.</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              7. Cookies
            </h2>
            <p className="text-[var(--neutral-300)]">
              Utilizamos cookies para mejorar tu experiencia de usuario. Puedes deshabilitarlas desde tu navegador, 
              aunque esto podría afectar algunas funcionalidades del sitio.
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              8. Modificaciones
            </h2>
            <p className="text-[var(--neutral-300)]">
              Podemos actualizar esta política de privacidad cuando sea necesario. 
              Los cambios se publicarán en esta misma página.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/" className="text-[var(--primary)] hover:text-[var(--primary-dark)]">
          Volver a la página principal
        </Link>
      </div>
    </div>
  );
} 