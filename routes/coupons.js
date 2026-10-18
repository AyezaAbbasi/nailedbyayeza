const express = require('express');
const Coupon = require('../models/Coupon');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  const coupons = await Coupon.find().sort({ created_at: -1 });
  res.json(coupons);
});

// POST /api/coupons/validate  { code } -> public, used at checkout
router.post('/validate', async (req, res) => {
  const coupon = await Coupon.findOne({ code: (req.body.code || '').toUpperCase(), active: true });
  if (!coupon) return res.status(404).json({ valid: false, error: 'Invalid or expired coupon' });
  res.json({ valid: true, discount_percent: coupon.discount_percent });
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.create({ code: req.body.code, discount_percent: req.body.discount_percent });
    res.json({ success: true, id: coupon._id.toString() });
  } catch (err) {
    res.status(400).json({ error: err.code === 11000 ? 'That coupon code already exists' : err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  await Coupon.findByIdAndUpdate(req.params.id, { active: req.body.active });
  res.json({ success: true });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;