const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { generateRollNumber } = require('../utils/rollNumber');

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(verifyToken);
router.use(isAdmin);

// ==================== TEACHERS ====================

// Get all teachers with their courses
router.get('/teachers', async (req, res) => {
  try {
    const [teachers] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        COUNT(DISTINCT c.id) as total_courses
      FROM users u
      LEFT JOIN courses c ON u.id = c.teacher_id
      WHERE u.role = 'teacher'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    // Get course details for each teacher
    for (let teacher of teachers) {
      const [courses] = await pool.query(
        'SELECT id, title FROM courses WHERE teacher_id = ?',
        [teacher.id]
      );
      teacher.courses = courses;
    }

    res.status(200).json({
      success: true,
      teachers: teachers
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teachers'
    });
  }
});

// Add new teacher
router.post('/teachers', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create teacher
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'teacher']
    );

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      teacher: {
        id: result.insertId,
        name,
        email,
        role: 'teacher'
      }
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating teacher'
    });
  }
});

// Update teacher
router.put('/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    // Check if teacher exists
    const [teachers] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [id, 'teacher']
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // If password is provided, hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
        [name, email, hashedPassword, id]
      );
    } else {
      await pool.query(
        'UPDATE users SET name = ?, email = ? WHERE id = ?',
        [name, email, id]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully'
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating teacher'
    });
  }
});

// Delete teacher
router.delete('/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if teacher exists
    const [teachers] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [id, 'teacher']
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Delete teacher (cascading will handle courses, etc.)
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting teacher'
    });
  }
});

// ==================== STUDENTS ====================

// Get all students with their enrollments
router.get('/students', async (req, res) => {
  try {
    const [students] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.roll_number,
        u.semester,
        u.created_at,
        COUNT(DISTINCT e.id) as total_enrollments
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.student_id
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    // Get enrollment details for each student
    for (let student of students) {
      const [enrollments] = await pool.query(`
        SELECT c.id, c.title 
        FROM courses c
        JOIN enrollments e ON c.id = e.course_id
        WHERE e.student_id = ?
      `, [student.id]);
      student.enrollments = enrollments;
    }

    res.status(200).json({
      success: true,
      students: students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students'
    });
  }
});

// Add new student
router.post('/students', async (req, res) => {
  try {
    const { name, email, password, campus_id, semester } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Generate Roll Number if dept/sem provided
    const rollNumber = await generateRollNumber(campus_id, semester);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student (Admin created students are auto-approved)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, is_approved, campus_id, semester, roll_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'student', true, campus_id || null, semester || 1, rollNumber]
    );

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      student: {
        id: result.insertId,
        name,
        email,
        role: 'student'
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating student'
    });
  }
});

// Update student
router.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    // Check if student exists
    const [students] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [id, 'student']
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // If password is provided, hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
        [name, email, hashedPassword, id]
      );
    } else {
      await pool.query(
        'UPDATE users SET name = ?, email = ? WHERE id = ?',
        [name, email, id]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating student'
    });
  }
});

// Delete student
router.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if student exists
    const [students] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [id, 'student']
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Delete student (cascading will handle enrollments, submissions, etc.)
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting student'
    });
  }
});

module.exports = router;
