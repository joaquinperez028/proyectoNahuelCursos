import { MongoClient } from 'mongodb';

// Variable global para almacenar la conexión a la base de datos
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'nahuel-cursos';

// Validar la URI de conexión
if (!MONGODB_URI) {
  throw new Error('Por favor define la variable de entorno MONGODB_URI');
}

// Opciones de conexión optimizadas
const options = {
  connectTimeoutMS: 20000,           // 20 segundos para timeout de conexión (aumentado)
  socketTimeoutMS: 60000,           // 60 segundos para operaciones (aumentado)
  serverSelectionTimeoutMS: 20000,   // 20 segundos para selección de servidor (aumentado)
  maxPoolSize: 10,                   // Máximo 10 conexiones simultáneas
  minPoolSize: 3,                    // Mantener al menos 3 conexiones
  maxIdleTimeMS: 60000,              // Cerrar conexiones inactivas después de 1 minuto
  retryWrites: true,                 // Reintentar escrituras fallidas
  w: 1,                              // Escribir a 1 nodo primario (en lugar de "majority")
  retryReads: true,                  // Añadido: reintentar lecturas fallidas
};

let client;
let clientPromise;
let cachedConnection = null;
let connectionPromise = null;
let connectionAttempt = 0;
const MAX_RETRY_ATTEMPTS = 5;       // Aumentado de 3 a 5 intentos

/**
 * Función para conectar a la base de datos con reintentos
 */
const createConnectionWithRetry = async () => {
  try {
    // Limpiar cualquier promesa anterior si existiera
    connectionPromise = null;
    
    // Incrementar el intento de conexión
    connectionAttempt++;
    
    if (connectionAttempt > MAX_RETRY_ATTEMPTS) {
      console.error(`MONGODB: Se superó el número máximo de intentos de conexión (${MAX_RETRY_ATTEMPTS})`);
      throw new Error(`No se pudo conectar a MongoDB después de ${MAX_RETRY_ATTEMPTS} intentos`);
    }
    
    console.log(`MONGODB: Intento de conexión #${connectionAttempt}...`);
    
    // Si ya tenemos un cliente, intentamos reutilizarlo
    if (client) {
      try {
        // Verificar si el cliente está conectado con un ping
        await client.db("admin").command({ ping: 1 });
        console.log("MONGODB: Reutilizando conexión existente");
        return client;
      } catch (pingError) {
        console.warn("MONGODB: La conexión existente no responde, creando una nueva", pingError.message);
        // Si el ping falla, intentamos crear un nuevo cliente
        try {
          await client.close();
        } catch (e) {
          // Ignoramos errores al cerrar
        }
      }
    }
    
    // Crear un nuevo cliente
    console.log(`MONGODB: Creando nuevo cliente para ${MONGODB_URI.split('@')[1] || 'la base de datos'}`);
    client = new MongoClient(MONGODB_URI, options);
    
    // Establecer un timeout para la conexión
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout al conectar a MongoDB")), options.connectTimeoutMS);
    });
    
    // Intentar conectar con timeout
    try {
      const connection = await Promise.race([
        client.connect(),
        timeoutPromise
      ]);
      
      // Verificar la conexión con un ping
      await client.db("admin").command({ ping: 1 });
      
      console.log(`MONGODB: Conexión establecida exitosamente después de ${connectionAttempt} intento(s)`);
      connectionAttempt = 0; // Resetear el contador de intentos
      
      // Verificar que podemos acceder a la base de datos específica
      const db = client.db(MONGODB_DB);
      const collections = await db.listCollections().limit(1).toArray();
      console.log(`MONGODB: Base de datos '${MONGODB_DB}' accesible`);
      
      return client;
    } catch (connError) {
      console.error(`MONGODB: Error al establecer conexión: ${connError.message}`);
      // Lanzar el error para que sea manejado por el bloque catch externo
      throw connError;
    }
  } catch (error) {
    console.error(`MONGODB: Error de conexión (intento ${connectionAttempt}):`, error.message);
    
    // Intentar diagnosticar problemas comunes
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('MONGODB: No se puede resolver el nombre del servidor. Posibles causas:');
      console.error('1. La URI de conexión contiene un nombre de host incorrecto');
      console.error('2. No hay conexión a Internet');
      console.error('3. Problemas con el DNS');
    } else if (error.message.includes('Authentication failed')) {
      console.error('MONGODB: Fallo de autenticación. Verifique el nombre de usuario y contraseña en la URI');
    } else if (error.message.includes('timed out')) {
      console.error('MONGODB: La conexión ha expirado. Posibles causas:');
      console.error('1. El servidor está caído o inaccesible');
      console.error('2. Problemas de red o firewall');
    }
    
    // Esperar antes de reintentar (tiempo exponencial)
    const retryDelay = Math.min(1000 * Math.pow(2, connectionAttempt), 10000);
    console.log(`MONGODB: Reintentando en ${retryDelay/1000} segundos...`);
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    
    // Reintentar recursivamente
    return createConnectionWithRetry();
  }
};

/**
 * Función principal para conectar a la base de datos
 */
export async function connectToDatabase() {
  try {
    // Si ya tenemos una conexión, la devolvemos
    if (cachedConnection) {
      try {
        // Verificar que la conexión sigue siendo válida
        await cachedConnection.client.db("admin").command({ ping: 1 });
        return cachedConnection;
      } catch (pingError) {
        console.error("MONGODB: Error verificando la conexión existente:", pingError);
        // La conexión no es válida, limpiarla para crear una nueva
        try {
          await cachedConnection.client.close();
        } catch (closeError) {
          // Ignorar errores al cerrar
        }
        cachedConnection = null;
      }
    }
    
    // Si hay una conexión en curso, esperamos a que termine
    if (connectionPromise) {
      return connectionPromise;
    }
    
    // Verificar la configuración
    if (!MONGODB_URI) {
      console.error("MONGODB: URI de conexión no definida");
      throw new Error('Por favor define la variable de entorno MONGODB_URI');
    }
    
    console.log(`MONGODB: Intentando conectar a ${MONGODB_URI.split('@')[1] || 'la base de datos'}`);
    
    // Creamos una nueva promesa de conexión
    connectionPromise = (async () => {
      const dbClient = await createConnectionWithRetry();
      const db = dbClient.db(MONGODB_DB);
      
      // Verificar que podemos acceder a las colecciones (prueba adicional)
      try {
        const collections = await db.listCollections().toArray();
        console.log(`MONGODB: Conexión exitosa. Colecciones disponibles: ${collections.length}`);
      } catch (error) {
        console.error("MONGODB: Error al listar colecciones:", error);
      }
      
      cachedConnection = { db, client: dbClient };
      return cachedConnection;
    })();
    
    return connectionPromise;
  } catch (error) {
    console.error("MONGODB: Error fatal al conectar:", error);
    throw error;
  }
} 