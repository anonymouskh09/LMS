const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, isAdmin, isStudent } = require('../middleware/auth');

// Submit Feedback (Student only)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { courseId, labId, rating, comment } = req.body;
        const studentId = req.user.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const [result] = await pool.query(
            'INSERT INTO feedback (student_id, course_id, lab_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [studentId, courseId || null, labId || null, rating, comment]
        );

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedbackId: result.insertId
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ success: false, message: 'Server error while submitting feedback' });
    }
});

// Get Feedback Analytics for Courses (Admin/HOD)
router.get('/analytics/courses', verifyToken, async (req, res) => {
    try {
        // HOD role name might be 'principal' based on server.js routes
        const isAuthorized = req.user.role === 'admin' || req.user.role === 'principal' || req.user.role === 'superadmin';
        
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Access denied. Admin or HOD only.' });
        }

        const [analytics] = await pool.query(`
            SELECT 
                c.id, 
                c.title, 
                AVG(f.rating) as avg_rating, 
                COUNT(f.id) as feedback_count
            FROM courses c
            JOIN feedback f ON c.id = f.course_id
            GROUP BY c.id
            ORDER BY avg_rating DESC
        `);

        res.json({ success: true, analytics });
    } catch (error) {
        console.error('Error fetching course analytics:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Feedback Analytics for Labs (Admin/HOD)
router.get('/analytics/labs', verifyToken, async (req, res) => {
    try {
        const isAuthorized = req.user.role === 'admin' || req.user.role === 'principal' || req.user.role === 'superadmin';
        
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Access denied. Admin or HOD only.' });
        }

        const [analytics] = await pool.query(`
            SELECT 
                l.id, 
                l.name as title, 
                AVG(f.rating) as avg_rating, 
                COUNT(f.id) as feedback_count
            FROM labs l
            JOIN feedback f ON l.id = f.lab_id
            GROUP BY l.id
            ORDER BY avg_rating DESC
        `);

        res.json({ success: true, analytics });
    } catch (error) {
        console.error('Error fetching lab analytics:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
