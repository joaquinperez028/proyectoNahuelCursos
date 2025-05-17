'use client'

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CategoryCount {
  [key: string]: number;
}

interface CategoryDropdownProps {
  categoriaActual?: string;
  categoryCounts: CategoryCount;
}

export default function CategoryDropdown({ categoriaActual, categoryCounts }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const categorias = [
    'Análisis Técnico',
    'Análisis Fundamental',
    'Estrategias de Trading',
    'Finanzas Personales'
  ];
  
  // Cerrar el dropdown al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSelectCategory = (categoria?: string) => {
    setIsOpen(false);
    if (categoria) {
      router.push(`/cursos?categoria=${encodeURIComponent(categoria)}`);
    } else {
      router.push('/cursos');
    }
  };
  
  return (
    <div className="mb-8 bg-[var(--neutral-900)] p-6 rounded-lg shadow-lg border border-[var(--border)]">
      <h3 className="text-lg font-medium text-[var(--neutral-100)] mb-4">Filtrar por categoría</h3>
      
      <div className="relative" ref={dropdownRef}>
        {/* Botón del dropdown */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full md:w-64 flex items-center justify-between px-4 py-3 bg-[var(--neutral-800)] text-[var(--neutral-200)] rounded-md border border-[var(--border)] hover:bg-[var(--neutral-700)] transition-all duration-200"
        >
          <span className="truncate">
            {categoriaActual ? categoriaActual : 'Seleccionar Categoría'}
          </span>
          <svg 
            className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Lista desplegable */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full md:w-64 bg-[var(--neutral-800)] border border-[var(--border)] rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Opción "Todos" */}
            <div 
              onClick={() => handleSelectCategory()}
              className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[var(--neutral-700)] ${
                !categoriaActual ? 'bg-[var(--accent)] bg-opacity-20 text-[var(--accent)]' : 'text-[var(--neutral-200)]'
              }`}
            >
              <span>Todos</span>
              {categoryCounts['total'] !== undefined && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-[var(--neutral-700)] text-[var(--neutral-300)] rounded-full">
                  {categoryCounts['total']}
                </span>
              )}
            </div>
            
            {/* Opciones de categorías */}
            {categorias.map((categoria) => (
              <div 
                key={categoria}
                onClick={() => handleSelectCategory(categoria)}
                className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[var(--neutral-700)] ${
                  categoriaActual === categoria ? 'bg-[var(--accent)] bg-opacity-20 text-[var(--accent)]' : 'text-[var(--neutral-200)]'
                }`}
              >
                <span>{categoria}</span>
                {categoryCounts[categoria] !== undefined && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-[var(--neutral-700)] text-[var(--neutral-300)] rounded-full">
                    {categoryCounts[categoria]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 