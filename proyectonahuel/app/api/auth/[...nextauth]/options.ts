import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async session({ session }) {
      try {
        // Validar que tenemos un email válido
        if (!session?.user?.email) {
          console.warn('⚠️ Sesión sin email válido');
          return session;
        }

        console.log('🔍 NextAuth Session Callback para:', session.user.email);

        await connectToDatabase();
        
        // Buscar usuario por email con validación estricta
        const userExists = await User.findOne({ email: session.user.email });
        
        if (userExists) {
          // VALIDACIÓN CRÍTICA: Asegurar que el email coincide exactamente
          if (userExists.email !== session.user.email) {
            console.error('🚨 MISMATCH EN SESSION CALLBACK:', {
              sessionEmail: session.user.email,
              dbEmail: userExists.email
            });
            throw new Error('Error de datos de usuario en sesión');
          }

          console.log('✅ Usuario encontrado en Session Callback:', {
            email: userExists.email,
            name: userExists.name,
            role: userExists.role
          });

          session.user.id = userExists._id.toString();
          session.user.role = userExists.role;
        } else {
          console.warn('⚠️ Usuario no encontrado en DB para:', session.user.email);
        }
        
        return session;
      } catch (error) {
        console.error('❌ Error en session callback:', error);
        // En caso de error, devolver sesión básica para evitar corromper la aplicación
        return session;
      }
    },
    async signIn({ user }) {
      try {
        console.log('🔍 NextAuth SignIn Callback para:', user.email);
        
        await connectToDatabase();
        
        // Verificar si el usuario ya existe
        const userExists = await User.findOne({ email: user.email });
        
        // Si no existe, crear un nuevo usuario
        if (!userExists) {
          const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
          
          console.log('👤 Creando nuevo usuario:', user.email);
          
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            role: adminEmails.includes(user.email as string) ? "admin" : "user",
            courses: [],
          });
          
          console.log('✅ Usuario creado exitosamente:', user.email);
        } else {
          console.log('✅ Usuario existente encontrado:', user.email);
        }
        
        return true;
      } catch (error) {
        console.error("❌ Error durante el registro:", error);
        return false;
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 