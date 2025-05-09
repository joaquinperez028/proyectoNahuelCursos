import mongoose, { Schema, models } from 'mongoose';

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

const Course = models.Course || mongoose.model('Course', CourseSchema);

export default Course; 