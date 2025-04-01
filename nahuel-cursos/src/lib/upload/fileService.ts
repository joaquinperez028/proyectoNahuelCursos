import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Carpeta donde se guardarán los videos
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');

// Asegurarse de que existan las carpetas necesarias
export const ensureDirectoriesExist = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }
};

// Generar un nombre de archivo único
export const generateUniqueFilename = (originalname: string): string => {
  const ext = path.extname(originalname);
  return `${uuidv4()}${ext}`;
};

// Guardar el archivo en el sistema de archivos
export const saveVideoFile = async (file: Buffer, filename: string): Promise<string> => {
  ensureDirectoriesExist();
  
  const filePath = path.join(VIDEOS_DIR, filename);
  
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, file, (err) => {
      if (err) {
        reject(err);
        return;
      }
      // Devolver la ruta relativa para acceder al archivo
      resolve(`/uploads/videos/${filename}`);
    });
  });
};

// Eliminar un archivo
export const deleteFile = async (filePath: string): Promise<void> => {
  // Convertir la ruta relativa a ruta absoluta
  const fullPath = path.join(process.cwd(), 'public', filePath.replace(/^\//, ''));
  
  return new Promise((resolve, reject) => {
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      // Si el archivo no existe, consideramos que ya está "eliminado"
      if (err) {
        resolve();
        return;
      }
      
      fs.unlink(fullPath, (unlinkErr) => {
        if (unlinkErr) {
          reject(unlinkErr);
          return;
        }
        resolve();
      });
    });
  });
}; 