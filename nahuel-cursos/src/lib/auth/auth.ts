import { connectToDatabase } from '@/lib/db/connection';
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { ObjectId } from 'mongodb';

// Extender los tipos de NextAuth
declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    nombre?: string;
    apellido?: string;
    telefono?: string;
  }
  
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      nombre?: string | null;
      apellido?: string | null;
      telefono?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    nombre?: string;
    apellido?: string;
    telefono?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Crear un usuario válido inmediatamente en vez de asignarle un ID temporal
        console.log('Iniciando proceso de autenticación para:', user.email);
        
        // Asignamos valores por defecto temporalmente mientras hacemos la conexión a MongoDB
        let tempId = `temp_${Date.now()}`;
        user.id = tempId;
        user.role = process.env.ADMIN_EMAIL === user.email ? 'admin' : 'user';
        
        // Extraer información básica del perfil
        if (user.name) {
          const nameParts = user.name.split(' ');
          user.nombre = nameParts[0] || '';
          user.apellido = nameParts.slice(1).join(' ') || '';
        }
        user.telefono = '';
        
        // Intentar conectar a la base de datos inmediatamente
        try {
          const { db } = await connectToDatabase();
          console.log('Conexión a MongoDB establecida para autenticación');
          
          // Buscar si el usuario ya existe
          const existingUser = await db.collection('usuarios').findOne({ email: user.email });
          
          if (existingUser) {
            // Usuario existente - asignar ID real y actualizar último login
            console.log('Usuario existente encontrado:', existingUser._id.toString());
            user.id = existingUser._id.toString();
            user.role = existingUser.admin ? 'admin' : 'user';
            user.nombre = existingUser.nombre || user.nombre;
            user.apellido = existingUser.apellido || user.apellido;
            user.telefono = existingUser.telefono || '';
            
            // Actualizar fecha de último login en segundo plano
            db.collection('usuarios').updateOne(
              { _id: existingUser._id },
              { $set: { lastLogin: new Date() } }
            ).then(() => {
              console.log('Fecha de último login actualizada para:', user.email);
            }).catch(err => {
              console.error('Error al actualizar fecha de login:', err);
            });
          } else {
            // Crear nuevo usuario inmediatamente
            console.log('Creando nuevo usuario en MongoDB para:', user.email);
            const userData = {
              email: user.email,
              nombre: user.nombre || '',
              apellido: user.apellido || '',
              telefono: '',
              admin: process.env.ADMIN_EMAIL === user.email,
              createdAt: new Date(),
              lastLogin: new Date(),
              image: user.image,
              cursosComprados: [],
            };
            
            const result = await db.collection('usuarios').insertOne(userData);
            if (result.acknowledged && result.insertedId) {
              // Asignar el ID real generado por MongoDB
              user.id = result.insertedId.toString();
              console.log('Nuevo usuario creado con ID:', user.id);
            } else {
              console.error('Error al crear usuario en MongoDB, sin ID generado');
              // Mantenemos el ID temporal como último recurso
            }
          }
        } catch (dbError) {
          console.error('Error al conectar con MongoDB durante la autenticación:', dbError);
          // Si hay un error, seguimos con el ID temporal
          // El usuario podrá intentar sincronizar más tarde
        }
        
        console.log('Proceso de autenticación completado para:', user.email, 'con ID:', user.id);
        return true;
      } catch (authError) {
        console.error('Error general en el proceso de autenticación:', authError);
        // Si hay un error grave, permitimos el login de todos modos con ID temporal
        // para no bloquear el acceso a los usuarios
        return true;
      }
    },
    async jwt({ token, user, account, profile, trigger }) {
      // Si estamos actualizando la sesión o hay un nuevo inicio de sesión
      if (trigger === 'update' || user) {
        // Si hay información de usuario, actualizar el token
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.nombre = user.nombre;
          token.apellido = user.apellido;
          token.telefono = user.telefono;
          
          console.log('Token JWT actualizado desde información de usuario:', {
            id: token.id,
            email: user.email
          });
        } 
        // Si es una actualización, obtener la información más reciente de la base de datos
        else if (trigger === 'update') {
          try {
            console.log('Actualizando token JWT desde la base de datos');
            const { db } = await connectToDatabase();
            
            // Si el token tiene un ID temporal o no es un ObjectId válido,
            // intentamos buscar por email
            if (token.id?.startsWith('temp_') || !ObjectId.isValid(token.id)) {
              console.log('Token con ID temporal o inválido, buscando por email');
              if (token.email) {
                const userByEmail = await db.collection('usuarios').findOne(
                  { email: token.email }
                );
                
                if (userByEmail) {
                  // Actualizar el ID y otros datos
                  token.id = userByEmail._id.toString();
                  token.nombre = userByEmail.nombre;
                  token.apellido = userByEmail.apellido;
                  token.telefono = userByEmail.telefono;
                  token.role = userByEmail.admin ? 'admin' : 'user';
                  
                  console.log('Token actualizado con ID real desde email:', {
                    id: token.id,
                    email: token.email
                  });
                }
              }
            } 
            // Si tenemos un ID válido, buscar por ID
            else if (ObjectId.isValid(token.id)) {
              try {
                const currentUser = await db.collection('usuarios').findOne(
                  { _id: new ObjectId(token.id) }
                );
                
                if (currentUser) {
                  // Actualizar el token con la información más reciente
                  token.nombre = currentUser.nombre;
                  token.apellido = currentUser.apellido;
                  token.telefono = currentUser.telefono;
                  token.role = currentUser.admin ? 'admin' : 'user';
                  
                  console.log('Token actualizado con datos de la BD por ID:', {
                    id: token.id
                  });
                }
              } catch (idError) {
                console.error('Error al buscar usuario por ID:', idError);
              }
            }
          } catch (error) {
            console.error('Error al actualizar el token desde la BD:', error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.nombre = token.nombre;
        session.user.apellido = token.apellido;
        session.user.telefono = token.telefono;
        
        console.log('Sesión actualizada desde token JWT:', {
          id: session.user.id,
          email: session.user.email
        });
        
        // Si todavía tenemos un ID temporal, intentar sincronizar
        if (session.user.id?.startsWith('temp_') && session.user.email) {
          try {
            console.log('Sesión con ID temporal, intentando sincronizar');
            const { db } = await connectToDatabase();
            
            // Buscar usuario por email
            const userByEmail = await db.collection('usuarios').findOne({ email: session.user.email });
            
            if (userByEmail) {
              // Actualizar el ID de la sesión
              session.user.id = userByEmail._id.toString();
              console.log('Sesión sincronizada con ID real:', session.user.id);
            } else {
              // Si no existe el usuario, crear uno nuevo
              console.log('Creando usuario durante sincronización de sesión');
              const userData = {
                email: session.user.email,
                nombre: session.user.nombre || '',
                apellido: session.user.apellido || '',
                telefono: session.user.telefono || '',
                admin: process.env.ADMIN_EMAIL === session.user.email,
                createdAt: new Date(),
                lastLogin: new Date(),
                image: session.user.image,
                cursosComprados: [],
              };
              
              const result = await db.collection('usuarios').insertOne(userData);
              if (result.acknowledged && result.insertedId) {
                session.user.id = result.insertedId.toString();
                console.log('Usuario creado durante sincronización con ID:', session.user.id);
              }
            }
          } catch (syncError) {
            console.error('Error durante sincronización de sesión:', syncError);
          }
        }
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      console.log('Usuario ha iniciado sesión:', user.email);
    },
    async signOut({ token }) {
      console.log('Usuario ha cerrado sesión');
    },
    async updateUser({ user }) {
      console.log('Usuario actualizado:', user.email);
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error: (code, metadata) => {
      console.error('NextAuth Error:', { code, metadata });
    },
    warn: (code) => {
      console.warn('NextAuth Warning:', code);
    },
    debug: (code, metadata) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('NextAuth Debug:', { code, metadata });
      }
    }
  },
};

// Middleware para verificar si un usuario es administrador
export const isAdmin = (session: any) => {
  return session?.user?.role === 'admin';
};

// Middleware para verificar si un usuario está autenticado
export const isAuthenticated = (session: any) => {
  return !!session?.user;
};

// Middleware para verificar si un usuario tiene acceso a un curso
export const hasCourseAccess = async (userId: string, courseId: string) => {
  try {
    console.log('Verificando acceso a curso:', { userId, courseId });
    
    // Validaciones iniciales
    if (!userId || !courseId) {
      console.log('ID de usuario o curso no proporcionado');
      return false;
    }
    
    // Si es un ID temporal, no tiene acceso
    if (userId.startsWith('temp_')) {
      console.log('ID temporal, sin acceso');
      return false;
    }
    
    // Intentar encontrar al usuario
    const { db } = await connectToDatabase();
    
    // Validar formato de ObjectId para el ID de usuario
    let usuario = null;
    
    try {
      if (ObjectId.isValid(userId)) {
        usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(userId) });
      }
    } catch (error) {
      console.error('Error al buscar usuario por ID:', error);
    }
    
    // Log para diagnóstico
    if (!usuario) {
      console.log('Usuario no encontrado por ID');
      return false;
    }
    
    // Si el usuario es administrador, tiene acceso a todo
    if (usuario.admin) {
      console.log('Usuario es administrador, acceso concedido');
      return true;
    }
    
    // Si el usuario no tiene cursos comprados, no tiene acceso
    if (!usuario.cursosComprados || !Array.isArray(usuario.cursosComprados)) {
      console.log('Usuario no tiene cursos comprados');
      return false;
    }
    
    // Normalizar el ID del curso para comparación
    const courseIdStr = courseId.toString();
    
    // Verificar si el curso está en la lista de cursos comprados
    const tieneCurso = usuario.cursosComprados.some((id: any) => {
      if (!id) return false;
      
      // Convertir a string para comparaciones simples
      const idStr = typeof id === 'string' ? id : id.toString();
      return idStr === courseIdStr;
    });
    
    console.log('Resultado de verificación de acceso a curso:', {
      tieneAcceso: tieneCurso,
      cursosComprados: usuario.cursosComprados.length
    });
    
    return tieneCurso;
  } catch (error) {
    console.error('Error al verificar acceso al curso:', error);
    return false;
  }
}; 