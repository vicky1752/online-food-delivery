const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/delivery/assign
router.post('/assign', auth, async (req, res) => {
  const { order_id } = req.body;
  try {
    const [agents] = await pool.query(
      'SELECT agent_id FROM delivery_agents WHERE available = TRUE LIMIT 1'
    );
    if (agents.length === 0)
      return res.status(503).json({ message: 'No delivery agents available' });

    const agent_id = agents[0].agent_id;
    const [existing] = await pool.query('SELECT * FROM deliveries WHERE order_id = ?', [order_id]);
    if (existing.length > 0)
      return res.status(409).json({ message: 'Delivery already assigned' });

    await pool.query(
      'INSERT INTO deliveries (order_id, agent_id, status) VALUES (?, ?, "assigned")',
      [order_id, agent_id]
    );
    await pool.query('UPDATE delivery_agents SET available = FALSE WHERE agent_id = ?', [agent_id]);
    res.json({ message: 'Delivery assigned', agent_id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/delivery/track/:order_id
router.get('/track/:order_id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, da.name as agent_name, da.phone as agent_phone,
              o.status as order_status, o.total_amount, o.created_at as order_placed_at
       FROM deliveries d
       JOIN delivery_agents da ON d.agent_id = da.agent_id
       JOIN orders o ON d.order_id = o.order_id
       WHERE d.order_id = ?`,
      [req.params.order_id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'No delivery info found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/delivery/:delivery_id/status
router.patch('/:delivery_id/status', auth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['assigned', 'picked', 'delivering', 'delivered'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: 'Invalid status' });
  try {
    await pool.query('UPDATE deliveries SET status = ? WHERE delivery_id = ?', [status, req.params.delivery_id]);
    if (status === 'delivered') {
      const [del] = await pool.query('SELECT agent_id, order_id FROM deliveries WHERE delivery_id = ?', [req.params.delivery_id]);
      if (del.length > 0) {
        await pool.query('UPDATE delivery_agents SET available = TRUE WHERE agent_id = ?', [del[0].agent_id]);
        await pool.query('UPDATE orders SET status = "delivered" WHERE order_id = ?', [del[0].order_id]);
      }
    }
    res.json({ message: 'Delivery status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
