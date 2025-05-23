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
      // Buscar usuario por email para determinar si es admin
      await connectToDatabase();
      const userExists = await User.findOne({ email: session.user?.email });
      
      if (userExists) {
        session.user.id = userExists._id.toString();
        session.user.role = userExists.role;
      }
      
      return session;
    },
    async signIn({ user }) {
      try {
        await connectToDatabase();
        
        // Verificar si el usuario ya existe
        const userExists = await User.findOne({ email: user.email });
        
        // Si no existe, crear un nuevo usuario
        if (!userExists) {
          const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
          
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            role: adminEmails.includes(user.email as string) ? "admin" : "user",
            courses: [],
          });
        }
        
        return true;
      } catch (error) {
        console.error("Error durante el registro:", error);
        return false;
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 