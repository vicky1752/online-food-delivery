const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Middleware: must be restaurant role
const mustBeRestaurant = (req, res, next) => {
  if (req.user.role !== 'restaurant')
    return res.status(403).json({ message: 'Restaurant accounts only' });
  next();
};

// GET /api/shopkeeper/my-restaurant
// Returns the restaurant linked to the logged-in owner
router.get('/my-restaurant', auth, mustBeRestaurant, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM restaurants WHERE user_id = ?', [req.user.user_id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'No restaurant linked to this account' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/shopkeeper/orders
// All orders for the owner's restaurant (newest first)
router.get('/orders', auth, mustBeRestaurant, async (req, res) => {
  try {
    const [rest] = await pool.query(
      'SELECT restaurant_id FROM restaurants WHERE user_id = ?', [req.user.user_id]
    );
    if (rest.length === 0)
      return res.status(404).json({ message: 'No restaurant linked to this account' });

    const restaurant_id = rest[0].restaurant_id;
    const [orders] = await pool.query(
      `SELECT o.*, u.name as customer_name, u.phone as customer_phone
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       WHERE o.restaurant_id = ?
       ORDER BY o.created_at DESC`,
      [restaurant_id]
    );

    // Attach items to each order
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, m.name as item_name
         FROM order_items oi
         JOIN menu_items m ON oi.item_id = m.item_id
         WHERE oi.order_id = ?`,
        [order.order_id]
      );
      order.items = items;
    }

    res.json({ restaurant_id, orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/shopkeeper/orders/:id/status
// Restaurant can move order through: placed→confirmed→preparing→out_for_delivery
router.patch('/orders/:id/status', auth, mustBeRestaurant, async (req, res) => {
  const { status } = req.body;
  const allowed = ['confirmed', 'preparing', 'out_for_delivery'];
  if (!allowed.includes(status))
    return res.status(400).json({ message: 'Invalid status. Allowed: confirmed, preparing, out_for_delivery' });

  try {
    // Verify this order belongs to the owner's restaurant
    const [rest] = await pool.query(
      'SELECT restaurant_id FROM restaurants WHERE user_id = ?', [req.user.user_id]
    );
    const [order] = await pool.query(
      'SELECT restaurant_id FROM orders WHERE order_id = ?', [req.params.id]
    );
    if (!rest.length || !order.length || rest[0].restaurant_id !== order[0].restaurant_id)
      return res.status(403).json({ message: 'Not your restaurant\'s order' });

    await pool.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated', status });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/shopkeeper/menu
router.get('/menu', auth, mustBeRestaurant, async (req, res) => {
  try {
    const [rest] = await pool.query(
      'SELECT restaurant_id FROM restaurants WHERE user_id = ?', [req.user.user_id]
    );
    if (!rest.length) return res.status(404).json({ message: 'No restaurant found' });
    const [items] = await pool.query(
      'SELECT * FROM menu_items WHERE restaurant_id = ?', [rest[0].restaurant_id]
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/shopkeeper/menu/:item_id/toggle
// Toggle item availability
router.patch('/menu/:item_id/toggle', auth, mustBeRestaurant, async (req, res) => {
  try {
    const [rest] = await pool.query(
      'SELECT restaurant_id FROM restaurants WHERE user_id = ?', [req.user.user_id]
    );
    await pool.query(
      'UPDATE menu_items SET available = NOT available WHERE item_id = ? AND restaurant_id = ?',
      [req.params.item_id, rest[0].restaurant_id]
    );
    res.json({ message: 'Item availability toggled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/shopkeeper/toggle-open
// Open/close the restaurant
router.patch('/toggle-open', auth, mustBeRestaurant, async (req, res) => {
  try {
    await pool.query(
      'UPDATE restaurants SET is_open = NOT is_open WHERE user_id = ?',
      [req.user.user_id]
    );
    const [rows] = await pool.query(
      'SELECT is_open FROM restaurants WHERE user_id = ?', [req.user.user_id]
    );
    res.json({ is_open: rows[0].is_open });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
