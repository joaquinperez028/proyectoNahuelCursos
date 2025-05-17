'use client'

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  // Variantes para las animaciones
  const dropdownVariants = {
    hidden: { 
      opacity: 0,
      y: -5,
      scale: 0.98,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 30,
        duration: 0.15
      }
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 30,
        duration: 0.15
      }
    }
  };
  
  return (
    <div className="mb-8 bg-[var(--neutral-900)] p-6 rounded-lg shadow-lg border border-[var(--border)]">
      <h3 className="text-lg font-medium text-[var(--neutral-100)] mb-4">Filtrar por categoría</h3>
      
      <div className="relative w-full sm:w-80 md:w-96" ref={dropdownRef}>
        {/* Botón del dropdown */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-5 py-3.5 ${
            categoriaActual 
              ? 'bg-[var(--neutral-800)] border-[var(--accent)] text-[var(--accent)]' 
              : 'bg-[var(--neutral-800)] text-[var(--neutral-100)] border-[var(--border)]'
          } rounded-lg border hover:bg-[var(--neutral-700)] shadow-sm
                     transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-50`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="font-medium truncate flex items-center">
            {categoriaActual ? (
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]"></span>
                {categoriaActual}
              </span>
            ) : (
              'Seleccionar Categoría'
            )}
          </span>
          <motion.svg 
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-5 ml-2 text-[var(--neutral-300)]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>
        
        {/* Lista desplegable con animación */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute z-20 w-full mt-2 bg-[var(--neutral-800)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden"
              role="listbox"
            >
              {/* Opción "Todos" */}
              <div 
                onClick={() => handleSelectCategory()}
                className={`group px-5 py-3 flex items-center justify-between cursor-pointer transition-colors duration-200
                           hover:bg-[var(--neutral-700)] ${
                  !categoriaActual ? 'bg-[var(--accent)] bg-opacity-10 text-[var(--accent)]' : 'text-[var(--neutral-200)]'
                }`}
                role="option"
                aria-selected={!categoriaActual}
              >
                <span className="font-medium flex items-center gap-2">
                  {!categoriaActual && <span className="h-2 w-2 rounded-full bg-[var(--accent)]"></span>}
                  Todos los cursos
                </span>
                {categoryCounts['total'] !== undefined && (
                  <span className="ml-2 px-2.5 py-0.5 text-xs bg-[var(--neutral-700)] group-hover:bg-[var(--neutral-600)] 
                                 text-[var(--neutral-300)] rounded-full transition-colors duration-200 font-medium">
                    {categoryCounts['total']}
                  </span>
                )}
              </div>
              
              {/* Separador */}
              <div className="h-px w-full bg-[var(--border)] opacity-50"></div>
              
              {/* Opciones de categorías */}
              {categorias.map((categoria) => (
                <div 
                  key={categoria}
                  onClick={() => handleSelectCategory(categoria)}
                  className={`group px-5 py-3 flex items-center justify-between cursor-pointer transition-colors duration-200
                             hover:bg-[var(--neutral-700)] ${
                    categoriaActual === categoria ? 'bg-[var(--accent)] bg-opacity-10 text-[var(--accent)]' : 'text-[var(--neutral-200)]'
                  }`}
                  role="option"
                  aria-selected={categoriaActual === categoria}
                >
                  <span className="font-medium flex items-center gap-2">
                    {categoriaActual === categoria && <span className="h-2 w-2 rounded-full bg-[var(--accent)]"></span>}
                    {categoria}
                  </span>
                  {categoryCounts[categoria] !== undefined && (
                    <span className="ml-2 px-2.5 py-0.5 text-xs bg-[var(--neutral-700)] group-hover:bg-[var(--neutral-600)] 
                                   text-[var(--neutral-300)] rounded-full transition-colors duration-200 font-medium">
                      {categoryCounts[categoria]}
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 