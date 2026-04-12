const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

const mustBeDriver = (req, res, next) => {
  if (req.user.role !== 'delivery')
    return res.status(403).json({ message: 'Delivery accounts only' });
  next();
};

// GET /api/driver/profile
// Get the driver's delivery_agent record
router.get('/profile', auth, mustBeDriver, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM delivery_agents WHERE user_id = ?', [req.user.user_id]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'Driver profile not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/driver/deliveries
// All deliveries assigned to this driver
router.get('/deliveries', auth, mustBeDriver, async (req, res) => {
  try {
    const [agent] = await pool.query(
      'SELECT agent_id FROM delivery_agents WHERE user_id = ?', [req.user.user_id]
    );
    if (!agent.length)
      return res.status(404).json({ message: 'Driver profile not found' });

    const agent_id = agent[0].agent_id;

    const [deliveries] = await pool.query(
      `SELECT d.*,
              o.total_amount, o.status as order_status, o.created_at as order_placed_at,
              r.name as restaurant_name, r.cuisine,
              u.name as customer_name, u.phone as customer_phone
       FROM deliveries d
       JOIN orders o     ON d.order_id  = o.order_id
       JOIN restaurants r ON o.restaurant_id = r.restaurant_id
       JOIN users u      ON o.user_id   = u.user_id
       WHERE d.agent_id = ?
       ORDER BY d.updated_at DESC`,
      [agent_id]
    );

    // Attach order items
    for (const del of deliveries) {
      const [items] = await pool.query(
        `SELECT oi.quantity, oi.price, m.name as item_name
         FROM order_items oi
         JOIN menu_items m ON oi.item_id = m.item_id
         WHERE oi.order_id = ?`,
        [del.order_id]
      );
      del.items = items;
    }

    res.json({ agent_id, deliveries });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/driver/deliveries/:delivery_id/status
// Driver updates delivery status: assigned → picked → delivering → delivered
router.patch('/deliveries/:delivery_id/status', auth, mustBeDriver, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['picked', 'delivering', 'delivered'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: 'Invalid status. Allowed: picked, delivering, delivered' });

  try {
    const [agent] = await pool.query(
      'SELECT agent_id FROM delivery_agents WHERE user_id = ?', [req.user.user_id]
    );
    if (!agent.length) return res.status(404).json({ message: 'Driver not found' });

    const [del] = await pool.query(
      'SELECT * FROM deliveries WHERE delivery_id = ? AND agent_id = ?',
      [req.params.delivery_id, agent[0].agent_id]
    );
    if (!del.length)
      return res.status(403).json({ message: 'Not your delivery' });

    await pool.query(
      'UPDATE deliveries SET status = ? WHERE delivery_id = ?',
      [status, req.params.delivery_id]
    );

    // Sync order status with delivery
    const orderStatusMap = { picked: 'out_for_delivery', delivering: 'out_for_delivery', delivered: 'delivered' };
    await pool.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [orderStatusMap[status], del[0].order_id]
    );

    // Free agent if delivered
    if (status === 'delivered') {
      await pool.query(
        'UPDATE delivery_agents SET available = TRUE WHERE agent_id = ?',
        [agent[0].agent_id]
      );
    }

    res.json({ message: 'Delivery status updated', status });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/driver/toggle-availability
router.patch('/toggle-availability', auth, mustBeDriver, async (req, res) => {
  try {
    await pool.query(
      'UPDATE delivery_agents SET available = NOT available WHERE user_id = ?',
      [req.user.user_id]
    );
    const [rows] = await pool.query(
      'SELECT available FROM delivery_agents WHERE user_id = ?', [req.user.user_id]
    );
    res.json({ available: rows[0].available });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
