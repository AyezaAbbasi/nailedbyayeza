const express = require('express');
const CustomOrder = require('../models/CustomOrder');
const requireAdmin = require('../middleware/requireAdmin');
const makeUploader = require('../middleware/upload');
const { sendCustomOrderEmail, sendCustomOrderDecision } = require('../utils/mailer');

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

// PUT /api/custom-orders/:id  { status, message? } -> Accept/Reject (admin)
// If "message" is given, it is emailed to the customer along with the decision.
router.put('/:id', requireAdmin, async (req, res) => {
  const { status, message } = req.body;
  if (!['New', 'Accepted', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const request = await CustomOrder.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const text = (message || '').trim();
  if (text) {
    try {
      await sendCustomOrderDecision(request, status, text);
    } catch (err) {
      // Email failed -> do NOT change the status, so the admin can fix and retry.
      return res.status(500).json({ error: 'Email not sent: ' + err.message });
    }
    request.decision_message = text;
    request.decided_at = new Date();
  }
  request.status = status;
  await request.save();
  res.json({ success: true, emailed: !!text });
});

module.exports = router;