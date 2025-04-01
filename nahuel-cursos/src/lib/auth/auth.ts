import { connectToDatabase } from '@/lib/db/connection';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

// Extender los tipos de NextAuth
declare module "next-auth" {
  interface User {
    id: string;
    role: string;
  }
  
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos');
        }

        try {
          const db = await connectToDatabase();
          const user = await db.collection('usuarios').findOne({ email: credentials.email });

          if (!user) {
            throw new Error('Usuario no encontrado');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error('Contraseña incorrecta');
          }

          return {
            id: user._id.toString(),
            name: user.nombre,
            email: user.email,
            role: user.admin ? 'admin' : 'user',
          };
        } catch (error) {
          console.error('Error en autenticación:', error);
          throw new Error('Error al intentar iniciar sesión');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
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
    const db = await connectToDatabase();
    const user = await db.collection('usuarios').findOne({ _id: new ObjectId(userId) });
    
    // Si el usuario es administrador o ha comprado el curso, tiene acceso
    return user?.admin || user?.cursosComprados?.includes(courseId);
  } catch (error) {
    console.error('Error al verificar acceso al curso:', error);
    return false;
  }
}; 