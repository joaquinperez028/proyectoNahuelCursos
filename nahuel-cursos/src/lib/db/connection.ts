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
  connectTimeoutMS: 10000,           // 10 segundos para timeout de conexión
  socketTimeoutMS: 45000,           // 45 segundos para operaciones
  serverSelectionTimeoutMS: 10000,   // 10 segundos para selección de servidor
  maxPoolSize: 10,                   // Máximo 10 conexiones simultáneas
  minPoolSize: 3,                    // Mantener al menos 3 conexiones
  maxIdleTimeMS: 60000,              // Cerrar conexiones inactivas después de 1 minuto
  retryWrites: true,                 // Reintentar escrituras fallidas
  w: 1,                              // Escribir a 1 nodo primario (en lugar de "majority")
};

let client;
let clientPromise;
let cachedConnection = null;
let connectionPromise = null;
let connectionAttempt = 0;
const MAX_RETRY_ATTEMPTS = 3;

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
        console.warn("MONGODB: La conexión existente no responde, creando una nueva");
        // Si el ping falla, intentamos crear un nuevo cliente
        try {
          await client.close();
        } catch (e) {
          // Ignoramos errores al cerrar
        }
      }
    }
    
    // Crear un nuevo cliente
    client = new MongoClient(MONGODB_URI, options);
    
    // Establecer un timeout para la conexión
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout al conectar a MongoDB")), options.connectTimeoutMS);
    });
    
    // Intentar conectar con timeout
    const connection = await Promise.race([
      client.connect(),
      timeoutPromise
    ]);
    
    // Verificar la conexión con un ping
    await client.db("admin").command({ ping: 1 });
    
    console.log(`MONGODB: Conexión establecida exitosamente después de ${connectionAttempt} intento(s)`);
    connectionAttempt = 0; // Resetear el contador de intentos
    
    return client;
  } catch (error) {
    console.error(`MONGODB: Error de conexión (intento ${connectionAttempt}):`, error);
    
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
      return cachedConnection;
    }
    
    // Si hay una conexión en curso, esperamos a que termine
    if (connectionPromise) {
      return connectionPromise;
    }
    
    // Creamos una nueva promesa de conexión
    connectionPromise = (async () => {
      const dbClient = await createConnectionWithRetry();
      const db = dbClient.db(MONGODB_DB);
      
      cachedConnection = { db, client: dbClient };
      return cachedConnection;
    })();
    
    return connectionPromise;
  } catch (error) {
    console.error("MONGODB: Error fatal al conectar:", error);
    throw error;
  }
} 