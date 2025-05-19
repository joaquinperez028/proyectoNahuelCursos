'use client';

import { useRef, useEffect } from 'react';

interface PaymentMethodModalProps {
  onClose: () => void;
  onMercadoPago: () => void;
  onTransfer: () => void;
}

export default function PaymentMethodModal({
  onClose,
  onMercadoPago,
  onTransfer
}: PaymentMethodModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Cerrar el modal al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Prevenir scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[var(--neutral-800)]">Elige tu método de pago</h2>
          <button 
            onClick={onClose}
            className="text-[var(--neutral-500)] hover:text-[var(--neutral-800)]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="space-y-4 my-6">
          <button 
            onClick={onMercadoPago}
            className="w-full bg-[#009ee3] hover:bg-[#008fcf] text-white py-4 px-6 rounded-lg flex items-center justify-center font-medium transition-all"
          >
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V9C3 7.89543 3.89543 7 5 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 20V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Pagar con MercadoPago
          </button>

          <button 
            onClick={onTransfer}
            className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white py-4 px-6 rounded-lg flex items-center justify-center font-medium transition-all"
          >
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 9V7C17 5.89543 16.1046 5 15 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H15C16.1046 19 17 18.1046 17 17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H10M21 12L18 9M21 12L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Pagar por Transferencia
          </button>
        </div>

        <p className="text-sm text-[var(--neutral-500)] text-center mt-4">
          Ambos métodos de pago son seguros y están protegidos
        </p>
      </div>
    </div>
  );
} 