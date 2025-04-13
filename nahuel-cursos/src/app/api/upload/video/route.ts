import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth/auth';
import clientPromise from '@/lib/db/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';

// Configuración para manejar tamaños grandes de archivos
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '100mb',
    // Aumentar el tiempo máximo de respuesta a 10 minutos (600 segundos)
    externalResolver: true,
  },
};

// Tiempo máximo para la subida (10 minutos)
const UPLOAD_TIMEOUT = 600000;

// Función para generar un nombre de archivo único
const generateUniqueFilename = (originalname: string): string => {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 15);
  const ext = originalname.split('.').pop();
  return `${timestamp}-${randomString}.${ext}`;
};

export async function POST(req: NextRequest) {
  // Crear un temporizador de seguridad
  let uploadTimeoutId: NodeJS.Timeout | null = null;
  
  try {
    console.log('Iniciando procesamiento de solicitud de carga de video...');
    
    // La promesa principal que procesa la carga
    const processUpload = async (): Promise<NextResponse> => {
      try {
        // Verificar autenticación y permisos de administrador
        const session = await getServerSession(authOptions);
        if (!session || !isAdmin(session)) {
          console.log('Intento de subida no autorizado');
          return NextResponse.json(
            { error: 'No autorizado' },
            { status: 401 }
          );
        }
        
        console.log('Iniciando subida de video a MongoDB GridFS...');
        
        // Obtener el FormData
        try {
          const formData = await req.formData();
          const videoFile = formData.get('video') as File;
          
          if (!videoFile) {
            console.log('No se proporcionó ningún archivo de video');
            return NextResponse.json(
              { error: 'No se ha proporcionado ningún archivo de video' },
              { status: 400 }
            );
          }
          
          console.log('Video recibido:', videoFile.name, 'Tamaño:', videoFile.size, 'Tipo:', videoFile.type);
          
          // Verificar el tamaño del archivo (límite de 100MB)
          if (videoFile.size > 100 * 1024 * 1024) {
            console.log('Archivo demasiado grande:', videoFile.size, 'excede el límite de 100MB');
            return NextResponse.json(
              { error: 'El archivo excede el tamaño máximo permitido (100MB)' },
              { status: 400 }
            );
          }
          
          // Generar un nombre único para el archivo
          const filename = generateUniqueFilename(videoFile.name);
          console.log('Nombre generado para el archivo:', filename);
          
          // Convertir el File a Buffer
          try {
            console.log('Convirtiendo File a Buffer...');
            const buffer = Buffer.from(await videoFile.arrayBuffer());
            console.log('Conversión a Buffer completada. Tamaño del buffer:', buffer.length);
            
            // Conectar a MongoDB
            console.log('Conectando a MongoDB...');
            const client = await clientPromise;
            const db = client.db();
            console.log('Conexión a MongoDB establecida');
            
            // Crear un GridFS bucket
            console.log('Creando GridFS bucket...');
            const bucket = new GridFSBucket(db, {
              bucketName: 'videos'
            });
            
            // Crear un ID para el archivo
            const fileId = new ObjectId();
            console.log('ID generado para el archivo:', fileId.toString());
            
            // Subir el archivo
            return new Promise<NextResponse>((resolve) => {
              console.log('Iniciando la transmisión del archivo a GridFS...');
              
              const uploadStream = bucket.openUploadStreamWithId(fileId, filename, {
                metadata: {
                  originalFilename: videoFile.name,
                  contentType: videoFile.type,
                  size: videoFile.size,
                  uploadedBy: session.user.email,
                  uploadedAt: new Date()
                }
              });
              
              // Manejar eventos
              uploadStream.on('error', (error) => {
                console.error('Error al subir a GridFS:', error);
                const errorMessage = typeof error === 'object' ? 
                  (error.message || JSON.stringify(error)) : 
                  'Error al subir el archivo a la base de datos';
                
                console.log('Resolviendo con error:', errorMessage);
                resolve(NextResponse.json({ error: errorMessage }, { status: 500 }));
              });
              
              uploadStream.on('finish', () => {
                console.log('Subida a GridFS completada, ID:', fileId.toString());
                
                // Devolver la URL para acceder al archivo
                const videoUrl = `/api/videos/${fileId.toString()}`;
                console.log('URL generada para el video:', videoUrl);
                resolve(NextResponse.json({
                  filePath: videoUrl,
                  fileName: videoFile.name,
                  fileId: fileId.toString()
                }));
              });

              // Opcionalmente, manejar el evento 'progress' si está disponible
              if (uploadStream.on && typeof uploadStream.on === 'function') {
                try {
                  uploadStream.on('progress', (progress) => {
                    console.log(`Progreso de subida a GridFS: ${progress}`);
                  });
                } catch (err) {
                  console.log('El evento progress no está disponible en este stream');
                }
              }
              
              // Escribir el buffer en el stream
              console.log('Escribiendo buffer en el stream...');
              try {
                // Verificar que el buffer sea válido y no esté vacío
                if (!buffer || buffer.length === 0) {
                  console.error('Error: Buffer vacío o inválido');
                  resolve(NextResponse.json({ 
                    error: 'El archivo cargado está vacío o es inválido' 
                  }, { status: 400 }));
                  return;
                }
                
                // Manejar el proceso de escritura con un callback
                uploadStream.write(buffer, (writeError) => {
                  if (writeError) {
                    console.error('Error al escribir en el stream:', writeError);
                    
                    // Detalle del error
                    console.error('Tipo de writeError:', typeof writeError);
                    console.error('Es instancia de Error:', writeError instanceof Error);
                    
                    try {
                      console.error('Propiedades del error de escritura:', 
                        Object.getOwnPropertyNames(writeError).reduce((acc, prop) => {
                          acc[prop] = writeError[prop];
                          return acc;
                        }, {})
                      );
                    } catch (e) {
                      console.error('No se pudieron listar todas las propiedades del error');
                    }
                    
                    const errorMessage = typeof writeError === 'object' ? 
                      (writeError.message || 
                       ((writeError as any).code ? `Error código ${(writeError as any).code}` : JSON.stringify(writeError))) : 
                      'Error al escribir el archivo en la base de datos';
                    
                    resolve(NextResponse.json({ error: errorMessage }, { status: 500 }));
                    return;
                  }
                  console.log('Buffer escrito correctamente en el stream');
                  
                  // Finalizar el stream con un manejador de errores
                  try {
                    console.log('Finalizando stream...');
                    uploadStream.end((endError) => {
                      if (endError) {
                        console.error('Error al finalizar el stream:', endError);
                        const endErrorMsg = typeof endError === 'object' ? 
                          (endError.message || JSON.stringify(endError)) : 
                          'Error al finalizar la subida del archivo';
                        
                        resolve(NextResponse.json({ error: endErrorMsg }, { status: 500 }));
                      } else {
                        console.log('Stream finalizado correctamente, esperando evento finish');
                      }
                    });
                  } catch (endTryError: any) {
                    console.error('Excepción al intentar finalizar el stream:', endTryError);
                    resolve(NextResponse.json({ 
                      error: endTryError.message || 'Error al finalizar la subida' 
                    }, { status: 500 }));
                  }
                });
              } catch (streamError: any) {
                console.error('Error en operaciones del stream:', streamError);
                const errorMessage = streamError.message || 'Error en operaciones del stream de subida';
                resolve(NextResponse.json({ error: errorMessage }, { status: 500 }));
              }
            });
          } catch (error: any) {
            console.error('Error al convertir File a Buffer:', error);
            let errorMessage = 'Error al convertir el archivo a Buffer';
            
            if (error.message) {
              errorMessage = error.message;
            } else if (typeof error === 'object') {
              try {
                errorMessage = JSON.stringify(error);
              } catch (e) {
                errorMessage = 'Error no serializable durante la conversión';
              }
            }
            
            return NextResponse.json(
              { error: errorMessage },
              { status: 500 }
            );
          }
        } catch (formDataError: any) {
          console.error('Error al obtener el FormData:', formDataError);
          let errorMessage = 'Error al obtener el FormData';
          
          if (formDataError.message) {
            errorMessage = formDataError.message;
          } else if (typeof formDataError === 'object') {
            try {
              errorMessage = JSON.stringify(formDataError);
            } catch (e) {
              errorMessage = 'Error no serializable durante la obtención del FormData';
            }
          }
          
          return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
          );
        }
      } catch (outerError: any) {
        console.error('Error general en el proceso de subida:', outerError);
        let errorMessage = 'Error al subir el video';
        
        if (outerError.message) {
          errorMessage = outerError.message;
        } else if (typeof outerError === 'object') {
          try {
            errorMessage = JSON.stringify(outerError);
          } catch (e) {
            errorMessage = 'Error no serializable durante la subida';
          }
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      }
    };
    
    // Establecer un tiempo de espera máximo para toda la operación
    const timeoutPromise = new Promise<NextResponse>((resolve) => {
      uploadTimeoutId = setTimeout(() => {
        console.error('La operación de carga excedió el tiempo máximo permitido');
        resolve(NextResponse.json(
          { error: 'La operación excedió el tiempo máximo permitido (10 minutos)' },
          { status: 408 } // Request Timeout
        ));
      }, UPLOAD_TIMEOUT);
    });
    
    // Usar Promise.race entre el timeout y el proceso
    const result = await Promise.race([processUpload(), timeoutPromise]);
    
    // Limpiar el temporizador si el proceso terminó antes del timeout
    if (uploadTimeoutId) {
      clearTimeout(uploadTimeoutId);
      uploadTimeoutId = null;
    }
    
    return result;
    
  } catch (error: any) {
    // Limpiar el temporizador en caso de error
    if (uploadTimeoutId) {
      clearTimeout(uploadTimeoutId);
    }
    
    console.error('Error crítico al subir video:', error);
    let errorMessage = 'Error crítico al subir el video';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'object') {
      try {
        errorMessage = JSON.stringify(error);
      } catch (e) {
        errorMessage = 'Error no serializable durante la subida';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 