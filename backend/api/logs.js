const express = require('express');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'principal' && req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Admin/HOD access required' });
  }
  next();
};

// Apply authentication and admin check
router.use(verifyToken);
router.use(isAdmin);

// Get System Logs
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const [logs] = await pool.query(
      `SELECT sl.*, u.name as user_name, u.email as user_email, u.role as user_role
       FROM system_logs sl
       LEFT JOIN users u ON sl.user_id = u.id
       ORDER BY sl.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM system_logs');
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching system logs' });
  }
});

// Log Action (helper function - can be called from other routes)
const logAction = async (user_id, action, entity_type, entity_id, description, ip_address, user_agent) => {
  try {
    await pool.query(
      `INSERT INTO system_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, action, entity_type, entity_id, description, ip_address, user_agent]
    );
  } catch (error) {
    console.error('Log action error:', error);
  }
};

// Export log function for use in other modules
router.logAction = logAction;

module.exports = router;
