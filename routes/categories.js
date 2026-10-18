const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

const DEFAULT_CATEGORIES = [
  'New Arrivals', 'Best Sellers', 'Simple/Minimal', 'French Tips', 'Floral',
  'Glitter', 'Chrome', '3D/Embellished', 'Cute/Kawaii', 'Bridal', 'Custom Nails', 'Seasonal Collections'
];

router.get('/', async (req, res) => {
  const used = await Product.distinct('category');
  const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...used]));
  res.json(merged);
});

module.exports = router;