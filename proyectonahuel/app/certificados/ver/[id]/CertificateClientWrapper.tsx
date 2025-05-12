'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Importar el botón de impresión de forma dinámica con client-side rendering
const PrintButton = dynamic(() => import('./PrintButton'), { ssr: false });

export default function CertificateClientWrapper() {
  return (
    <div className="mb-8 flex justify-center">
      <PrintButton />
    </div>
  );
} 