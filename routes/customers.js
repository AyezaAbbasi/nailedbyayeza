const express = require('express');
const Order = require('../models/Order');
const requireAdmin = require('../middleware/requireAdmin');
const router = express.Router();

// Derived from orders (no separate customer accounts / login for shoppers)
router.get('/', requireAdmin, async (req, res) => {
  const grouped = await Order.aggregate([
    { $group: {
        _id: '$phone',
        name: { $last: '$customer_name' },
        email: { $last: '$email' },
        phone: { $last: '$phone' },
        orders_count: { $sum: 1 },
        total_spent: { $sum: '$total' },
        last_order: { $max: '$created_at' }
      }
    },
    { $sort: { last_order: -1 } }
  ]);
  res.json(grouped);
});

module.exports = router;