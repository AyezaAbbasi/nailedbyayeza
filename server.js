require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const bcrypt = require('bcryptjs');

const Admin = require('./models/Admin');
const Product = require('./models/Product');
const Review = require('./models/Review');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nailedbyayeza';

// Vercel sits behind a proxy; needed so secure cookies work over https
app.set('trust proxy', 1);
app.use(express.json());

// Connect to MongoDB once and reuse the connection (serverless-friendly).
let dbReady = null;
function connectDB() {
  if (!dbReady) {
    dbReady = mongoose.connect(MONGO_URI).then(async () => {
      console.log('Connected to MongoDB');
      await seed();
    }).catch(err => { dbReady = null; throw err; });
  }
  return dbReady;
}
app.use(async (req, res, next) => {
  try { await connectDB(); next(); }
  catch (err) { res.status(500).json({ error: 'Database connection failed: ' + err.message }); }
});

// Sessions are stored in MongoDB so admin login survives between serverless calls.
app.use(session({
  secret: process.env.SESSION_SECRET || 'nailedbyayeza_dev_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 3, httpOnly: true, sameSite: 'lax', secure: !!process.env.VERCEL }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/custom-orders', require('./routes/customOrders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/homepage', require('./routes/homepage'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/customers', require('./routes/customers'));

async function seed() {
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    const password_hash = await bcrypt.hash('nailedbyayeza123', 10);
    await Admin.create({ username: 'admin', password_hash });
    console.log('Seeded default admin -> username: admin / password: nailedbyayeza123');
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.insertMany([
      { name: 'Pink French Tips', price: 2000, category: 'French Tips', shape_options: ['Almond', 'Oval'], stock: 8, is_best_seller: true, description: 'Classic pink french tip press-ons, hand-painted and reusable.' },
      { name: 'Burgundy Chrome', price: 2500, category: 'Chrome', shape_options: ['Almond', 'Coffin'], stock: 0, status: 'Sold Out', is_featured: true, description: 'Rich burgundy chrome finish with a mirror-like shine.' },
      { name: 'Floral Garden', price: 2200, category: 'Floral', stock: 3, is_new_arrival: true, description: 'Delicate hand-painted florals on a soft nude base.' },
      { name: 'Pearl Bridal', price: 3000, category: 'Bridal', stock: 12, is_featured: true, description: 'Elegant pearl-accented set designed for brides and special occasions.' },
      { name: 'Black 3D Embellished', price: 2800, category: '3D/Embellished', stock: 1, description: 'Bold black base with hand-placed 3D gems and studs.' },
      { name: 'Glitter Ombre', price: 1900, category: 'Glitter', stock: 15, is_new_arrival: true, description: 'Sparkling ombre glitter fade, perfect for a night out.' }
    ]);
    console.log('Seeded 6 sample products');
  }

  const reviewCount = await Review.countDocuments();
  if (reviewCount === 0) {
    await Review.insertMany([
      { customer_name: 'Hira K.', rating: 5, comment: 'The chrome set lasted my entire event season — so many compliments!' },
      { customer_name: 'Mahnoor A.', rating: 5, comment: 'Fit was perfect on the first try and application took two minutes.' },
      { customer_name: 'Zoya R.', rating: 4, comment: 'Custom set matched my outfit exactly. Ordering again for Eid.' }
    ]);
    console.log('Seeded sample reviews');
  }
}

// Local development: start the server. On Vercel the app is exported instead.
if (!process.env.VERCEL) {
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)))
    .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
}

module.exports = app;