const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const requireAdmin = require('../middleware/requireAdmin');
const { sendContactNotification, sendContactReply } = require('../utils/mailer');

const router = express.Router();

// Public: customer sends a message from the Contact page
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required' });
    const msg = await ContactMessage.create({ name, email, phone, subject, message });
    await sendContactNotification(msg); // must finish before responding on Vercel
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not send message: ' + err.message });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  const messages = await ContactMessage.find().sort({ created_at: -1 });
  res.json(messages);
});

router.put('/:id/read', requireAdmin, async (req, res) => {
  await ContactMessage.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
});

// Admin: reply to the customer by email, and remember that we replied
router.post('/:id/reply', requireAdmin, async (req, res) => {
  try {
    const reply = String((req.body && req.body.reply) || '').trim();
    if (!reply) return res.status(400).json({ error: 'Please write a reply first' });
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    await sendContactReply(msg, reply);
    msg.replied = true; msg.reply_text = reply; msg.replied_at = new Date(); msg.read = true;
    await msg.save();
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: 'Could not send reply: ' + err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await ContactMessage.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;