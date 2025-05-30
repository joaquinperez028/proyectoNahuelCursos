import mongoose, { Schema, models } from 'mongoose';

const VideoSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  videoId: {
    type: String,
    required: true
  },
  playbackId: {
    type: String,
    required: true
  },
  duration: {
    type: Number
  },
  order: {
    type: Number,
    default: 0
  }
});

const ExerciseSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  fileData: {
    data: Buffer,
    contentType: String
  },
  order: {
    type: Number,
    default: 0
  }
});

const CourseSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  isFree: {
    type: Boolean,
    default: false,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  videoId: {
    type: String,
    required: true,
  },
  playbackId: {
    type: String,
    required: true,
  },
  introVideoId: {
    type: String,
  },
  introPlaybackId: {
    type: String,
  },
  thumbnailUrl: {
    type: String,
  },
  thumbnailImage: {
    data: Buffer,
    contentType: String,
  },
  videos: [VideoSchema],
  exercises: [ExerciseSchema],
  featured: {
    type: Boolean,
    default: false,
  },
  onSale: {
    type: Boolean,
    default: false,
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  duration: {
    type: Number,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: 'Review',
  }],
}, {
  timestamps: true,
});

// Método virtual para calcular el precio con descuento
CourseSchema.virtual('discountedPrice').get(function() {
  if (!this.onSale || this.discountPercentage <= 0) {
    return this.price;
  }
  return this.price - (this.price * (this.discountPercentage / 100));
});

// Asegurarse de que los virtuals se incluyan cuando se convierte a JSON
CourseSchema.set('toJSON', { virtuals: true });
CourseSchema.set('toObject', { virtuals: true });

const Course = models.Course || mongoose.model('Course', CourseSchema);

export default Course; 