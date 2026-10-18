const express = require('express');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const requireAdmin = require('../middleware/requireAdmin');
const makeUploader = require('../middleware/upload');

const router = express.Router();
const upload = makeUploader('products', 5);

// GET /api/products  -> list, with optional filters/sorting (public)
// query params: category, shape, length, color(unused-placeholder), minPrice, maxPrice, status, sort, search
router.get('/', async (req, res) => {
  const q = {};
  if (req.query.category) q.category = req.query.category;
  if (req.query.shape) q.shape_options = req.query.shape;
  if (req.query.length) q.length_options = req.query.length;
  if (req.query.status) q.status = req.query.status;
  if (req.query.minPrice || req.query.maxPrice) {
    q.price = {};
    if (req.query.minPrice) q.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) q.price.$lte = Number(req.query.maxPrice);
  }
  if (req.query.search) q.name = { $regex: req.query.search, $options: 'i' };
  if (req.query.newArrivals) q.is_new_arrival = true;
  if (req.query.bestSellers) q.is_best_seller = true;
  if (req.query.featured) q.is_featured = true;

  let sort = { created_at: -1 };
  if (req.query.sort === 'price_asc') sort = { price: 1 };
  if (req.query.sort === 'price_desc') sort = { price: -1 };
  if (req.query.sort === 'newest') sort = { created_at: -1 };

  const products = await Product.find(q).sort(sort);
  res.json(products);
});

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

// POST /api/products (multipart/form-data, up to 6 images under field "images") -> create (admin)
router.post('/', requireAdmin, upload.array('images', 6), async (req, res) => {
  try {
    const b = req.body;
    const images = (req.files || []).map((f, i) => ({ path: f.path, is_main: i === 0 }));

    const product = await Product.create({
      name: b.name,
      price: Number(b.price),
      category: b.category,
      description: b.description,
      shape_options: b.shape_options ? JSON.parse(b.shape_options) : undefined,
      length_options: b.length_options ? JSON.parse(b.length_options) : undefined,
      size_options: b.size_options ? JSON.parse(b.size_options) : undefined,
      finish: b.finish,
      whats_included: b.whats_included,
      application_time: b.application_time,
      wear_time: b.wear_time,
      stock: Number(b.stock) || 0,
      status: b.status || 'Available',
      is_new_arrival: b.is_new_arrival === 'true' || b.is_new_arrival === true,
      is_best_seller: b.is_best_seller === 'true' || b.is_best_seller === true,
      is_featured: b.is_featured === 'true' || b.is_featured === true,
      images
    });
    res.json({ success: true, id: product._id.toString() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/products/:id  (JSON) -> edit text fields, stock, status, flags (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  const allowed = ['name', 'price', 'category', 'description', 'finish', 'whats_included',
    'application_time', 'wear_time', 'stock', 'status', 'is_new_arrival', 'is_best_seller', 'is_featured',
    'shape_options', 'length_options', 'size_options'];
  const update = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
  await Product.findByIdAndUpdate(req.params.id, update);
  res.json({ success: true });
});

// PUT /api/products/:id/stock  { stock_delta }  -> quick +/- (admin)
router.put('/:id/stock', requireAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  product.stock = Math.max(0, product.stock + Number(req.body.stock_delta));
  if (product.stock === 0) product.status = 'Sold Out';
  await product.save();
  res.json({ success: true, stock: product.stock });
});

// POST /api/products/:id/images (multipart, field "images") -> add more photos (admin)
router.post('/:id/images', requireAdmin, upload.array('images', 6), async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  const newImages = (req.files || []).map(f => ({ path: f.path, is_main: product.images.length === 0 }));
  product.images.push(...newImages);
  await product.save();
  res.json({ success: true, images: product.images });
});

// DELETE /api/products/:id/images/:imageIndex -> remove one photo (admin)
router.delete('/:id/images/:imageIndex', requireAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  const idx = Number(req.params.imageIndex);
  const img = product.images[idx];
  if (img) {
    const filePath = path.join(__dirname, '..', 'public', img.path);
    fs.unlink(filePath, () => {});
    const wasMain = img.is_main;
    product.images.splice(idx, 1);
    if (wasMain && product.images.length > 0) product.images[0].is_main = true;
  }
  await product.save();
  res.json({ success: true, images: product.images });
});

// PUT /api/products/:id/images/:imageIndex/main -> set as main photo (admin)
router.put('/:id/images/:imageIndex/main', requireAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  const idx = Number(req.params.imageIndex);
  product.images.forEach((img, i) => { img.is_main = (i === idx); });
  await product.save();
  res.json({ success: true, images: product.images });
});

// PUT /api/products/:id/images/reorder  { order: [0,2,1] } -> reorder photos (admin)
router.put('/:id/images/reorder', requireAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  const order = req.body.order;
  const reordered = order.map(i => product.images[i]);
  product.images = reordered;
  await product.save();
  res.json({ success: true, images: product.images });
});

// DELETE /api/products/:id -> remove product entirely + its photos (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    product.images.forEach(img => {
      const filePath = path.join(__dirname, '..', 'public', img.path);
      fs.unlink(filePath, () => {});
    });
  }
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;