'use client';

import { useState } from 'react';
import { useNotifications } from '@/components/Notification';

interface EditNameComponentProps {
  currentName: string;
  onNameUpdate: (newName: string) => void;
}

export default function EditNameComponent({ currentName, onNameUpdate }: EditNameComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotifications();

  const handleSave = async () => {
    if (!name.trim()) {
      showNotification('El nombre no puede estar vacío', 'error');
      return;
    }

    if (name.trim().length < 2) {
      showNotification('El nombre debe tener al menos 2 caracteres', 'error');
      return;
    }

    if (name.trim().length > 50) {
      showNotification('El nombre no puede tener más de 50 caracteres', 'error');
      return;
    }

    if (name.trim() === currentName.trim()) {
      setIsEditing(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users/update-name', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar el nombre');
      }

      onNameUpdate(data.user.name);
      setIsEditing(false);
      showNotification('Nombre actualizado correctamente', 'success');

    } catch (error) {
      console.error('Error al actualizar el nombre:', error);
      showNotification(
        error instanceof Error ? error.message : 'Error al actualizar el nombre',
        'error'
      );
      setName(currentName); // Revertir al nombre original
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(currentName);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col space-y-2">
          <label className="block text-sm font-medium text-[#B4B4C0]">
            Nombre
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-[#1E1E2F] border border-[#3A3A4C] rounded-md text-white transition-all duration-200 focus:border-[#4CAF50] focus:outline-none pr-16"
              placeholder="Ingresa tu nombre"
              maxLength={50}
              disabled={loading}
              autoFocus
            />
            <div className="absolute right-3 top-3 text-xs text-[#8A8A9A]">
              {name.length}/50
            </div>
          </div>
          <p className="text-xs text-[#8A8A9A]">
            Este será tu nombre visible en la plataforma
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading || !name.trim() || name.trim().length < 2}
            className="px-4 py-2 bg-[#4CAF50] hover:bg-[#45a049] text-white rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar
              </>
            )}
          </button>
          
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 bg-[#3A3A4C] hover:bg-[#4A4A5C] text-[#B4B4C0] rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#B4B4C0]">
        Nombre
      </label>
      <div className="flex items-center gap-3">
        <input 
          value={currentName} 
          readOnly 
          className="flex-1 p-3 bg-[#1E1E2F] border border-[#3A3A4C] rounded-md text-white transition-all duration-200 hover:border-[#4CAF50] focus:border-[#4CAF50] focus:outline-none"
        />
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-[#4CAF50] hover:bg-[#45a049] text-white rounded-md font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar
        </button>
      </div>
      <p className="text-xs text-[#8A8A9A]">
        Puedes cambiar tu nombre visible en cualquier momento
      </p>
    </div>
  );
} 