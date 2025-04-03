import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Carpeta donde se guardarán los videos
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');

// Asegurarse de que existan las carpetas necesarias
export const ensureDirectoriesExist = () => {
  try {
    console.log('Verificando directorios de uploads...');
    console.log('- UPLOADS_DIR:', UPLOADS_DIR);
    console.log('- VIDEOS_DIR:', VIDEOS_DIR);
    
    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log('Creando directorio de uploads...');
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      console.log('Directorio de uploads creado');
    }
    
    if (!fs.existsSync(VIDEOS_DIR)) {
      console.log('Creando directorio de videos...');
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
      console.log('Directorio de videos creado');
    }
    
    // Verificar permisos
    fs.accessSync(VIDEOS_DIR, fs.constants.W_OK);
    console.log('Permisos de escritura correctos');
    
    return true;
  } catch (error) {
    console.error('Error al crear directorios:', error);
    throw new Error(`No se pudieron crear los directorios necesarios: ${error.message}`);
  }
};

// Generar un nombre de archivo único
export const generateUniqueFilename = (originalname: string): string => {
  const ext = path.extname(originalname).toLowerCase();
  const allowedExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Extensión de archivo no permitida: ${ext}. Solo se permiten: ${allowedExtensions.join(', ')}`);
  }
  
  return `${uuidv4()}${ext}`;
};

// Guardar el archivo en el sistema de archivos
export const saveVideoFile = async (file: Buffer, filename: string): Promise<string> => {
  try {
    ensureDirectoriesExist();
    
    const filePath = path.join(VIDEOS_DIR, filename);
    console.log('Guardando archivo en:', filePath);
    
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, file, (err) => {
        if (err) {
          console.error('Error al escribir el archivo:', err);
          reject(new Error(`Error al guardar el archivo: ${err.message}`));
          return;
        }
        // Verificar que el archivo se haya guardado correctamente
        fs.access(filePath, fs.constants.F_OK, (accessErr) => {
          if (accessErr) {
            reject(new Error(`El archivo no se pudo guardar correctamente: ${accessErr.message}`));
            return;
          }
          // Devolver la ruta relativa para acceder al archivo
          const relativePath = `/uploads/videos/${filename}`;
          console.log('Archivo guardado correctamente en:', relativePath);
          resolve(relativePath);
        });
      });
    });
  } catch (error) {
    console.error('Error en saveVideoFile:', error);
    throw error;
  }
};

// Eliminar un archivo
export const deleteFile = async (filePath: string): Promise<void> => {
  if (!filePath) {
    console.log('No se proporcionó ruta de archivo para eliminar');
    return;
  }
  
  // Convertir la ruta relativa a ruta absoluta
  const fullPath = path.join(process.cwd(), 'public', filePath.replace(/^\//, ''));
  console.log('Intentando eliminar archivo:', fullPath);
  
  return new Promise((resolve, reject) => {
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      // Si el archivo no existe, consideramos que ya está "eliminado"
      if (err) {
        console.log('El archivo no existe, no hay necesidad de eliminarlo:', fullPath);
        resolve();
        return;
      }
      
      fs.unlink(fullPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error al eliminar el archivo:', unlinkErr);
          reject(unlinkErr);
          return;
        }
        console.log('Archivo eliminado correctamente:', fullPath);
        resolve();
      });
    });
  });
}; 