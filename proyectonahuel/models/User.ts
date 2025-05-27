import mongoose, { Schema, models } from 'mongoose';

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  courses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course',
  }],
}, {
  timestamps: true,
});

const User = models.User || mongoose.model('User', UserSchema);

export default User; 