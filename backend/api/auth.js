const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// Get public campuses list for signup
router.get('/campuses', async (req, res) => {
  try {
    const [campuses] = await pool.query('SELECT id, name FROM campuses WHERE is_active = TRUE');
    res.json({ success: true, campuses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching departments' });
  }
});

// Signup API
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database with pending approval status
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, is_approved, campus_id, semester) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'student', false, req.body.campus_id || null, req.body.semester || 1]
    );

    // Return success message without token (account pending admin approval)
    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! Please wait for admin approval before signing in.',
      pending: true,
      user: {
        id: result.insertId,
        name: name,
        email: email,
        role: 'student'
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Signin API
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    console.log('User found in DB:', users.length > 0);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Check if student account is approved
    if (user.role === 'student' && !user.is_approved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait before signing in.',
        pending: true
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token with ROLE and CAMPUS_ID
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, campus_id: user.campus_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Login successful for:', email);

    // Return user data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        campus_id: user.campus_id,
        roll_number: user.roll_number,
        semester: user.semester
      },
      token: token
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Teacher Signup API
router.post('/teacher/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert teacher into database
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'teacher']
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, email: email, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Teacher account created successfully',
      user: {
        id: result.insertId,
        name: name,
        email: email,
        role: 'teacher'
      },
      token: token
    });

  } catch (error) {
    console.error('Teacher signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Teacher Signin API
router.post('/teacher/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if teacher exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [email, 'teacher']
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or not a teacher account'
      });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token with campus_id
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, campus_id: user.campus_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        campus_id: user.campus_id
      },
      token: token
    });

  } catch (error) {
    console.error('Teacher signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

module.exports = router;
