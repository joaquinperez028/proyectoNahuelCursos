'use client';

import React from 'react';
import { FaExclamationTriangle, FaBug, FaYoutube } from 'react-icons/fa';

interface VideoFallbackProps {
  message?: string;
  showYoutubeOption?: boolean;
  onYoutubeClick?: () => void;
  className?: string;
}

/**
 * Componente que muestra un mensaje de error cuando un video no puede reproducirse
 */
export default function VideoFallback({
  message = 'Este video no está disponible actualmente',
  showYoutubeOption = false,
  onYoutubeClick,
  className = ''
}: VideoFallbackProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 bg-black bg-opacity-90 ${className}`}>
      <FaExclamationTriangle className="text-yellow-500 text-5xl mb-4" />
      
      <h3 className="text-white font-semibold text-lg mb-2 text-center">
        {message}
      </h3>
      
      <div className="text-gray-400 text-sm mb-4 text-center">
        Intente recargar la página o contacte a soporte si el problema persiste
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center transition-colors"
          onClick={() => window.location.reload()}
        >
          <FaBug className="mr-2" /> Reintentar
        </button>
        
        {showYoutubeOption && onYoutubeClick && (
          <button 
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm flex items-center transition-colors"
            onClick={onYoutubeClick}
          >
            <FaYoutube className="mr-2" /> Ver en YouTube
          </button>
        )}
      </div>
    </div>
  );
} 