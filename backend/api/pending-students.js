const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { generateRollNumber } = require('../utils/rollNumber');

const router = express.Router();

// Apply admin authentication to all routes
router.use(verifyToken);
router.use(isAdmin);

// Get All Pending Students
router.get('/', async (req, res) => {
  try {
    const [students] = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at, u.semester, c.name as department_name, c.dept_code
       FROM users u
       LEFT JOIN campuses c ON u.campus_id = c.id
       WHERE u.role = 'student' AND u.is_approved = FALSE
       ORDER BY u.created_at DESC`
    );

    res.status(200).json({ 
      success: true, 
      students,
      count: students.length 
    });
  } catch (error) {
    console.error('Get pending students error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pending students' 
    });
  }
});

// Approve Student
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if student exists and is pending
    const [students] = await pool.query(
      `SELECT id, name, email, campus_id, semester 
       FROM users 
       WHERE id = ? AND role = ? AND is_approved = FALSE`,
      [id, 'student']
    );

    if (students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pending student not found' 
      });
    }

    const student = students[0];
    const rollNumber = await generateRollNumber(student.campus_id, student.semester);

    // Approve the student and assign roll number
    await pool.query(
      'UPDATE users SET is_approved = TRUE, roll_number = ? WHERE id = ?',
      [rollNumber, id]
    );

    console.log(`✅ Admin approved student: ${student.email}${rollNumber ? ` with Roll No: ${rollNumber}` : ''}`);

    res.status(200).json({ 
      success: true, 
      message: `Student ${student.name} approved successfully`,
      student: { ...student, roll_number: rollNumber }
    });
  } catch (error) {
    console.error('Approve student error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error approving student' 
    });
  }
});

// Reject/Delete Student
router.delete('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if student exists and is pending
    const [students] = await pool.query(
      'SELECT id, name, email FROM users WHERE id = ? AND role = ? AND is_approved = FALSE',
      [id, 'student']
    );

    if (students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pending student not found' 
      });
    }

    // Delete the student account
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    console.log(`❌ Admin rejected student: ${students[0].email}`);

    res.status(200).json({ 
      success: true, 
      message: `Student ${students[0].name} rejected and removed`,
      student: students[0]
    });
  } catch (error) {
    console.error('Reject student error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error rejecting student' 
    });
  }
});

module.exports = router;
