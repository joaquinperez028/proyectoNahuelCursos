import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: function() {
      return !this.packId; // courseId es requerido solo si no hay packId
    }
  },
  packId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pack',
    required: function() {
      return !this.courseId; // packId es requerido solo si no hay courseId
    }
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['MercadoPago', 'PayPal', 'Transferencia', 'Otro'],
    default: 'MercadoPago'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['approved', 'pending', 'rejected', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentDetails: {
    type: Object
  },
  invoiceUrl: {
    type: String
  },
  // Campos adicionales que pueden ser útiles
  currency: {
    type: String,
    default: 'ARS'
  },
  installments: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true // Agrega automáticamente createdAt y updatedAt
});

// Índices para mejorar el rendimiento de las consultas frecuentes
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ courseId: 1 });
PaymentSchema.index({ packId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentDate: 1 });
PaymentSchema.index({ paymentMethod: 1 });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema); 