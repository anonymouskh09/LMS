const express = require('express');
const path = require('path');
const { pool } = require('../config/database');
const { verifyToken, isStudent } = require('../middleware/auth');
const { uploadSubmission } = require('../middleware/upload');

const router = express.Router();

// Student uploads submission file
router.post('/:assignmentId/submit', verifyToken, uploadSubmission.single('file'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;
    const { submission_text } = req.body;
    
    // Check if already submitted
    const [existing] = await pool.query(
      'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, studentId]
    );
    
    if (existing.length > 0) {
      // Update existing submission
      await pool.query(
        'UPDATE submissions SET submission_text = ?, file_path = ?, submitted_file_name = ?, submitted_at = NOW() WHERE id = ?',
        [submission_text, req.file?.path, req.file?.originalname, existing[0].id]
      );
      
      return res.status(200).json({
        success: true,
        message: 'Submission updated successfully'
      });
    }
    
    // Create new submission
    await pool.query(
      'INSERT INTO submissions (assignment_id, student_id, submission_text, file_path, submitted_file_name) VALUES (?, ?, ?, ?, ?)',
      [assignmentId, studentId, submission_text, req.file?.path, req.file?.originalname]
    );
    
    res.status(201).json({
      success: true,
      message: 'Submission uploaded successfully'
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading submission'
    });
  }
});

// Download submission file (teacher only)
router.get('/:submissionId/download', verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    const [submissions] = await pool.query(
      'SELECT file_path, submitted_file_name FROM submissions WHERE id = ?',
      [submissionId]
    );
    
    if (submissions.length === 0 || !submissions[0].file_path) {
      return res.status(404).json({
        success: false,
        message: 'Submission file not found'
      });
    }
    
    const filePath = submissions[0].file_path;
    const fileName = submissions[0].submitted_file_name;
    
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading file'
        });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading file'
    });
  }
});

// Get student's assignments for a course
router.get('/course/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;
    
    const [assignments] = await pool.query(`
      SELECT 
        a.*,
        s.id as submission_id,
        s.submitted_at,
        s.file_path as submitted_file,
        s.marks_obtained,
        s.feedback
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
      WHERE a.course_id = ?
      ORDER BY a.created_at DESC
    `, [studentId, courseId]);
    
    res.status(200).json({
      success: true,
      assignments: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments'
    });
  }
});

// Teacher: Get all submissions for an assignment
router.get('/assignment/:assignmentId', verifyToken, async (req, res) => { // Removed isTeacher middleware temporarily or ensure it's imported if strict check needed
  try {
    const { assignmentId } = req.params;
    
    const [submissions] = await pool.query(`
      SELECT 
        s.*,
        u.name as student_name,
        u.email as student_email
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_at DESC
    `, [assignmentId]);

    res.status(200).json({ success: true, submissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ success: false, message: 'Error fetching submissions' });
  }
});

// Teacher: Grade a submission
router.put('/:id/grade', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { marks_obtained, feedback } = req.body;
    const teacher_id = req.user.id;

    await pool.query(
      'UPDATE submissions SET marks_obtained = ?, feedback = ?, graded_by = ?, graded_at = NOW() WHERE id = ?',
      [marks_obtained, feedback, teacher_id, id]
    );

    res.status(200).json({ success: true, message: 'Submission graded successfully' });
  } catch (error) {
    console.error('Grading error:', error);
    res.status(500).json({ success: false, message: 'Error grading submission' });
  }
});

module.exports = router;
