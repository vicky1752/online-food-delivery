const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/cart/add
router.post('/add', auth, async (req, res) => {
  const { item_id, quantity } = req.body;
  const user_id = req.user.user_id;
  try {
    // Check if item already in cart
    const [existing] = await pool.query(
      'SELECT * FROM cart WHERE user_id = ? AND item_id = ?',
      [user_id, item_id]
    );
    if (existing.length > 0) {
      await pool.query(
        'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?',
        [quantity || 1, user_id, item_id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart (user_id, item_id, quantity) VALUES (?, ?, ?)',
        [user_id, item_id, quantity || 1]
      );
    }
    res.json({ message: 'Item added to cart' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/cart
router.get('/', auth, async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await pool.query(
      `SELECT c.cart_id, c.quantity, m.item_id, m.name, m.price, m.image_url, m.restaurant_id,
              r.name as restaurant_name
       FROM cart c
       JOIN menu_items m ON c.item_id = m.item_id
       JOIN restaurants r ON m.restaurant_id = r.restaurant_id
       WHERE c.user_id = ?`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/cart/update/:cart_id
router.put('/update/:cart_id', auth, async (req, res) => {
  const { quantity } = req.body;
  const user_id = req.user.user_id;
  try {
    if (quantity <= 0) {
      await pool.query('DELETE FROM cart WHERE cart_id = ? AND user_id = ?', [req.params.cart_id, user_id]);
    } else {
      await pool.query(
        'UPDATE cart SET quantity = ? WHERE cart_id = ? AND user_id = ?',
        [quantity, req.params.cart_id, user_id]
      );
    }
    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/cart/remove/:cart_id
router.delete('/remove/:cart_id', auth, async (req, res) => {
  const user_id = req.user.user_id;
  try {
    await pool.query('DELETE FROM cart WHERE cart_id = ? AND user_id = ?', [req.params.cart_id, user_id]);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', auth, async (req, res) => {
  const user_id = req.user.user_id;
  try {
    await pool.query('DELETE FROM cart WHERE user_id = ?', [user_id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
