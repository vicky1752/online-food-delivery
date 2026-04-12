const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// GET /api/restaurants?search=name&cuisine=Indian
router.get('/', async (req, res) => {
  try {
    const { search, cuisine } = req.query;

    let query = 'SELECT * FROM restaurants WHERE is_open = TRUE';
    const params = [];

    if (cuisine && cuisine !== 'All') {
      query += ' AND cuisine = ?';
      params.push(cuisine);
    }

    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR cuisine LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ' ORDER BY rating DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /restaurants error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/restaurants/all — include closed ones (for admin/seed check)
router.get('/all', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM restaurants ORDER BY rating DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/restaurants/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM restaurants WHERE restaurant_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/restaurants/:id/menu
router.get('/:id/menu', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM menu_items WHERE restaurant_id = ? AND available = TRUE ORDER BY category, name',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/restaurants/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.name as user_name FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.restaurant_id = ? ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/restaurants/:id/reviews  (auth required inline)
const auth = require('../middleware/auth');
router.post('/:id/reviews', auth, async (req, res) => {
  const { rating, comment } = req.body;
  const restaurant_id = req.params.id;
  const user_id = req.user.user_id;
  try {
    await pool.query(
      'INSERT INTO reviews (user_id, restaurant_id, rating, comment) VALUES (?, ?, ?, ?)',
      [user_id, restaurant_id, rating, comment]
    );
    // Update average rating
    await pool.query(
      'UPDATE restaurants SET rating = (SELECT AVG(rating) FROM reviews WHERE restaurant_id = ?) WHERE restaurant_id = ?',
      [restaurant_id, restaurant_id]
    );
    res.status(201).json({ message: 'Review submitted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
