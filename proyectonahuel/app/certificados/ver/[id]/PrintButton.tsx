'use client';

import React from 'react';

const PrintButton = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button 
      onClick={handlePrint} 
      className="px-4 py-2 bg-[var(--primary)] text-white rounded-md flex items-center print:hidden"
    >
      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Imprimir certificado
    </button>
  );
};

export default PrintButton; 