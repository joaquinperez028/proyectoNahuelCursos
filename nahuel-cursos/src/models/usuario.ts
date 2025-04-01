import mongoose, { Schema, models, model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface Usuario {
  _id?: string;
  nombre: string;
  email: string;
  password?: string;
  admin: boolean;
  cursosComprados: string[]; // IDs de los cursos comprados
}

const usuarioSchema = new Schema<Usuario>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido']
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false // No devolver la contraseña en las consultas
    },
    admin: {
      type: Boolean,
      default: false
    },
    cursosComprados: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
  }
);

// Middleware para hashear la contraseña antes de guardar
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para verificar la contraseña
usuarioSchema.methods.verificarPassword = async function(password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

export default models.Usuario || model<Usuario>('Usuario', usuarioSchema); 