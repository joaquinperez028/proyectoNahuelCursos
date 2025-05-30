'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CertificadosPage() {
  const [certificateId, setCertificateId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (certificateId.trim()) {
      window.open(`/certificados/ver/${certificateId.trim()}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--neutral-100)] mb-4">
            Verificar Certificados
          </h1>
          <p className="text-xl text-[var(--neutral-300)] max-w-2xl mx-auto">
            Verifica la autenticidad de un certificado emitido por nuestra plataforma ingresando su ID único.
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-8 shadow-lg border border-[var(--border)] mb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="certificate-id" className="block text-sm font-medium text-[var(--neutral-300)] mb-2">
                ID del Certificado
              </label>
              <input
                type="text"
                id="certificate-id"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="Ingresa el ID del certificado (ej: CERT-123456)"
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--neutral-200)] placeholder-[var(--neutral-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-[var(--accent)] text-white py-3 px-6 rounded-md hover:bg-[var(--accent-dark)] transition-colors font-medium"
            >
              Verificar Certificado
            </button>
          </form>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-[var(--accent)] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="text-lg font-semibold text-[var(--neutral-100)]">Certificados Auténticos</h3>
            </div>
            <p className="text-[var(--neutral-400)]">
              Todos nuestros certificados incluyen un ID único que permite verificar su autenticidad. 
              Cada certificado está firmado digitalmente y no puede ser falsificado.
            </p>
          </div>

          <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-[var(--accent)] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="text-lg font-semibold text-[var(--neutral-100)]">¿Cómo Verificar?</h3>
            </div>
            <p className="text-[var(--neutral-400)]">
              Simplemente ingresa el ID del certificado en el campo superior. 
              El sistema te mostrará todos los detalles del certificado incluyendo el curso completado y la fecha de emisión.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/certificados/verificar"
            className="inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors"
          >
            <span className="mr-2">¿Necesitas ayuda con la verificación?</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
} 