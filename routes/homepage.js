const express = require('express');
const HomepageContent = require('../models/HomepageContent');
const requireAdmin = require('../middleware/requireAdmin');
const makeUploader = require('../middleware/upload');

const router = express.Router();
const upload = makeUploader('banner', 5);

async function getSingleton() {
  let doc = await HomepageContent.findOne();
  if (!doc) doc = await HomepageContent.create({});
  return doc;
}

router.get('/', async (req, res) => {
  res.json(await getSingleton());
});

router.put('/', requireAdmin, upload.single('banner_image'), async (req, res) => {
  const doc = await getSingleton();
  if (req.body.banner_title !== undefined) doc.banner_title = req.body.banner_title;
  if (req.body.banner_subtitle !== undefined) doc.banner_subtitle = req.body.banner_subtitle;
  if (req.body.promotions_text !== undefined) doc.promotions_text = req.body.promotions_text;
  if (req.body.featured_product_ids) doc.featured_product_ids = JSON.parse(req.body.featured_product_ids);
  if (req.body.delivery_charge !== undefined && req.body.delivery_charge !== '') doc.delivery_charge = Number(req.body.delivery_charge);
  if (req.file) doc.banner_image = req.file.path;
  await doc.save();
  res.json({ success: true });
});

module.exports = router;