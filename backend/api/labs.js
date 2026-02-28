const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Environment Mapping
const ENV_URLS = {
    'python': 'https://antigravity.codes/embed/python',
    'node.js': 'https://antigravity.codes/embed/node',
    'mysql': 'https://antigravity.codes/embed/mysql',
    'react': 'https://antigravity.codes/embed/react'
};

// Log lab start
router.post('/log-start', async (req, res) => {
    try {
        const { studentId, labName } = req.body;
        const now = new Date();
        const date = now.toISOString().split('T')[0];

        const [result] = await pool.query(
            'INSERT INTO lab_usage (student_id, lab_name, start_time, date) VALUES (?, ?, ?, ?)',
            [studentId, labName, now, date]
        );

        res.json({ success: true, logId: result.insertId });
    } catch (error) {
        console.error('Error logging lab start:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Log lab end
router.post('/log-end', async (req, res) => {
    try {
        const { logId } = req.body;
        const now = new Date();

        // Get start time to calculate duration
        const [logs] = await pool.query('SELECT start_time FROM lab_usage WHERE id = ?', [logId]);
        
        if (logs.length === 0) {
            return res.status(404).json({ success: false, message: 'Log not found' });
        }

        const startTime = new Date(logs[0].start_time);
        const diffInMs = now - startTime;
        const diffInMinutes = Math.round(diffInMs / (1000 * 60));

        await pool.query(
            'UPDATE lab_usage SET end_time = ?, time_spent = ? WHERE id = ?',
            [now, diffInMinutes, logId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error logging lab end:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get usage for a specific student (Teacher/Admin view)
router.get('/usage/student/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const [usage] = await pool.query(
            'SELECT * FROM lab_usage WHERE student_id = ? ORDER BY date DESC, start_time DESC',
            [studentId]
        );
        res.json({ success: true, usage });
    } catch (error) {
        console.error('Error fetching student lab usage:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get global analytics (Admin/HOD view)
router.get('/usage/all', async (req, res) => {
    try {
        const [usage] = await pool.query(
            `SELECT lu.*, u.name as student_name, u.roll_number 
             FROM lab_usage lu 
             JOIN users u ON lu.student_id = u.id 
             ORDER BY lu.date DESC, lu.start_time DESC`
        );
        res.json({ success: true, usage });
    } catch (error) {
        console.error('Error fetching all lab usage:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all active labs (Filtered by class for students)
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = 'SELECT * FROM labs';
        const params = [];

        // If student, only show labs for their classes
        if (req.user.role === 'student') {
            query += ' WHERE class_id IN (SELECT class_id FROM student_classes WHERE student_id = ?)';
            params.push(req.user.id);
            
            // Debug logging
            try {
                const fs = require('fs');
                fs.appendFileSync('lab_debug.log', `${new Date().toISOString()} - Student ${req.user.id} requested labs. Query: ${query} Params: ${params.join(',')}\n`);
            } catch (e) {}
        }

        query += ' ORDER BY id DESC';
        const [labs] = await pool.query(query, params);
        res.json({ success: true, labs });
    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create a new lab (Principal/Admin)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, description, icon, environment, classId } = req.body;
        
        // Map environment name to URL (case-insensitive)
        const envKey = environment ? environment.toLowerCase() : 'python';
        const url = ENV_URLS[envKey] || 'https://antigravity.codes/embed/python'; // fallback
        const hodId = req.user.id;

        await pool.query(
            'INSERT INTO labs (name, description, icon, url, class_id, hod_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, icon, url, classId, hodId]
        );
        res.json({ success: true, message: 'Lab created successfully' });
    } catch (error) {
        console.error('Error creating lab:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete a lab
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM labs WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Lab deleted' });
    } catch (error) {
        console.error('Error deleting lab:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
