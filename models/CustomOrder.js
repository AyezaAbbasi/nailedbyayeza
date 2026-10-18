const mongoose = require('mongoose');

const customOrderSchema = new mongoose.Schema({
  request_number: { type: Number, required: true, unique: true },
  customer_name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  color: String,
  shape: String,
  length: String,
  description: String,
  inspiration_image: { type: String, default: null },
  status: { type: String, enum: ['New', 'Accepted', 'Rejected'], default: 'New' },
  created_at: { type: Date, default: Date.now }
});

customOrderSchema.set('toJSON', {
  transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; }
});

module.exports = mongoose.model('CustomOrder', customOrderSchema);