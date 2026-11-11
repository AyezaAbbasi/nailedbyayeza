const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const HomepageContent = require('../models/HomepageContent');
const requireAdmin = require('../middleware/requireAdmin');
const { sendOrderEmail } = require('../utils/mailer');
const makeUploader = require('../middleware/upload');

const router = express.Router();
const upload = makeUploader('sizing', 4); // coin-method sizing photo; browser shrinks it first, 4MB stays under Vercel's ~4.5MB request cap

async function nextOrderNumber() {
  const last = await Order.findOne().sort({ order_number: -1 });
  return last ? last.order_number + 1 : 1001;
}

// POST /api/orders (multipart/form-data: fields + optional "sizing_photo" file) -> place order (public)
router.post('/', upload.single('sizing_photo'), async (req, res) => {
  try {
    const b = req.body;
    const items = JSON.parse(b.items || '[]');
    if (!items.length) return res.status(400).json({ error: 'Cart is empty' });

    let total = 0;
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) return res.status(400).json({ error: `Product ${item.product_id} no longer exists` });
      if (product.stock < item.quantity) return res.status(409).json({ error: `'${product.name}' only has ${product.stock} left in stock` });
      total += product.price * item.quantity;
    }

    let discount = 0;
    if (b.coupon_code) {
      const coupon = await Coupon.findOne({ code: b.coupon_code.toUpperCase(), active: true });
      if (coupon) discount = Math.round(total * (coupon.discount_percent / 100));
    }

    // delivery charge is admin-configurable (Homepage settings), default 250 —
    // computed server-side so it can't be tampered with from the client.
    // Looks for a rate matching the customer's city first, then their province,
    // and falls back to the default delivery charge.
    const homepage = await HomepageContent.findOne();
    let deliveryCharge = homepage ? homepage.delivery_charge : 250;
    if (homepage && homepage.delivery_rates && homepage.delivery_rates.length) {
      const norm = s => String(s || '').trim().toLowerCase();
      const byCity = homepage.delivery_rates.find(r => norm(r.location) === norm(b.city));
      const byProvince = homepage.delivery_rates.find(r => norm(r.location) === norm(b.province));
      const match = byCity || byProvince;
      if (match) deliveryCharge = match.charge;
    }

    const order = await Order.create({
      order_number: await nextOrderNumber(),
      customer_name: b.customer_name,
      phone: b.phone,
      email: b.email,
      house_street: b.house_street,
      area: b.area,
      city: b.city,
      province: b.province,
      postal_code: b.postal_code,
      items,
      total: total - discount + deliveryCharge,
      payment_method: b.payment_method,
      coupon_code: b.coupon_code || null,
      discount,
      delivery_charge: deliveryCharge,
      sizing_photo: req.file ? req.file.path : null
    });

    for (const item of items) {
      await Product.findByIdAndUpdate(item.product_id, { $inc: { stock: -item.quantity } });
    }

    await sendOrderEmail(order); // must finish before responding — Vercel stops the function once the response is sent

    res.json({ success: true, order_id: order._id.toString(), order_number: order.order_number, total: order.total });
  } catch (err) {
    res.status(500).json({ error: 'Could not place order: ' + err.message });
  }
});

// GET /api/orders -> admin only, optional ?status=New
router.get('/', requireAdmin, async (req, res) => {
  const q = {};
  if (req.query.status) q.status = req.query.status;
  const orders = await Order.find(q).sort({ created_at: -1 });
  res.json(orders);
});

// GET /api/orders/:id -> single order (used by order confirmation page too, no admin required
// since the customer needs to see their own confirmation)
router.get('/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// PUT /api/orders/:id  { status } -> update status (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.json({ success: true });
});

module.exports = router;