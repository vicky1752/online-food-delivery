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

// POST /api/shopkeeper/restaurant
// Create a new restaurant for the shopkeeper
router.post('/restaurant', auth, mustBeRestaurant, async (req, res) => {
  const { name, cuisine, image_url } = req.body;
  if (!name || !cuisine) return res.status(400).json({ message: 'Name and cuisine are required' });

  try {
    // Check if one already exists
    const [existing] = await pool.query('SELECT restaurant_id FROM restaurants WHERE user_id = ?', [req.user.user_id]);
    if (existing.length > 0) return res.status(400).json({ message: 'Restaurant already exists' });

    const [result] = await pool.query(
      'INSERT INTO restaurants (user_id, name, cuisine, image_url, rating, is_open) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.user_id, name, cuisine, image_url || '', 5.0, true]
    );
    res.status(201).json({ message: 'Restaurant created successfully', restaurant_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/shopkeeper/my-restaurant
// Update the shopkeeper's restaurant profile
router.patch('/my-restaurant', auth, mustBeRestaurant, async (req, res) => {
  const { name, cuisine, image_url } = req.body;
  try {
    const [existing] = await pool.query('SELECT restaurant_id FROM restaurants WHERE user_id = ?', [req.user.user_id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Restaurant not found' });

    let query = 'UPDATE restaurants SET ';
    const params = [];
    if (name) { query += 'name = ?, '; params.push(name); }
    if (cuisine) { query += 'cuisine = ?, '; params.push(cuisine); }
    if (image_url !== undefined) { query += 'image_url = ?, '; params.push(image_url); }
    
    // Remove trailing comma and space
    query = query.slice(0, -2);
    query += ' WHERE user_id = ?';
    params.push(req.user.user_id);

    if (params.length > 1) {
      await pool.query(query, params);
    }
    
    res.json({ message: 'Profile updated successfully' });
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
      `SELECT o.*, 
              u.name as customer_name, u.phone as customer_phone,
              d.agent_id, da.name as agent_name
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       LEFT JOIN deliveries d ON o.order_id = d.order_id
       LEFT JOIN delivery_agents da ON d.agent_id = da.agent_id
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

    // Late assignment logic: if advancing state but no driver assigned yet
    if (status === 'preparing' || status === 'out_for_delivery') {
      const [existingDelivery] = await pool.query('SELECT delivery_id FROM deliveries WHERE order_id = ?', [req.params.id]);
      if (existingDelivery.length === 0) {
        // Try to allocate one
        const [agents] = await pool.query('SELECT agent_id FROM delivery_agents WHERE available = TRUE LIMIT 1');
        if (agents.length > 0) {
          const agent_id = agents[0].agent_id;
          await pool.query('INSERT INTO deliveries (order_id, agent_id, status) VALUES (?, ?, "assigned")', [req.params.id, agent_id]);
          await pool.query('UPDATE delivery_agents SET available = FALSE WHERE agent_id = ?', [agent_id]);
        } else if (status === 'out_for_delivery') {
          return res.status(400).json({ message: 'Cannot mark Out for Delivery - no drivers available yet. Wait for a driver.' });
        }
      }
    }

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

// POST /api/shopkeeper/menu
// Add a new menu item
router.post('/menu', auth, mustBeRestaurant, async (req, res) => {
  const { name, description, price, category, image_url } = req.body;
  if (!name || !price) return res.status(400).json({ message: 'Name and price are required' });

  try {
    const [rest] = await pool.query('SELECT restaurant_id FROM restaurants WHERE user_id = ?', [req.user.user_id]);
    if (!rest.length) return res.status(404).json({ message: 'No restaurant found' });
    
    const [result] = await pool.query(
      'INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, available) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [rest[0].restaurant_id, name, description || '', price, category || 'General', image_url || '', true]
    );
    res.status(201).json({ message: 'Item created', item_id: result.insertId });
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
