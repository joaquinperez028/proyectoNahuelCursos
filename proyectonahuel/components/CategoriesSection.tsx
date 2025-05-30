'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';

// Interfaces para las categorías
interface Category {
  _id: string;
  title: string;
  description: string;
  icon: string;
  slug: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryDisplayProps {
  category: Category;
  colorClass: string;
  index: number;
}

function CategoryCard({ category, colorClass, index }: CategoryDisplayProps) {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        delay: index * 0.15
      }
    }
  };

  return (
    <motion.div 
      className="card-transition bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 border border-gray-700 hover:border-opacity-100 hover:border-blue-600 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 flex flex-col h-full"
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      aria-label={`Categoría de ${category.title}`}
    >
      <div className={`h-2 bg-gradient-to-r ${colorClass}`}></div>
      
      <div className="p-6 flex flex-col h-full">
        <div className="w-12 h-12 sm:w-14 sm:h-14 mb-4">
          <div 
            className="w-full h-full text-blue-400"
            dangerouslySetInnerHTML={{ __html: category.icon }}
          />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
          {category.title}
        </h3>
        <p className="text-sm sm:text-base text-gray-400 mb-4 flex-grow">
          {category.description}
        </p>
        <Link
          href={`/cursos?categoria=${encodeURIComponent(category.title)}`}
          className="inline-flex w-full sm:w-auto items-center justify-center sm:justify-start text-blue-400 font-medium hover:text-blue-500 transition-all duration-300 group hover:underline mt-auto"
          aria-label={`Explorar cursos de ${category.title}`}
        >
          <span>Explorar cursos</span>
          <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
          </svg>
        </Link>
      </div>
    </motion.div>
  );
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Colores para las categorías (se asignan cíclicamente)
  const colorClasses = [
    'from-blue-700 to-blue-500',
    'from-green-700 to-green-500', 
    'from-teal-700 to-teal-500',
    'from-indigo-700 to-indigo-500',
    'from-purple-700 to-purple-500',
    'from-pink-700 to-pink-500',
    'from-orange-700 to-orange-500',
    'from-red-700 to-red-500'
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error('Error al cargar las categorías');
      }
      
      const data = await response.json();
      
      // Filtrar solo categorías activas y ordenar por el campo 'order'
      const activeCategories = data
        .filter((cat: Category) => cat.isActive)
        .sort((a: Category, b: Category) => a.order - b.order);
      
      setCategories(activeCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

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

  // Estado de carga
  if (loading) {
    return (
      <div className="px-4 md:px-6 lg:px-8 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
          {/* Skeleton loaders */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 animate-pulse">
              <div className="h-2 bg-gray-600"></div>
              <div className="p-6">
                <div className="w-12 h-12 bg-gray-600 rounded-md mb-4"></div>
                <div className="h-6 bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-600 rounded mb-1"></div>
                <div className="h-4 bg-gray-600 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="px-4 md:px-6 lg:px-8 mx-auto">
        <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
          <div className="w-16 h-16 mx-auto mb-4 text-red-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Error al cargar categorías</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchCategories}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Si no hay categorías activas
  if (categories.length === 0) {
    return (
      <div className="px-4 md:px-6 lg:px-8 mx-auto">
        <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No hay categorías disponibles</h3>
          <p className="text-gray-400">Las categorías aparecerán aquí una vez que sean creadas y activadas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 mx-auto">
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {categories.map((category, index) => (
          <CategoryCard
            key={category._id}
            category={category}
            colorClass={colorClasses[index % colorClasses.length]}
            index={index}
          />
        ))}
      </motion.div>
    </div>
  );
} 