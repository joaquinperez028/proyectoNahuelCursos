import axios from 'axios';
import { Session } from 'next-auth';

/**
 * Actualiza el teléfono del usuario en la base de datos y devuelve una promesa con el resultado
 * 
 * @param telefono - El nuevo número de teléfono
 * @param update - Función para actualizar la sesión de NextAuth
 * @param session - La sesión actual
 * @returns Una promesa que resuelve a un objeto con el resultado de la operación
 */
export async function actualizarTelefono(
  telefono: string, 
  update: (data?: any) => Promise<Session | null>,
  session?: Session | null
): Promise<{ 
  success: boolean; 
  message: string; 
  actualizado?: boolean;
}> {
  try {
    // 1. Validar formato de teléfono (opcional)
    if (telefono && !/^[0-9+\s()-]{5,15}$/.test(telefono)) {
      return {
        success: false,
        message: 'Formato de teléfono no válido'
      };
    }

    // Verificar si tenemos sesión
    if (!session || !session.user) {
      console.error('No hay sesión de usuario para actualizar el teléfono');
      return {
        success: false,
        message: 'No hay sesión activa. Por favor, inicia sesión de nuevo.'
      };
    }
    
    // 2. Actualizar en la base de datos a través de la API
    console.log('Enviando teléfono a la API:', telefono);
    
    // Usamos try/catch específico para la llamada a la API
    try {
      // Añadir un timeout más largo para la solicitud
      const response = await axios.put('/api/usuario/perfil', 
        { telefono },
        { 
          timeout: 15000, // 15 segundos de timeout
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
      
      console.log('Respuesta de la API:', response.data);
      
      if (!response.data.success) {
        return {
          success: false,
          message: response.data.error || 'No se pudo actualizar el teléfono'
        };
      }
      
      // 3. Si hay sesión, actualizar la sesión con el nuevo valor
      let sessionUpdated = false;
      
      if (update) {
        try {
          // Actualizar la sesión de NextAuth
          await update({
            ...session,
            user: {
              ...session.user,
              telefono: telefono
            }
          });
          
          sessionUpdated = true;
          console.log('Sesión actualizada con el nuevo teléfono:', telefono);
        } catch (updateError) {
          console.error('Error al actualizar la sesión:', updateError);
          // Continuamos porque ya se actualizó la base de datos
        }
      }
      
      // Si la API nos devolvió un usuario actualizado, usamos esa información
      if (response.data.usuario?.telefono) {
        const telefonoActualizado = response.data.usuario.telefono;
        console.log('Teléfono actualizado según respuesta de API:', telefonoActualizado);
        
        return {
          success: true,
          message: 'Teléfono actualizado correctamente',
          actualizado: true
        };
      }
      
      // Si no hay información detallada pero la API indica éxito
      return {
        success: true,
        message: sessionUpdated 
          ? 'Teléfono actualizado correctamente' 
          : 'Teléfono actualizado en la base de datos, pero podría necesitar recargar la página',
        actualizado: true
      };
    } catch (apiError: any) {
      console.error('Error en la llamada a la API de actualización:', apiError);
      
      // Mensaje de error más detallado según el tipo de error
      let errorMessage = 'Error al comunicarse con el servidor';
      
      if (apiError.code === 'ECONNABORTED') {
        errorMessage = 'La conexión con el servidor ha expirado. Por favor, intenta de nuevo.';
      } else if (apiError.response) {
        // Error con respuesta del servidor
        const status = apiError.response.status;
        const serverMessage = apiError.response.data?.error || apiError.response.data?.mensaje;
        
        if (status === 500) {
          errorMessage = `Error interno del servidor: ${serverMessage || 'Problema en el servidor'}`;
        } else if (status === 401 || status === 403) {
          errorMessage = 'No tienes autorización para realizar esta acción. Intenta iniciar sesión de nuevo.';
        } else if (status === 404) {
          errorMessage = 'No se encontró tu usuario en la base de datos. Intenta iniciar sesión de nuevo.';
        } else {
          errorMessage = `Error (${status}): ${serverMessage || apiError.message}`;
        }
      } else if (apiError.request) {
        // Error sin respuesta del servidor
        errorMessage = 'No se recibió respuesta del servidor. Verifica tu conexión a Internet.';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  } catch (error: any) {
    console.error('Error general en la actualización del teléfono:', error);
    return {
      success: false,
      message: 'Error al actualizar el teléfono: ' + (error.message || 'Error desconocido')
    };
  }
} 