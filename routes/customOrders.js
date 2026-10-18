const express = require('express');
const CustomOrder = require('../models/CustomOrder');
const requireAdmin = require('../middleware/requireAdmin');
const makeUploader = require('../middleware/upload');
const { sendCustomOrderEmail } = require('../utils/mailer');

const router = express.Router();
const upload = makeUploader('custom', 5);

async function nextRequestNumber() {
  const last = await CustomOrder.findOne().sort({ request_number: -1 });
  return last ? last.request_number + 1 : 1;
}

// POST /api/custom-orders (multipart, optional "inspiration_image") -> public
router.post('/', upload.single('inspiration_image'), async (req, res) => {
  const b = req.body;
  if (!b.customer_name || !b.phone) return res.status(400).json({ error: 'Name and phone are required' });
  const request = await CustomOrder.create({
    request_number: await nextRequestNumber(),
    customer_name: b.customer_name,
    phone: b.phone,
    email: b.email || '',
    color: b.color,
    shape: b.shape,
    length: b.length,
    description: b.description,
    inspiration_image: req.file ? req.file.path : null
  });
  await sendCustomOrderEmail(request);
  res.json({ success: true, request_number: request.request_number });
});

// GET /api/custom-orders -> admin only
router.get('/', requireAdmin, async (req, res) => {
  const q = {};
  if (req.query.status) q.status = req.query.status;
  const requests = await CustomOrder.find(q).sort({ created_at: -1 });
  res.json(requests);
});

// PUT /api/custom-orders/:id  { status } -> Accept/Reject (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  await CustomOrder.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.json({ success: true });
});

module.exports = router;