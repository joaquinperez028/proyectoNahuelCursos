import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('🔍 DEBUG SESSION:', {
      hasSession: !!session,
      sessionUser: session?.user,
      sessionEmail: session?.user?.email
    });

    if (!session?.user?.email) {
      return NextResponse.json({ 
        debug: 'No session found',
        session: null 
      });
    }

    await connectToDatabase();

    // Buscar el usuario en la base de datos
    const dbUser = await User.findOne({ email: session.user.email });
    
    console.log('🔍 DB USER:', {
      found: !!dbUser,
      email: dbUser?.email,
      name: dbUser?.name,
      role: dbUser?.role
    });

    return NextResponse.json({
      debug: 'Session and user info',
      session: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        id: session.user.id,
        role: (session.user as any).role
      },
      dbUser: dbUser ? {
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        courses: dbUser.courses?.length || 0,
        createdAt: dbUser.createdAt
      } : null,
      emailsMatch: session.user.email === dbUser?.email
    });
    
  } catch (error) {
    console.error('❌ Error in debug session:', error);
    return NextResponse.json({ 
      error: 'Error interno',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 