const express = require('express');
const Review = require('../models/Review');
const requireAdmin = require('../middleware/requireAdmin');
const makeUploader = require('../middleware/upload');

const router = express.Router();
const upload = makeUploader('reviews', 5);

router.get('/', async (req, res) => {
  const q = { approved: true };
  if (req.query.product_id) q.product_id = req.query.product_id;
  const reviews = await Review.find(q).sort({ created_at: -1 });
  res.json(reviews);
});

router.post('/', upload.single('image'), async (req, res) => {
  const { customer_name, rating, comment, product_id } = req.body;
  if (!customer_name || !comment || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'customer_name, comment, and a rating from 1-5 are required' });
  }
  const review = await Review.create({
    customer_name, rating, comment, product_id: product_id || null,
    image: req.file ? req.file.path : null
  });
  res.json({ success: true, id: review._id.toString() });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;