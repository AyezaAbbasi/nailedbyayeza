const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const CustomOrder = require('../models/CustomOrder');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  const [totalOrders, newOrders, processingOrders, shippedOrders, completedOrders] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'New' }),
    Order.countDocuments({ status: 'Processing' }),
    Order.countDocuments({ status: 'Shipped' }),
    Order.countDocuments({ status: 'Completed' })
  ]);

  const salesAgg = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);
  const totalSales = salesAgg[0] ? salesAgg[0].total : 0;

  const lowStock = await Product.find({ stock: { $gt: 0, $lte: 3 } }).select('name stock');
  const outOfStock = await Product.countDocuments({ status: 'Sold Out' });
  const pendingCustomOrders = await CustomOrder.countDocuments({ status: 'New' });

  const topProductsAgg = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.product_name', qty: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    { $sort: { qty: -1 } },
    { $limit: 5 }
  ]);

  res.json({
    total_sales: totalSales,
    total_orders: totalOrders,
    orders_by_status: { New: newOrders, Processing: processingOrders, Shipped: shippedOrders, Completed: completedOrders },
    low_stock: lowStock,
    out_of_stock_count: outOfStock,
    pending_custom_orders: pendingCustomOrders,
    top_products: topProductsAgg
  });
});

module.exports = router;