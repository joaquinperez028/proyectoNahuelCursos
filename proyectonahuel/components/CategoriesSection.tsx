'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import React from 'react';

// Tipos para las categorías
type Categoria = {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  ariaLabel: string;  // Añadido para accesibilidad
};

export default function CategoriesSection() {
  // Variantes de animación para Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };

  // Datos de categorías
  const categorias: Categoria[] = [
    { 
      name: 'Análisis Técnico', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-blue-400" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="2" y="3" width="20" height="18" rx="2" strokeWidth="1.5" />
          <line x1="2" y1="7" x2="22" y2="7" strokeWidth="1.5" />
          <path d="M6 12v-2m0 6v-2m6-2v-2m0 6v-2m6-2v-2m0 6v-2" strokeWidth="1.5" />
          <rect x="5" y="11" width="2" height="6" rx="0.5" fill="currentColor" />
          <rect x="11" y="13" width="2" height="4" rx="0.5" fill="currentColor" />
          <rect x="17" y="10" width="2" height="7" rx="0.5" fill="currentColor" />
          <path d="M7 13l4-3 4 3 3-2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      color: 'from-blue-700 to-blue-500',
      description: 'Domina el análisis de gráficos y patrones para anticipar movimientos del mercado con precisión.',
      ariaLabel: 'Categoría de Análisis Técnico con gráfico de velas japonesas'
    },
    { 
      name: 'Análisis Fundamental', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-green-400" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 14H5v4h4v-4z" fill="currentColor" strokeWidth="0" />
          <circle cx="16" cy="8" r="5" strokeWidth="1.5" />
          <path d="M15 8h2" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 7v2" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8.5 9h-2" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8.5 12h-2" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      color: 'from-green-700 to-green-500',
      description: 'Evalúa el valor real de activos financieros mediante datos clave y análisis profundo.',
      ariaLabel: 'Categoría de Análisis Fundamental con lupa sobre informe financiero'
    },
    { 
      name: 'Estrategias de Trading', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-teal-400" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="2" y="3" width="20" height="18" rx="2" strokeWidth="1.5" />
          <path d="M6 10l4 4 8-8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="6" y1="16" x2="18" y2="16" strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="6" y1="7" x2="18" y2="7" strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M16 7l-6 7" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 16v-3h3" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 7l3 3" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="15" y="6.5" fontSize="3" fill="currentColor">TP</text>
          <text x="6" y="19" fontSize="3" fill="currentColor">SL</text>
        </svg>
      ),
      color: 'from-teal-700 to-teal-500',
      description: 'Descubre técnicas probadas, gestión monetaria y psicología avanzada del trading.',
      ariaLabel: 'Categoría de Estrategias de Trading con gráfico de take profit y stop loss'
    },
    { 
      name: 'Finanzas Personales', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-indigo-400" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" strokeWidth="1.5" />
          <path d="M16 10h2" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 14h2" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6 14h6" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 10h18" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 17s1-2 3-2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 7c0 1.105 0.895 2 2 2s2-0.895 2-2-0.895-2-2-2" fill="currentColor" strokeWidth="0" />
          <path d="M12 5v4" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 7h4" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      color: 'from-indigo-700 to-indigo-500',
      description: 'Organiza tu dinero, maximiza tus ahorros y planifica tu futuro financiero.',
      ariaLabel: 'Categoría de Finanzas Personales con billetera y símbolos monetarios'
    }
  ];

  return (
    <div className="px-4 md:px-6 lg:px-8 mx-auto">
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {categorias.map((categoria) => (
          <motion.div 
            key={categoria.name} 
            className="card-transition bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 border border-gray-700 hover:border-opacity-100 hover:border-blue-600 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 flex flex-col h-full"
            variants={itemVariants}
            style={{ borderImageSource: `linear-gradient(to bottom, ${categoria.color.split(' ')[1]}, transparent)` }}
            aria-label={categoria.ariaLabel}
          >
            <div className={`h-2 bg-gradient-to-r ${categoria.color}`}></div>
            <div className="p-4 sm:p-6 flex flex-col flex-grow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mb-4">
                {categoria.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                {categoria.name}
              </h3>
              <p className="text-sm sm:text-base text-gray-400 mb-4 flex-grow">
                {categoria.description}
              </p>
              <Link
                href={`/cursos?categoria=${categoria.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-flex w-full sm:w-auto items-center justify-center sm:justify-start text-blue-400 font-medium hover:text-blue-500 transition-all duration-300 group hover:underline mt-auto"
                aria-label={`Explorar cursos de ${categoria.name}`}
              >
                <span>Explorar cursos</span>
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </Link>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
} 