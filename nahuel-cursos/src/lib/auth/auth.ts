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
      // Solución rápida: permitimos el inicio de sesión sin esperar a MongoDB
      // Asignamos un ID temporal que será sincronizado más tarde
      if (!user.id) {
        user.id = `temp_${Date.now()}`;
        user.role = process.env.ADMIN_EMAIL === user.email ? 'admin' : 'user';
        
        // Agregamos propiedades básicas del usuario
        if (user.name) {
          const nameParts = user.name.split(' ');
          user.nombre = nameParts[0] || '';
          user.apellido = nameParts.slice(1).join(' ') || '';
        }
        user.telefono = '';
        
        console.log('Usuario temporal creado para autenticación rápido:', user.email);
        
        // Iniciamos un proceso asíncrono para guardar/actualizar el usuario
        // Este proceso se ejecuta en paralelo sin bloquear la autenticación
        setTimeout(async () => {
          try {
            const { db } = await connectToDatabase();
            
            // Verificamos si el usuario ya existe
            const existingUser = await db.collection('usuarios').findOne({ email: user.email });
            
            if (existingUser) {
              // Solo actualizamos la fecha de último login
              await db.collection('usuarios').updateOne(
                { email: user.email },
                { $set: { lastLogin: new Date() } }
              );
              console.log('Usuario existente actualizado en segundo plano:', user.email);
            } else {
              // Crear nuevo usuario
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
              
              await db.collection('usuarios').insertOne(userData);
              console.log('Nuevo usuario creado en segundo plano:', user.email);
            }
          } catch (error) {
            console.error('Error en el proceso asíncrono de actualización de usuario:', error);
          }
        }, 100);
      }
      
      return true;
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
        } 
        // Si es una actualización, obtener la información más reciente de la base de datos
        else if (trigger === 'update' && token?.id) {
          try {
            const { db } = await connectToDatabase();
            const currentUser = await db.collection('usuarios').findOne(
              { _id: new ObjectId(token.id) }
            );
            
            if (currentUser) {
              // Actualizar el token con la información más reciente
              token.nombre = currentUser.nombre;
              token.apellido = currentUser.apellido;
              token.telefono = currentUser.telefono;
              token.role = currentUser.admin ? 'admin' : 'user';
              
              console.log('Token actualizado con datos de la BD:', {
                id: token.id,
                telefono: currentUser.telefono
              });
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
        
        console.log('Sesión actualizada:', {
          id: session.user.id,
          telefono: session.user.telefono
        });
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
    const { db } = await connectToDatabase();
    const user = await db.collection('usuarios').findOne({ _id: new ObjectId(userId) });
    
    // Si el usuario es administrador o ha comprado el curso, tiene acceso
    return user?.admin || user?.cursosComprados?.includes(courseId);
  } catch (error) {
    console.error('Error al verificar acceso al curso:', error);
    return false;
  }
}; 