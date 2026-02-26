const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, isAdmin, isTeacher, isStudent } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Get All Classes (Admin gets all, joined with teacher info)
router.get('/', isAdmin, async (req, res) => {
  try {
    const [classes] = await pool.query(
      `SELECT c.*, u.name as teacher_name, 
       (SELECT COUNT(*) FROM student_classes WHERE class_id = c.id) as student_count
       FROM classes c
       LEFT JOIN users u ON c.teacher_id = u.id
       ORDER BY c.name, c.section`
    );

    res.status(200).json({ success: true, classes });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ success: false, message: 'Error fetching classes' });
  }
});

// Get My Assigned Classes (For Teachers)
router.get('/teacher/my-classes', isTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const [classes] = await pool.query(
      `SELECT c.*, COUNT(DISTINCT sc.student_id) as student_count
       FROM classes c
       LEFT JOIN student_classes sc ON c.id = sc.class_id
       WHERE c.teacher_id = ?
       GROUP BY c.id
       ORDER BY c.name, c.section`,
      [teacherId]
    );

    res.status(200).json({ success: true, classes });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ success: false, message: 'Error fetching classes' });
  }
});

// Get Available Classes for Registration (For Students)
router.get('/available', isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const [classes] = await pool.query(
      `SELECT c.*, u.name as teacher_name,
       (SELECT COUNT(*) FROM student_classes WHERE class_id = c.id AND student_id = ?) as is_registered
       FROM classes c
       LEFT JOIN users u ON c.teacher_id = u.id
       ORDER BY c.name, c.section`,
      [studentId]
    );

    res.status(200).json({ success: true, classes });
  } catch (error) {
    console.error('Get available classes error:', error);
    res.status(500).json({ success: false, message: 'Error fetching classes' });
  }
});

// Student Register for Class
router.post('/register', isStudent, async (req, res) => {
  try {
    const { class_id } = req.body;
    const student_id = req.user.id;

    if (!class_id) {
      return res.status(400).json({ success: false, message: 'Class ID is required' });
    }

    // Check if class exists
    const [classRows] = await pool.query('SELECT id FROM classes WHERE id = ?', [class_id]);
    if (classRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Check if already registered
    const [existing] = await pool.query(
      'SELECT id FROM student_classes WHERE student_id = ? AND class_id = ?',
      [student_id, class_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Already registered for this class' });
    }

    await pool.query(
      'INSERT INTO student_classes (student_id, class_id) VALUES (?, ?)',
      [student_id, class_id]
    );

    res.status(201).json({ success: true, message: 'Successfully registered for class' });
  } catch (error) {
    console.error('Class registration error:', error);
    res.status(500).json({ success: false, message: 'Error registering for class' });
  }
});

// Create Class (Admin/Principal only — teachers cannot create classes)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, section, academic_year, teacher_id } = req.body;
    const isAdminUser = req.user.role === 'admin' || req.user.role === 'principal' || req.user.role === 'super_admin';

    if (!isAdminUser) {
      return res.status(403).json({
        success: false,
        message: 'DIAG_CLASSES_V2: Permission denied. Only admins and HODs can create courses.'
      });
    }

    if (!name) {
      return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    const finalTeacherId = teacher_id || null;

    const [result] = await pool.query(
      'INSERT INTO classes (name, section, academic_year, teacher_id) VALUES (?, ?, ?, ?)',
      [name, section, academic_year, finalTeacherId]
    );

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      class: {
        id: result.insertId,
        name,
        section,
        academic_year,
        teacher_id: finalTeacherId
      }
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ success: false, message: 'Error creating class' });
  }
});

// Update Class (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, section, academic_year, teacher_id } = req.body;
    console.log(`[DEBUG] Updating class ${id}:`, { name, section, academic_year, teacher_id });

    const [result] = await pool.query(
      'UPDATE classes SET name = ?, section = ?, academic_year = ?, teacher_id = ? WHERE id = ?',
      [name, section, academic_year, teacher_id || null, id]
    );

    console.log(`[DEBUG] Update result for class ${id}:`, result);
    res.status(200).json({ success: true, message: 'Class updated successfully' });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ success: false, message: 'Error updating class' });
  }
});

// Delete Class (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    console.log(`[DEBUG] Principal/Admin requesting deletion of class ${id}`);

    await connection.beginTransaction();

    // 1. Delete student-class associations
    await connection.query('DELETE FROM student_classes WHERE class_id = ?', [id]);
    console.log('✓ Deleted student_classes records');
    
    // 2. Delete attendance records
    await connection.query('DELETE FROM attendance WHERE class_id = ?', [id]);
    console.log('✓ Deleted attendance records');
    
    // 3. Delete timetable entries (only if table exists)
    try {
      await connection.query('DELETE FROM timetables WHERE class_id = ?', [id]);
      console.log('✓ Deleted timetable records');
    } catch (ttError) {
      console.log('⚠️ Timetables table does not exist or skipping...');
    }

    // 4. Delete courses and all their cascaded dependencies
    // Note: Due to foreign key constraints, we must delete associated data for each course first
    // if ON DELETE CASCADE is not fully set up.
    const [courses] = await connection.query('SELECT id FROM courses WHERE class_id = ?', [id]);
    
    for (const course of courses) {
        console.log(`  - Cleaning up data for course ${course.id}`);
        // Enrollments, Assignments, Submissions, Marks should cascade if set up, 
        // but let's be safe if "endpoint error" is happening.
        await connection.query('DELETE FROM enrollments WHERE course_id = ?', [course.id]).catch(e => console.log('   (enrollments skip)'));
        await connection.query('DELETE FROM assignments WHERE course_id = ?', [course.id]).catch(e => console.log('   (assignments skip)'));
    }

    await connection.query('DELETE FROM courses WHERE class_id = ?', [id]);
    console.log('✓ Deleted courses records');
    
    // 5. Finally delete the class itself
    const [result] = await connection.query('DELETE FROM classes WHERE id = ?', [id]);
    console.log('✓ Deleted class');

    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    await connection.commit();
    connection.release();

    res.status(200).json({ 
      success: true, 
      message: 'Class and all related records deleted successfully' 
    });
  } catch (error) {
    if (connection) {
        await connection.rollback();
        connection.release();
    }
    console.error(`[CRITICAL] Delete class ${req.params.id} error:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting class: ' + error.message,
      detailedError: error.sqlMessage || error.message
    });
  }
});

// Assign Student to Class (Admin only)
router.post('/:id/assign-student', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    // Check if already assigned
    const [existing] = await pool.query(
      'SELECT id FROM student_classes WHERE student_id = ? AND class_id = ?',
      [student_id, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Student already assigned to this class' });
    }

    await pool.query(
      'INSERT INTO student_classes (student_id, class_id) VALUES (?, ?)',
      [student_id, id]
    );

    res.status(201).json({ success: true, message: 'Student assigned to class successfully' });
  } catch (error) {
    console.error('Assign student error:', error);
    res.status(500).json({ success: false, message: 'Error assigning student to class' });
  }
});

// Remove Student from Class (Admin only)
router.delete('/:id/remove-student/:studentId', isAdmin, async (req, res) => {
  try {
    const { id, studentId } = req.params;

    await pool.query(
      'DELETE FROM student_classes WHERE student_id = ? AND class_id = ?',
      [studentId, id]
    );

    res.status(200).json({ success: true, message: 'Student removed from class successfully' });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ success: false, message: 'Error removing student from class' });
  }
});

// Get Students in a Class (Admin and Teacher)
router.get('/:id/students', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // If teacher, verify they are assigned to this class
    if (user.role === 'teacher') {
      const [classRow] = await pool.query('SELECT teacher_id FROM classes WHERE id = ?', [id]);
      if (classRow.length === 0 || classRow[0].teacher_id !== user.id) {
        return res.status(403).json({ success: false, message: 'Access denied to this class' });
      }
    } else if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [students] = await pool.query(
      `SELECT u.id, u.name, u.email, sc.assigned_at
       FROM student_classes sc
       JOIN users u ON sc.student_id = u.id
       WHERE sc.class_id = ?
       ORDER BY u.name`,
      [id]
    );

    res.status(200).json({ success: true, students });
  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({ success: false, message: 'Error fetching class students' });
  }
});

// Get Courses for a Class
router.get('/:id/courses', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    
    let query = `SELECT * FROM courses WHERE class_id = ?`;
    
    if (status) {
        query += ` AND status = '${status}'`;
    } else {
        query += ` AND status = 'active'`;
    }
    
    query += ` ORDER BY title`;

    const [courses] = await pool.query(query, [id]);
    res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error('Get class courses error:', error);
    res.status(500).json({ success: false, message: 'Error fetching class courses' });
  }
});

// Note: POST /:id/courses and DELETE /:id/courses/:courseId were removed.
// Courses are now strictly created under a class via POST /api/courses with class_id.

module.exports = router;
