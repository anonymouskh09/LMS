const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, isAdmin, isTeacher, isStudent } = require('../middleware/auth');

const router = express.Router();

// Get all available courses
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
     
    let query = `
      SELECT c.*, u.name as teacher_name, cl.name as class_name 
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN classes cl ON c.class_id = cl.id
    `;
    
    const params = [];

    // Filter by status (default to active if not specified, or show all if status='all')
    if (status === 'all') {
      // Do not filter by status
    } else if (status) {
      query += ` WHERE c.status = ?`;
      params.push(status);
    } else {
      query += ` WHERE c.status = 'active'`;
    }
    
    query += ` ORDER BY c.created_at DESC`;

    const [courses] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      courses: courses
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
});

// Create new course (admin/HOD only - teachers cannot create courses)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, teacher_id, class_id } = req.body;
    const isAdminUser = req.user.role === 'admin' || req.user.role === 'principal' || req.user.role === 'super_admin';

    console.log(`[DIAGNOSTIC] Course creation attempt by user: ${req.user.id}, role: ${req.user.role}`);
    console.log(`[DIAGNOSTIC] Body:`, req.body);
    console.log(`[DIAGNOSTIC] isAdminUser check result: ${isAdminUser}`);

    if (!isAdminUser) {
      return res.status(403).json({
        success: false,
        message: `DIAG_COURSES_V2: Access denied. Role '${req.user.role}' is not allowed to create courses. (Admin/HOD only)`
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Course title is required'
      });
    }

    if (!class_id) {
       return res.status(400).json({
        success: false,
        message: 'Class ID is required (Courses must belong to a Class)'
      });
    }

    const finalTeacherId = teacher_id || null;

    const [result] = await pool.query(
      'INSERT INTO courses (title, description, teacher_id, class_id, created_by_admin) VALUES (?, ?, ?, ?, ?)',
      [title, description, finalTeacherId, class_id, isAdminUser]
    );

    const newCourseId = result.insertId;

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: {
        id: newCourseId,
        title,
        description,
        teacher_id: finalTeacherId,
        class_id,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course'
    });
  }
});

// Update Course Status (Complete/Reactivate)
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active', 'completed', 'archived'
        const user = req.user;

        if (!['active', 'completed', 'archived'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        // Check Permissions
        const [course] = await pool.query('SELECT teacher_id FROM courses WHERE id = ?', [id]);
        if (course.length === 0) return res.status(404).json({ success: false, message: 'Course not found' });

        const isPowerUser = ['admin', 'principal', 'super_admin'].includes(user.role);
        console.log(`Permission check: user=${user.email}, role=${user.role}, isPowerUser=${isPowerUser}`);

        if (!isPowerUser && course[0].teacher_id !== user.id) {
            console.log(`Access Denied: user.id=${user.id}, teacher_id=${course[0].teacher_id}`);
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        if (status === 'active' && !isPowerUser) {
             return res.status(403).json({ success: false, message: 'Only Admins/HODs can reactivate courses.' });
        }

        await pool.query('UPDATE courses SET status = ? WHERE id = ?', [status, id]);

        res.json({ success: true, message: `Course marked as ${status}` });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
});

// Student enrolls in a course
router.post('/:courseId/enroll', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Check if course exists
    const [courses] = await pool.query('SELECT id FROM courses WHERE id = ?', [courseId]);

    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const [existing] = await pool.query(
      'SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Enroll student as pending (teacher must approve)
    const [result] = await pool.query(
      'INSERT INTO enrollments (course_id, student_id, status) VALUES (?, ?, ?)',
      [courseId, studentId, 'pending']
    );

    res.status(201).json({
      success: true,
      message: 'Enrollment request sent! Waiting for teacher approval.',
      enrollment: {
        id: result.insertId,
        course_id: courseId,
        student_id: studentId,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course'
    });
  }
});

// Get student's enrolled courses
router.get('/my-enrollments', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const [enrollments] = await pool.query(`
      SELECT c.*, u.name as teacher_name, e.enrolled_at, e.status, cl.name as class_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN classes cl ON c.class_id = cl.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `, [studentId]);

    res.status(200).json({
      success: true,
      enrollments: enrollments
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments'
    });
  }
});

// Get enrolled students for a course (teacher/admin only)
router.get('/:courseId/students', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { classId } = req.query;

    let query = `
      SELECT u.id, u.name, u.email, e.enrolled_at, e.status
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ? AND e.status = 'approved'
    `;
    let params = [courseId];

    if (classId) {
      query += ` AND e.student_id IN (SELECT student_id FROM student_classes WHERE class_id = ?)`;
      params.push(classId);
    }

    query += ` ORDER BY e.enrolled_at DESC`;

    const [students] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      students: students
    });
  } catch (error) {
    console.error('Get course students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course students'
    });
  }
});

// Update Course (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, teacher_id, class_id } = req.body;

    await pool.query(
      'UPDATE courses SET title = ?, description = ?, teacher_id = ?, class_id = ? WHERE id = ?',
      [title, description, teacher_id || null, class_id || null, id]
    );

    res.status(200).json({ success: true, message: 'Course updated successfully' });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, message: 'Error updating course' });
  }
});

// Delete Course (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM courses WHERE id = ?', [id]);

    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, message: 'Error deleting course' });
  }
});

module.exports = router;

