const express = require('express');
const path = require('path');
const fs = require('fs');
const GalleryImage = require('../models/GalleryImage');
const requireAdmin = require('../middleware/requireAdmin');
const makeUploader = require('../middleware/upload');

const router = express.Router();
const upload = makeUploader('gallery', 5);

router.get('/', async (req, res) => {
  const images = await GalleryImage.find().sort({ created_at: -1 });
  res.json(images);
});

router.post('/', requireAdmin, upload.array('images', 10), async (req, res) => {
  const docs = await GalleryImage.insertMany(
    (req.files || []).map(f => ({ path: f.path, caption: req.body.caption || '' }))
  );
  res.json({ success: true, images: docs });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const img = await GalleryImage.findById(req.params.id);
  if (img) {
    const filePath = path.join(__dirname, '..', 'public', img.path);
    fs.unlink(filePath, () => {});
  }
  await GalleryImage.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;