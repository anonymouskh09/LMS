const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

module.exports = router;
