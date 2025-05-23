import mongoose, { Schema, models } from 'mongoose';

const LessonSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  videoId: {
    type: String,
    required: true
  },
  exerciseId: {
    type: String,
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas frecuentes
LessonSchema.index({ courseId: 1, order: 1 });

const Lesson = models.Lesson || mongoose.model('Lesson', LessonSchema);

export default Lesson; 