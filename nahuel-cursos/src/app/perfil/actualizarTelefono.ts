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
    
    // 2. Actualizar en la base de datos a través de la API
    console.log('Enviando teléfono a la API:', telefono);
    
    // Usamos try/catch específico para la llamada a la API
    try {
      const response = await axios.put('/api/usuario/perfil', { telefono });
      console.log('Respuesta de la API:', response.data);
      
      if (!response.data.success) {
        return {
          success: false,
          message: response.data.error || 'No se pudo actualizar el teléfono'
        };
      }
      
      // 3. Si hay sesión, actualizar la sesión con el nuevo valor
      let sessionUpdated = false;
      
      if (session && update) {
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
      
      // 4. Obtener los datos actualizados del usuario para verificación
      try {
        const verificacion = await axios.post('/api/auth/actualizar-sesion');
        console.log('Verificación de datos actualizados:', verificacion.data);
        
        // Verificar si el teléfono realmente se actualizó en la base de datos
        const telefonoBD = verificacion.data.usuario?.telefono;
        console.log('Comparando teléfonos:', {
          enviadoTipo: typeof telefono,
          enviadoValor: telefono,
          bdTipo: typeof telefonoBD,
          bdValor: telefonoBD
        });
        
        // Comparación estricta y también como strings (para manejar números vs. strings)
        const telefonoActualizado = 
          telefonoBD === telefono || 
          telefonoBD?.toString() === telefono?.toString();
        
        if (!telefonoActualizado) {
          console.warn('¡Advertencia! El teléfono no se actualizó correctamente en la base de datos.', {
            telefonoEnviado: telefono,
            telefonoEnBD: telefonoBD
          });
        }
        
        return {
          success: true,
          message: telefonoActualizado 
            ? 'Teléfono actualizado correctamente' 
            : 'El teléfono no se guardó correctamente en la base de datos. Por favor, inténtalo de nuevo.',
          actualizado: telefonoActualizado
        };
      } catch (verificacionError) {
        console.error('Error al verificar la actualización:', verificacionError);
        
        // Si la sesión se actualizó pero no podemos verificar la BD
        if (sessionUpdated) {
          return {
            success: true,
            message: 'Teléfono actualizado en la sesión, pero no se pudo verificar en la base de datos',
            actualizado: false
          };
        }
        
        // Si no podemos verificar nada
        return {
          success: false,
          message: 'No se pudo verificar si el teléfono se actualizó correctamente'
        };
      }
    } catch (apiError) {
      console.error('Error en la llamada a la API de actualización:', apiError);
      return {
        success: false,
        message: 'Error al comunicarse con el servidor: ' + 
          (apiError instanceof Error ? apiError.message : 'Error desconocido')
      };
    }
  } catch (error) {
    console.error('Error general en la actualización del teléfono:', error);
    return {
      success: false,
      message: 'Error al actualizar el teléfono: ' + (error instanceof Error ? error.message : 'Error desconocido')
    };
  }
} 