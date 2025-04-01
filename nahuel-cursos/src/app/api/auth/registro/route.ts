import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Esquema de validación para el registro
const registroSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Debe proporcionar un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validar datos de entrada
    const validacion = registroSchema.safeParse(data);
    if (!validacion.success) {
      return NextResponse.json(
        { error: validacion.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { nombre, email, password } = validacion.data;
    const db = await connectToDatabase();
    
    // Verificar si el email ya está registrado
    const usuarioExistente = await db.collection('usuarios').findOne({ email });
    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }
    
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Crear el nuevo usuario
    const resultado = await db.collection('usuarios').insertOne({
      nombre,
      email,
      password: passwordHash,
      admin: false,
      cursosComprados: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    if (!resultado.acknowledged) {
      throw new Error('Error al crear el usuario');
    }
    
    // No devolver la contraseña ni información sensible
    return NextResponse.json(
      { 
        mensaje: 'Usuario registrado exitosamente',
        usuario: {
          id: resultado.insertedId,
          nombre,
          email
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return NextResponse.json(
      { error: 'Error al registrar el usuario' },
      { status: 500 }
    );
  }
} 