const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product_id: { type: String, default: null },
  customer_name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  image: { type: String, default: null },
  approved: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

reviewSchema.set('toJSON', {
  transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; }
});

module.exports = mongoose.model('Review', reviewSchema);