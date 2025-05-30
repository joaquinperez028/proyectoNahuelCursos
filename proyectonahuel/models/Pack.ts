import mongoose, { Schema, models } from 'mongoose';

const PackSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course', required: true }],
  imageUrl: { type: String },
  imageData: {
    data: { type: String },
    contentType: { type: String }
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const Pack = models.Pack || mongoose.model('Pack', PackSchema);
export default Pack; 