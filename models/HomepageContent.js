const mongoose = require('mongoose');

const homepageSchema = new mongoose.Schema({
  banner_title: { type: String, default: 'Salon-quality nails, made from home.' },
  banner_subtitle: { type: String, default: 'Handmade, reusable press-on nails — custom designs welcome.' },
  banner_image: { type: String, default: null },
  featured_product_ids: { type: [String], default: [] },
  promotions_text: { type: String, default: '' },
  delivery_charge: { type: Number, default: 250 }
});

homepageSchema.set('toJSON', {
  transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; }
});

module.exports = mongoose.model('HomepageContent', homepageSchema);