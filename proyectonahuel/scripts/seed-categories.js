const mongoose = require('mongoose');

// Esquema de categoría
const CategorySchema = new mongoose.Schema({
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

const Category = mongoose.model('Category', CategorySchema);

// Categorías iniciales
const initialCategories = [
  {
    title: 'Análisis Técnico',
    description: 'Domina el análisis de gráficos y patrones para anticipar movimientos del mercado con precisión.',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
    order: 1,
  },
  {
    title: 'Análisis Fundamental',
    description: 'Evalúa el valor real de activos financieros mediante datos clave y análisis profundo.',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>',
    order: 2,
  },
  {
    title: 'Estrategias de Trading',
    description: 'Descubre técnicas probadas, gestión monetaria y psicología avanzada del trading.',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>',
    order: 3,
  },
  {
    title: 'Finanzas Personales',
    description: 'Organiza tu dinero, maximiza tus ahorros y planifica tu futuro financiero.',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg>',
    order: 4,
  },
];

async function seedCategories() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdb');
    console.log('Conectado a MongoDB');

    // Verificar si ya existen categorías
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      console.log(`Ya existen ${existingCount} categorías. No se insertarán nuevas.`);
      return;
    }

    // Insertar categorías iniciales
    const result = await Category.insertMany(initialCategories);
    console.log(`✅ Se insertaron ${result.length} categorías exitosamente:`);
    result.forEach(cat => {
      console.log(`  - ${cat.title} (${cat.slug})`);
    });

  } catch (error) {
    console.error('❌ Error al insertar categorías:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar el script
if (require.main === module) {
  seedCategories();
}

module.exports = { seedCategories, Category }; 