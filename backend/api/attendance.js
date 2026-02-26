const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, isTeacher, isStudent } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// ==========================================
// TEACHER: Mark Attendance for Class
// ==========================================
router.post('/mark', isTeacher, async (req, res) => {
  try {
    const { class_id, course_id, attendance_date, students } = req.body;
    const teacher_id = req.user.id;

    // Validate input
    if (!class_id || !course_id || !attendance_date || !Array.isArray(students)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    console.log(`[ATTENDANCE] Marking for class ${class_id}, course ${course_id}, date ${attendance_date}`);

    // Verify teacher owns this class
    const [classCheck] = await pool.query(
      'SELECT teacher_id FROM classes WHERE id = ?', 
      [class_id]
    );

    if (classCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (classCheck[0].teacher_id !== teacher_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not assigned to this class' 
      });
    }

    // Delete existing attendance for this date AND COURSE
    await pool.query(
      'DELETE FROM attendance WHERE class_id = ? AND date = ? AND course_id = ?',
      [class_id, attendance_date, course_id]
    );

    // Insert new attendance records
    if (students.length > 0) {
      const values = students.map(s => [
        class_id,
        course_id,
        s.student_id,
        teacher_id,
        s.status || 'present',
        attendance_date
      ]);

      await pool.query(
        `INSERT INTO attendance 
         (class_id, course_id, student_id, teacher_id, status, date) 
         VALUES ?`,
        [values]
      );
    }

    console.log(`[ATTENDANCE] Saved ${students.length} records`);
    
    res.json({ 
      success: true, 
      message: `Attendance marked for ${students.length} students`,
      count: students.length
    });

  } catch (error) {
    console.error('[ATTENDANCE] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

// ==========================================
// TEACHER: Get Attendance for Date
// ==========================================
router.get('/class/:class_id/date/:date', isTeacher, async (req, res) => {
  try {
    const { class_id, date } = req.params;
    const { course_id } = req.query; // Support filtering by course
    
    let query = 'SELECT student_id, status, course_id FROM attendance WHERE class_id = ? AND date = ?';
    let params = [class_id, date];

    if (course_id) {
        query += ' AND course_id = ?';
        params.push(course_id);
    }

    const [records] = await pool.query(query, params);

    res.json({ success: true, records });
  } catch (error) {
    console.error('[ATTENDANCE] Get error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// TEACHER: Get Students in Class
// ==========================================
router.get('/class/:class_id/students', isTeacher, async (req, res) => {
  try {
    const { class_id } = req.params;
    
    const [students] = await pool.query(
      `SELECT u.id, u.name, u.email 
       FROM student_classes sc
       JOIN users u ON sc.student_id = u.id
       WHERE sc.class_id = ?
       ORDER BY u.name`,
      [class_id]
    );

    res.json({ success: true, students });
  } catch (error) {
    console.error('[ATTENDANCE] Students error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// STUDENT: View My Attendance
// ==========================================
router.get('/my-attendance', isStudent, async (req, res) => {
  try {
    const student_id = req.user.id;

    const [records] = await pool.query(
      `SELECT 
        a.date as attendance_date,
        a.status,
        c.title as course_name,
        cl.name as class_name
       FROM attendance a
       JOIN courses c ON a.course_id = c.id
       JOIN classes cl ON a.class_id = cl.id
       WHERE a.student_id = ?
       ORDER BY a.date DESC
       LIMIT 50`,
      [student_id]
    );

    // Calculate stats
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    res.json({ 
      success: true, 
      records,
      stats: { total, present, absent, late, percentage }
    });
  } catch (error) {
    console.error('[ATTENDANCE] My attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// TEACHER: Get Attendance History (Sheet View)
// ==========================================
router.get('/history', isTeacher, async (req, res) => {
  try {
    const { class_id, course_id, month, year } = req.query;

    if (!class_id || !course_id) {
        return res.status(400).json({ success: false, message: 'Class and Course ID are required' });
    }

    let query = `
      SELECT student_id, date, status 
      FROM attendance 
      WHERE class_id = ? AND course_id = ?
    `;
    const params = [class_id, course_id];

    // Optional: Filter by month/year if provided
    if (month && year) {
        // Construct date range for the month
        const startDate = `${year}-${month}-01`;
        // logical end date calculation or just use LIKE for simplistic 'YYYY-MM-%' if date is stored as string
        // Assuming date is stored as 'YYYY-MM-DD' string based on previous code
        query += ` AND date LIKE ?`;
        params.push(`${year}-${month}-%`);
    }

    query += ` ORDER BY date ASC`;

    const [records] = await pool.query(query, params);

    res.json({ success: true, records });
  } catch (error) {
    console.error('[ATTENDANCE] History error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// TEACHER: Get Full Attendance History (All Dates) with Student Details
// ==========================================
router.get('/history/all', isTeacher, async (req, res) => {
  try {
    const { class_id, course_id, month, year } = req.query;

    if (!class_id || !course_id) {
      return res.status(400).json({ success: false, message: 'Class and Course ID are required' });
    }

    let query = `
      SELECT 
        a.student_id,
        u.name   AS student_name,
        u.email  AS student_email,
        a.date,
        a.status
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      WHERE a.class_id = ? AND a.course_id = ?
    `;
    const params = [class_id, course_id];

    if (month && year) {
      // filter by specific month of a year
      query += ` AND a.date LIKE ?`;
      params.push(`${year}-${String(month).padStart(2,'0')}-%`);
    } else if (year) {
      // filter by whole year
      query += ` AND YEAR(a.date) = ?`;
      params.push(parseInt(year));
    }

    query += ` ORDER BY a.date DESC, u.name ASC`;

    const [records] = await pool.query(query, params);

    // Build unique date list (sorted DESC)
    const dateSet = new Set();
    records.forEach(r => {
      const d = typeof r.date === 'string' ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10);
      dateSet.add(d);
    });

    // Normalise dates inside records
    const normalised = records.map(r => ({
      ...r,
      date: typeof r.date === 'string' ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10),
    }));

    res.json({
      success: true,
      records: normalised,
      dates: [...dateSet].sort().reverse(),   // most-recent first
    });

  } catch (error) {
    console.error('[ATTENDANCE] History/all error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

