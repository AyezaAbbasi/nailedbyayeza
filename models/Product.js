const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'Simple/Minimal' },
  description: { type: String, default: '' },
  shape_options: { type: [String], default: ['Almond', 'Coffin', 'Oval', 'Square', 'Stiletto'] },
  length_options: { type: [String], default: ['Short', 'Medium', 'Long'] },
  size_options: { type: [String], default: ['XS', 'S', 'M', 'L', 'Custom'] },
  finish: { type: String, default: '' },
  whats_included: { type: String, default: '' },
  application_time: { type: String, default: '15-20 minutes' },
  wear_time: { type: String, default: 'Up to 2 weeks' },
  stock: { type: Number, default: 0 },
  status: { type: String, enum: ['Available', 'Sold Out'], default: 'Available' },
  is_new_arrival: { type: Boolean, default: false },
  is_best_seller: { type: Boolean, default: false },
  is_featured: { type: Boolean, default: false },
  images: [{
    path: String,
    is_main: { type: Boolean, default: false }
  }],
  created_at: { type: Date, default: Date.now }
});

productSchema.set('toJSON', {
  transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; }
});

module.exports = mongoose.model('Product', productSchema);