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