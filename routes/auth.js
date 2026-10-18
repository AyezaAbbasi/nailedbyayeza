const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const router = express.Router();

router.post('/', async (req, res) => {
  const { action, username, password, newPassword } = req.body;

  if (action === 'logout') {
    req.session.destroy(() => res.json({ success: true }));
    return;
  }

  if (action === 'change_password') {
    if (!req.session || !req.session.adminId) return res.status(403).json({ error: 'Admin login required' });
    const admin = await Admin.findById(req.session.adminId);
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    admin.password_hash = await bcrypt.hash(newPassword, 10);
    await admin.save();
    return res.json({ success: true });
  }

  // default: login
  try {
    const admin = await Admin.findOne({ username });
    if (admin && (await bcrypt.compare(password, admin.password_hash))) {
      req.session.adminId = admin._id.toString();
      req.session.adminUsername = admin.username;
      res.json({ success: true, username: admin.username });
    } else {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.adminId), username: req.session ? req.session.adminUsername : null });
});

module.exports = router;