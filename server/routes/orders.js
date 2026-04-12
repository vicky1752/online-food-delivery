const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/orders  — Place an order from cart
router.post('/', auth, async (req, res) => {
  const user_id = req.user.user_id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch cart items
    const [cartItems] = await conn.query(
      `SELECT c.cart_id, c.item_id, c.quantity, m.price, m.restaurant_id
       FROM cart c JOIN menu_items m ON c.item_id = m.item_id
       WHERE c.user_id = ?`,
      [user_id]
    );
    if (cartItems.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // All items must be from same restaurant
    const restaurant_id = cartItems[0].restaurant_id;
    const mixed = cartItems.some(i => i.restaurant_id !== restaurant_id);
    if (mixed) {
      await conn.rollback();
      return res.status(400).json({ message: 'All items must be from the same restaurant' });
    }

    const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Create order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, restaurant_id, total_amount, status) VALUES (?, ?, ?, "placed")',
      [user_id, restaurant_id, total]
    );
    const order_id = orderResult.insertId;

    // Insert order items
    for (const item of cartItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [order_id, item.item_id, item.quantity, item.price]
      );
    }

    // Auto-assign delivery agent
    const [agents] = await conn.query(
      'SELECT agent_id FROM delivery_agents WHERE available = TRUE LIMIT 1'
    );
    if (agents.length > 0) {
      const agent_id = agents[0].agent_id;
      await conn.query(
        'INSERT INTO deliveries (order_id, agent_id, status) VALUES (?, ?, "assigned")',
        [order_id, agent_id]
      );
      await conn.query(
        'UPDATE delivery_agents SET available = FALSE WHERE agent_id = ?',
        [agent_id]
      );
    }

    // Clear cart
    await conn.query('DELETE FROM cart WHERE user_id = ?', [user_id]);

    await conn.commit();
    res.status(201).json({ message: 'Order placed successfully', order_id, total });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/orders/my  — All orders for current user
router.get('/my', auth, async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [orders] = await pool.query(
      `SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image
       FROM orders o JOIN restaurants r ON o.restaurant_id = r.restaurant_id
       WHERE o.user_id = ? ORDER BY o.created_at DESC`,
      [user_id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/orders/:id  — Single order detail
router.get('/:id', auth, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, r.name as restaurant_name FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.restaurant_id
       WHERE o.order_id = ?`,
      [req.params.id]
    );
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });

    const [items] = await pool.query(
      `SELECT oi.*, m.name as item_name, m.image_url FROM order_items oi
       JOIN menu_items m ON oi.item_id = m.item_id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    const [delivery] = await pool.query(
      `SELECT d.*, da.name as agent_name, da.phone as agent_phone
       FROM deliveries d JOIN delivery_agents da ON d.agent_id = da.agent_id
       WHERE d.order_id = ?`,
      [req.params.id]
    );

    res.json({ ...orders[0], items, delivery: delivery[0] || null });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/orders/:id/status  — Update order status (admin/restaurant)
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: 'Invalid status' });

  try {
    await pool.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, req.params.id]);

    // If delivered, sync delivery status and free agent
    if (status === 'delivered') {
      await pool.query(
        'UPDATE deliveries SET status = "delivered" WHERE order_id = ?',
        [req.params.id]
      );
      const [del] = await pool.query('SELECT agent_id FROM deliveries WHERE order_id = ?', [req.params.id]);
      if (del.length > 0) {
        await pool.query(
          'UPDATE delivery_agents SET available = TRUE WHERE agent_id = ?',
          [del[0].agent_id]
        );
      }
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
