import mongoose, { Schema, models } from 'mongoose';

const VideoProgressSchema = new Schema({
  videoId: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  watchedSeconds: {
    type: Number,
    default: 0
  },
  lastPosition: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const ProgressSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  totalProgress: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  videoProgress: [VideoProgressSchema],
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateId: {
    type: String,
    default: null
  },
  certificateUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas frecuentes
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
ProgressSchema.index({ userId: 1 });
ProgressSchema.index({ courseId: 1 });
ProgressSchema.index({ certificateId: 1 }, { sparse: true });

const Progress = models.Progress || mongoose.model('Progress', ProgressSchema);

export default Progress; 