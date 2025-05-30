'use client'

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  _id: string;
  title: string;
  description: string;
  icon: string;
  slug: string;
  isActive: boolean;
  order: number;
}

interface CategoryDropdownProps {
  categoriaActual?: string;
  categoryCounts?: Record<string, number>;
}

export default function CategoryDropdown({ categoriaActual, categoryCounts }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        
        // Filtrar solo categorías activas y ordenar
        const activeCategories = data
          .filter((cat: Category) => cat.isActive)
          .sort((a: Category, b: Category) => a.order - b.order);
        
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };
  
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
    <div className="mb-8">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-between w-full md:w-auto px-4 py-2 text-sm font-medium text-[var(--neutral-200)] bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)] transition-all duration-200"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-[var(--neutral-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {categoriaActual || 'Todas las categorías'}
          </span>
          <svg 
            className={`w-5 h-5 ml-2 text-[var(--neutral-400)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute z-50 mt-2 w-full md:w-64 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="py-1 max-h-64 overflow-y-auto">
                {/* Opción "Todas las categorías" */}
                <button
                  onClick={() => handleSelectCategory()}
                  className={`w-full px-4 py-2 text-left text-sm transition-all duration-200 flex items-center justify-between group ${
                    !categoriaActual 
                      ? 'bg-[var(--accent)] text-white' 
                      : 'text-[var(--neutral-200)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] hover:pl-6'
                  }`}
                >
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Todas las categorías
                  </span>
                  {categoryCounts && (
                    <span className={`text-xs px-2 py-1 rounded-full transition-colors duration-200 ${
                      !categoriaActual 
                        ? 'bg-white/20 text-white' 
                        : 'bg-[var(--neutral-700)] text-[var(--neutral-300)] group-hover:bg-[var(--accent)]/20 group-hover:text-[var(--accent)]'
                    }`}>
                      {Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)}
                    </span>
                  )}
                </button>

                {/* Separador */}
                <div className="border-t border-[var(--border)] my-1" />

                {/* Categorías dinámicas */}
                {loading ? (
                  <div className="px-4 py-2 text-sm text-[var(--neutral-400)]">
                    Cargando categorías...
                  </div>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => handleSelectCategory(category.title)}
                      className={`w-full px-4 py-2 text-left text-sm transition-all duration-200 flex items-center justify-between group ${
                        categoriaActual === category.title 
                          ? 'bg-[var(--accent)] text-white' 
                          : 'text-[var(--neutral-200)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] hover:pl-6'
                      }`}
                    >
                      <span className="flex items-center">
                        <div 
                          className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110"
                          dangerouslySetInnerHTML={{ __html: category.icon }}
                        />
                        {category.title}
                      </span>
                      {categoryCounts && categoryCounts[category.title] && (
                        <span className={`text-xs px-2 py-1 rounded-full transition-colors duration-200 ${
                          categoriaActual === category.title 
                            ? 'bg-white/20 text-white' 
                            : 'bg-[var(--neutral-700)] text-[var(--neutral-300)] group-hover:bg-[var(--accent)]/20 group-hover:text-[var(--accent)]'
                        }`}>
                          {categoryCounts[category.title]}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-[var(--neutral-400)]">
                    No hay categorías disponibles
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 