const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, isTeacher, isStudent } = require('../middleware/auth');

const router = express.Router();

// Teacher: Get Progress Report for a Student
router.get('/student/:studentId/course/:courseId', verifyToken, isTeacher, async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const teacher_id = req.user.id;

    // Verify teacher owns this course
    const [courses] = await pool.query(
      'SELECT id FROM courses WHERE id = ? AND teacher_id = ?',
      [courseId, teacher_id]
    );

    if (courses.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this course' });
    }

    // Calculate attendance percentage
    const [attendanceStats] = await pool.query(
      `SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count
       FROM attendance
       WHERE student_id = ? AND course_id = ?`,
      [studentId, courseId]
    );

    const stats = attendanceStats[0];
    const attendancePercentage = stats.total_classes > 0
      ? ((stats.present_count + stats.late_count) / stats.total_classes) * 100
      : 0;

    // Calculate grade percentage
    const [grades] = await pool.query(
      `SELECT AVG(percentage) as avg_percentage
       FROM grades
       WHERE student_id = ? AND course_id = ?`,
      [studentId, courseId]
    );

    const gradePercentage = grades[0].avg_percentage || 0;

    // Get existing progress report
    const [existingReport] = await pool.query(
      `SELECT * FROM progress_reports
       WHERE student_id = ? AND course_id = ?
       ORDER BY created_at DESC LIMIT 1`,
      [studentId, courseId]
    );

    const report = existingReport[0] || {
      attendance_percentage: attendancePercentage.toFixed(2),
      grade_percentage: gradePercentage.toFixed(2),
      teacher_remarks: null,
      strengths: null,
      areas_for_improvement: null
    };

    // Update calculated values
    report.attendance_percentage = attendancePercentage.toFixed(2);
    report.grade_percentage = gradePercentage.toFixed(2);
    report.overall_performance = gradePercentage >= 80 ? 'Excellent' :
                                 gradePercentage >= 60 ? 'Good' :
                                 gradePercentage >= 40 ? 'Average' : 'Needs Improvement';

    res.status(200).json({ success: true, report });
  } catch (error) {
    console.error('Get progress report error:', error);
    res.status(500).json({ success: false, message: 'Error fetching progress report' });
  }
});

// Teacher: Add/Update Remarks to Progress Report
router.post('/remarks', verifyToken, isTeacher, async (req, res) => {
  try {
    const { student_id, course_id, teacher_remarks, strengths, areas_for_improvement } = req.body;
    const teacher_id = req.user.id;

    if (!student_id || !course_id) {
      return res.status(400).json({ success: false, message: 'Student ID and Course ID required' });
    }

    // Verify teacher owns this course
    const [courses] = await pool.query(
      'SELECT id FROM courses WHERE id = ? AND teacher_id = ?',
      [course_id, teacher_id]
    );

    if (courses.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this course' });
    }

    // Calculate current stats
    const [attendanceStats] = await pool.query(
      `SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count
       FROM attendance
       WHERE student_id = ? AND course_id = ?`,
      [student_id, course_id]
    );

    const stats = attendanceStats[0];
    const attendancePercentage = stats.total_classes > 0
      ? ((stats.present_count + stats.late_count) / stats.total_classes) * 100
      : 0;

    const [grades] = await pool.query(
      `SELECT AVG(percentage) as avg_percentage
       FROM grades
       WHERE student_id = ? AND course_id = ?`,
      [student_id, course_id]
    );

    const gradePercentage = grades[0].avg_percentage || 0;
    const overallPerformance = gradePercentage >= 80 ? 'Excellent' :
                               gradePercentage >= 60 ? 'Good' :
                               gradePercentage >= 40 ? 'Average' : 'Needs Improvement';

    // Check if report exists
    const [existing] = await pool.query(
      'SELECT id FROM progress_reports WHERE student_id = ? AND course_id = ?',
      [student_id, course_id]
    );

    if (existing.length > 0) {
      // Update existing report
      await pool.query(
        `UPDATE progress_reports 
         SET teacher_remarks = ?, strengths = ?, areas_for_improvement = ?,
             attendance_percentage = ?, grade_percentage = ?, overall_performance = ?,
             report_date = CURDATE()
         WHERE student_id = ? AND course_id = ?`,
        [teacher_remarks, strengths, areas_for_improvement, attendancePercentage, gradePercentage, overallPerformance, student_id, course_id]
      );
    } else {
      // Create new report
      await pool.query(
        `INSERT INTO progress_reports 
         (student_id, course_id, teacher_id, attendance_percentage, grade_percentage, overall_performance, teacher_remarks, strengths, areas_for_improvement, report_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
        [student_id, course_id, teacher_id, attendancePercentage, gradePercentage, overallPerformance, teacher_remarks, strengths, areas_for_improvement]
      );
    }

    res.status(200).json({ success: true, message: 'Progress report updated successfully' });
  } catch (error) {
    console.error('Update progress report error:', error);
    res.status(500).json({ success: false, message: 'Error updating progress report' });
  }
});

// Student: Get My Progress Reports
router.get('/my-progress', verifyToken, isStudent, async (req, res) => {
  try {
    const student_id = req.user.id;

    const [reports] = await pool.query(
      `SELECT pr.*, c.title as course_title, u.name as teacher_name
       FROM progress_reports pr
       JOIN courses c ON pr.course_id = c.id
       JOIN users u ON pr.teacher_id = u.id
       WHERE pr.student_id = ?
       ORDER BY pr.report_date DESC`,
      [student_id]
    );

    res.status(200).json({ success: true, reports });
  } catch (error) {
    console.error('Get my progress error:', error);
    res.status(500).json({ success: false, message: 'Error fetching progress reports' });
  }
});

module.exports = router;
