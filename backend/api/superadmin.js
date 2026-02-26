const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { verifyToken, isSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and super admin check to all routes
router.use(verifyToken);
router.use(isSuperAdmin);

// ==================== GLOBAL OVERVIEW ====================

router.get('/overview', async (req, res) => {
  try {
    const [[{ totalCampuses }]] = await pool.query('SELECT COUNT(*) as totalCampuses FROM campuses');
    const [[{ totalStudents }]] = await pool.query("SELECT COUNT(*) as totalStudents FROM users WHERE role = 'student'");
    const [[{ totalTeachers }]] = await pool.query("SELECT COUNT(*) as totalTeachers FROM users WHERE role = 'teacher'");
    const [[{ totalPrincipals }]] = await pool.query("SELECT COUNT(*) as totalPrincipals FROM users WHERE role = 'principal'");
    const [[{ totalCourses }]] = await pool.query('SELECT COUNT(*) as totalCourses FROM courses');

    // Per-campus breakdown
    const [campusStats] = await pool.query(`
      SELECT 
        c.id,
        c.name as campus_name,
        c.subscription_plan,
        c.is_active,
        COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as students,
        COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) as teachers,
        COUNT(DISTINCT CASE WHEN u.role = 'principal' THEN u.id END) as principals
      FROM campuses c
      LEFT JOIN users u ON u.campus_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json({
      success: true,
      overview: { totalCampuses, totalStudents, totalTeachers, totalPrincipals, totalCourses },
      campusStats
    });
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ success: false, message: 'Error fetching overview' });
  }
});

// ==================== CAMPUSES CRUD ====================

// Get all campuses
router.get('/campuses', async (req, res) => {
  try {
    const [campuses] = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as student_count,
        COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) as teacher_count,
        COUNT(DISTINCT CASE WHEN u.role = 'principal' THEN u.id END) as principal_count
      FROM campuses c
      LEFT JOIN users u ON u.campus_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, campuses });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, message: 'Error fetching departments' });
  }
});

// Create campus
router.post('/campuses', async (req, res) => {
  try {
    const { name, location, subscription_plan, dept_code } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO campuses (name, location, subscription_plan, dept_code) VALUES (?, ?, ?, ?)',
      [name, location || '', subscription_plan || 'basic', dept_code || null]
    );

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department: { id: result.insertId, name, location, subscription_plan }
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, message: 'Error creating department' });
  }
});

// Update department
router.put('/campuses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, subscription_plan, is_active, dept_code } = req.body;

    const [existing] = await pool.query('SELECT id FROM campuses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    await pool.query(
      'UPDATE campuses SET name = ?, location = ?, subscription_plan = ?, is_active = ?, dept_code = ? WHERE id = ?',
      [name, location, subscription_plan, is_active !== undefined ? is_active : true, dept_code || null, id]
    );

    res.json({ success: true, message: 'Department updated successfully' });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, message: 'Error updating department' });
  }
});

// Delete department
router.delete('/campuses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM campuses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Unassign users from this department before deleting
    await pool.query('UPDATE users SET campus_id = NULL WHERE campus_id = ?', [id]);
    await pool.query('DELETE FROM campuses WHERE id = ?', [id]);

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, message: 'Error deleting department' });
  }
});

// ==================== HOD MANAGEMENT ====================

// Get all HODs
router.get('/principals', async (req, res) => {
  try {
    const [principals] = await pool.query(`
      SELECT u.id, u.name, u.email, u.created_at, u.campus_id, c.name as campus_name
      FROM users u
      LEFT JOIN campuses c ON u.campus_id = c.id
      WHERE u.role = 'principal'
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, principals });
  } catch (error) {
    console.error('Get HODs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching HODs' });
  }
});

// Create a new HOD and assign to department
router.post('/principals', async (req, res) => {
  try {
    const { name, email, password, campus_id } = req.body;

    if (!name || !email || !password || !campus_id) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and department_id are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const [campus] = await pool.query('SELECT id FROM campuses WHERE id = ?', [campus_id]);
    if (campus.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, campus_id, is_approved) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'principal', campus_id, true]
    );

    res.status(201).json({
      success: true,
      message: 'HOD created successfully',
      principal: { id: result.insertId, name, email, role: 'principal', campus_id }
    });
  } catch (error) {
    console.error('Create HOD error:', error);
    res.status(500).json({ success: false, message: 'Error creating HOD' });
  }
});

// Delete HOD
router.delete('/principals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [principals] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'principal'", [id]);
    if (principals.length === 0) {
      return res.status(404).json({ success: false, message: 'HOD not found' });
    }
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'HOD deleted successfully' });
  } catch (error) {
    console.error('Delete HOD error:', error);
    res.status(500).json({ success: false, message: 'Error deleting HOD' });
  }
});

module.exports = router;
