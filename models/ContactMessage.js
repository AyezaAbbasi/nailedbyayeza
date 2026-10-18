const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  subject: { type: String, default: '' },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  replied: { type: Boolean, default: false },
  reply_text: { type: String, default: '' },
  replied_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

contactMessageSchema.set('toJSON', {
  transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; }
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);