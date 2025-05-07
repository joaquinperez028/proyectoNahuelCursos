import mongoose, { Schema, models, model } from 'mongoose';

export interface Curso {
  _id?: string;
  titulo: string;
  descripcion: string;
  precio: number;
  video: string; // URL del video incrustado
  videoPreview: string; // URL del video de vista previa
  fechaCreacion: Date;
  categorias?: string[];
  // Campos para Mux
  muxVideoId?: string; // ID de reproducción de Mux para el video completo
  muxVideoPreviewId?: string; // ID de reproducción de Mux para la vista previa
  muxAssetId?: string; // ID del asset en Mux
}

const cursoSchema = new Schema<Curso>(
  {
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [100, 'El título no puede tener más de 100 caracteres']
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo']
    },
    video: {
      type: String,
      required: [true, 'La URL del video es obligatoria']
    },
    videoPreview: {
      type: String,
      required: [true, 'La URL del video de vista previa es obligatoria']
    },
    fechaCreacion: {
      type: Date,
      default: Date.now
    },
    categorias: {
      type: [String],
      default: []
    },
    // Campos para Mux
    muxVideoId: {
      type: String,
      default: null
    },
    muxVideoPreviewId: {
      type: String,
      default: null
    },
    muxAssetId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

// Índices para búsqueda y filtrado
cursoSchema.index({ titulo: 'text', descripcion: 'text' });
cursoSchema.index({ precio: 1 });
cursoSchema.index({ fechaCreacion: -1 });
cursoSchema.index({ categorias: 1 });

export default models.Curso || model<Curso>('Curso', cursoSchema); 