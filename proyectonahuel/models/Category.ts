import mongoose, { Schema, models } from 'mongoose';

const CategorySchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  icon: {
    type: String,
    required: true,
    trim: true,
    // Almacenaremos el SVG como string o el nombre del ícono
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Middleware para generar slug automáticamente
CategorySchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9áéíóúñü\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  next();
});

const Category = models.Category || mongoose.model('Category', CategorySchema);

export default Category; 