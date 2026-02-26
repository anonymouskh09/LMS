const express = require('express');
const path = require('path');
const { pool } = require('../config/database');
const { verifyToken, isTeacher } = require('../middleware/auth');
const { uploadAssignment } = require('../middleware/upload');

const router = express.Router();

// Teacher uploads assignment file
router.post('/:assignmentId/upload', verifyToken, isTeacher, uploadAssignment.single('file'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Update assignment with file info
    await pool.query(
      'UPDATE assignments SET file_url = ?, file_name = ? WHERE id = ?',
      [req.file.path, req.file.originalname, assignmentId]
    );
    
    res.status(200).json({
      success: true,
      message: 'Assignment file uploaded successfully',
      file: {
        name: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
});

// Download assignment file
router.get('/:assignmentId/download', verifyToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const [assignments] = await pool.query(
      'SELECT file_url, file_name FROM assignments WHERE id = ?',
      [assignmentId]
    );
    
    if (assignments.length === 0 || !assignments[0].file_url) {
      return res.status(404).json({
        success: false,
        message: 'Assignment file not found'
      });
    }
    
    const filePath = assignments[0].file_url;
    const fileName = assignments[0].file_name;
    
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

module.exports = router;
