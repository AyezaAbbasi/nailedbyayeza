const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_number: { type: Number, required: true, unique: true },
  customer_name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  house_street: String,
  area: String,
  city: String,
  province: String,
  postal_code: String,
  items: [{
    product_id: String,
    product_name: String,
    price: Number,
    quantity: Number,
    size: String,
    shape: String,
    length: String
  }],
  total: { type: Number, default: 0 },
  payment_method: { type: String, required: true },
  coupon_code: { type: String, default: null },
  discount: { type: Number, default: 0 },
  delivery_charge: { type: Number, default: 0 },
  sizing_photo: { type: String, default: null },
  status: { type: String, enum: ['New', 'Processing', 'Shipped', 'Completed', 'Cancelled'], default: 'New' },
  created_at: { type: Date, default: Date.now }
});

orderSchema.set('toJSON', {
  transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; }
});

module.exports = mongoose.model('Order', orderSchema);