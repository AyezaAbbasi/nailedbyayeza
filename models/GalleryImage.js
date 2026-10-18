const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  path: { type: String, required: true },
  caption: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

galleryImageSchema.set('toJSON', {
  transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; }
});

module.exports = mongoose.model('GalleryImage', galleryImageSchema);