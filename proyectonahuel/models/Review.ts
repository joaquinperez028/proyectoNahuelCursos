import mongoose, { Schema, models } from 'mongoose';

const ReviewSchema = new Schema({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  isFakeUser: {
    type: Boolean,
    default: false,
  },
  fakeUserName: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

ReviewSchema.pre('save', function(next) {
  if (this.isFakeUser && !this.fakeUserName) {
    next(new Error('fakeUserName es requerido cuando isFakeUser es true'));
  } else if (!this.isFakeUser && !this.userId) {
    next(new Error('userId es requerido cuando isFakeUser es false'));
  } else {
    next();
  }
});

const Review = models.Review || mongoose.model('Review', ReviewSchema);

export default Review; 