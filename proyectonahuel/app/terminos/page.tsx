'use client';

import Link from 'next/link';

export default function TerminosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="bg-[var(--card)] p-6 sm:p-8 rounded-lg shadow-lg border border-[var(--border)]">
        <h1 className="text-3xl font-bold text-[var(--neutral-100)] sm:text-4xl mb-8">
          Términos y condiciones
        </h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              1. Introducción
            </h2>
            <p className="text-[var(--neutral-300)]">
              Estos términos y condiciones regulan el uso de la plataforma de cursos en línea. 
              Al acceder y utilizar nuestro sitio web, aceptas cumplir con estos términos en su totalidad. 
              Si no estás de acuerdo, te recomendamos no utilizar nuestros servicios.
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              2. Registro y Cuenta
            </h2>
            <ul className="space-y-2 text-[var(--neutral-300)]">
              <li>Para acceder a ciertos contenidos, es necesario registrarse y crear una cuenta.</li>
              <li>Los datos proporcionados deben ser reales y estar actualizados.</li>
              <li>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              3. Compra de Cursos
            </h2>
            <ul className="space-y-2 text-[var(--neutral-300)]">
              <li>Los pagos realizados son finales y no reembolsables, salvo que se indique lo contrario en políticas específicas.</li>
              <li>El acceso a los cursos es personal e intransferible.</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              4. Propiedad Intelectual
            </h2>
            <ul className="space-y-2 text-[var(--neutral-300)]">
              <li>Todo el contenido de los cursos es propiedad de la plataforma o de los instructores.</li>
              <li>Está prohibida la distribución, copia o modificación sin autorización previa.</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              5. Responsabilidad
            </h2>
            <ul className="space-y-2 text-[var(--neutral-300)]">
              <li>La plataforma no se responsabiliza por errores en los contenidos o problemas técnicos.</li>
              <li>Nos reservamos el derecho de suspender o cancelar cuentas en caso de violación de los términos.</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              6. Modificaciones
            </h2>
            <ul className="space-y-2 text-[var(--neutral-300)]">
              <li>Nos reservamos el derecho de actualizar los términos y condiciones en cualquier momento.</li>
              <li>Las modificaciones serán notificadas en el sitio web.</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              7. Contacto
            </h2>
            <p className="text-[var(--neutral-300)]">
              Si tienes dudas sobre estos términos, puedes contactarnos a través de{' '}
              <a href="mailto:contacto@nahuellozano.com" className="text-[var(--primary)] hover:text-[var(--primary-dark)]">
                contacto@nahuellozano.com
              </a>.
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