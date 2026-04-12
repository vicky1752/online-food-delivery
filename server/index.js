require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/shopkeeper', require('./routes/shopkeeper'));
app.use('/api/driver', require('./routes/driver'));

// Health check (also tests DB)
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message, time: new Date() });
  }
});

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`\n🚀 Foodie API running on http://localhost:${PORT}`);
  console.log(`📋 DB: ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`);
  // Test DB connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully\n');
  } catch (err) {
    console.error('❌ Database connection FAILED:', err.message);
    console.error('   → Check your .env file: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('   → Make sure MySQL is running and credentials are correct\n');
  }
});
