const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

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

// Get all active labs
router.get('/', async (req, res) => {
    try {
        const [labs] = await pool.query('SELECT * FROM labs ORDER BY id DESC');
        res.json({ success: true, labs });
    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create a new lab (Principal/Admin)
router.post('/', async (req, res) => {
    try {
        const { name, description, icon, url } = req.body;
        await pool.query(
            'INSERT INTO labs (name, description, icon, url) VALUES (?, ?, ?, ?)',
            [name, description, icon, url]
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
