'use client';

import Link from 'next/link';

export default function Prueba() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-blue-900 py-4 px-6 rounded-t-xl mb-6">
        <h1 className="text-3xl font-bold text-white mb-0">Prueba</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
        <Link 
          href="/" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
        >
          Prueba
        </Link>
      </div>
    </div>
  );
} 