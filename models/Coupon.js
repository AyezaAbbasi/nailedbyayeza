const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount_percent: { type: Number, required: true, min: 1, max: 100 },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

couponSchema.set('toJSON', {
  transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; }
});

module.exports = mongoose.model('Coupon', couponSchema);