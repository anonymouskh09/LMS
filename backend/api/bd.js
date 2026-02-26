const express = require('express');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ==================== PUBLIC ROUTES (no auth needed) ====================

// Get all open job postings — for the public apply page
router.get('/public/jobs', async (req, res) => {
  try {
    const [jobs] = await pool.query(`
      SELECT j.id, j.title, j.subject, j.experience_required, j.salary_range,
             j.description, j.deadline, j.slots_available, j.slots_filled,
             c.name as campus_name, c.location as campus_location, j.invite_token
      FROM bd_job_postings j
      LEFT JOIN campuses c ON j.campus_id = c.id
      WHERE j.status = 'open' AND (j.deadline IS NULL OR j.deadline >= CURDATE())
      ORDER BY j.created_at DESC
    `);
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Public jobs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching jobs' });
  }
});

// Get single job details via TOKEN — for the apply form
router.get('/public/job-by-token/:token', async (req, res) => {
  try {
    const [[job]] = await pool.query(`
      SELECT j.*, c.name as campus_name, c.location as campus_location
      FROM bd_job_postings j
      LEFT JOIN campuses c ON j.campus_id = c.id
      WHERE j.invite_token = ? AND j.status = 'open'
    `, [req.params.token]);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or no longer accepting applications' });
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching job' });
  }
});

// Get single job details via ID (legacy/internal)
router.get('/public/jobs/:id', async (req, res) => {
  try {
    const [[job]] = await pool.query(`
      SELECT j.*, c.name as campus_name, c.location as campus_location
      FROM bd_job_postings j
      LEFT JOIN campuses c ON j.campus_id = c.id
      WHERE j.id = ? AND j.status = 'open'
    `, [req.params.id]);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or no longer accepting applications' });
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching job' });
  }
});

// Submit application — public, no auth
router.post('/public/apply', async (req, res) => {
  try {
    const { job_id, name, email, phone, experience_years, subjects, notes } = req.body;
    if (!name || !email || !job_id) return res.status(400).json({ success: false, message: 'Name, email, and job are required' });

    // Check job still open
    const [[job]] = await pool.query("SELECT id, slots_available, slots_filled FROM bd_job_postings WHERE id = ? AND status = 'open'", [job_id]);
    if (!job) return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });

    // Check not already applied
    const [[existing]] = await pool.query('SELECT id FROM bd_applicants WHERE job_id = ? AND email = ?', [job_id, email]);
    if (existing) return res.status(400).json({ success: false, message: 'You have already applied for this position' });

    await pool.query(
      'INSERT INTO bd_applicants (job_id, name, email, phone, experience_years, subjects, notes, status) VALUES (?,?,?,?,?,?,?,?)',
      [job_id, name, email, phone || null, experience_years || 0, subjects || null, notes || null, 'applied']
    );
    res.status(201).json({ success: true, message: 'Application submitted successfully! We will contact you soon.' });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ success: false, message: 'Error submitting application' });
  }
});

// ==================== PROTECTED ROUTES (BD Agent / Super Admin only) ====================

// BD Agent or Super Admin can access
const isBDOrAdmin = (req, res, next) => {
  if (!['bd_agent', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. BD Agents only.' });
  }
  next();
};

router.use(verifyToken);
router.use(isBDOrAdmin);

// ==================== OVERVIEW ====================

router.get('/overview', async (req, res) => {
  try {
    const [[{ totalLeads }]] = await pool.query('SELECT COUNT(*) as totalLeads FROM bd_campus_leads');
    const [[{ wonLeads }]] = await pool.query("SELECT COUNT(*) as wonLeads FROM bd_campus_leads WHERE status = 'closed_won'");
    const [[{ openJobs }]] = await pool.query("SELECT COUNT(*) as openJobs FROM bd_job_postings WHERE status = 'open'");
    const [[{ totalApplicants }]] = await pool.query('SELECT COUNT(*) as totalApplicants FROM bd_applicants');
    const [[{ hiredCount }]] = await pool.query("SELECT COUNT(*) as hiredCount FROM bd_applicants WHERE status = 'hired'");
    const [[{ activeBatches }]] = await pool.query("SELECT COUNT(*) as activeBatches FROM bd_bulk_hires WHERE status NOT IN ('completed','cancelled')");
    const [[{ totalDealValue }]] = await pool.query("SELECT COALESCE(SUM(deal_value),0) as totalDealValue FROM bd_campus_leads WHERE status = 'closed_won'");

    // Pipeline breakdown
    const [pipeline] = await pool.query(`
      SELECT status, COUNT(*) as count FROM bd_campus_leads GROUP BY status
    `);

    res.json({
      success: true,
      stats: { totalLeads, wonLeads, openJobs, totalApplicants, hiredCount, activeBatches, totalDealValue },
      pipeline
    });
  } catch (error) {
    console.error('BD overview error:', error);
    res.status(500).json({ success: false, message: 'Error fetching overview' });
  }
});

// ==================== CAMPUS LEADS ====================

router.get('/leads', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT l.*, u.name as assigned_to_name FROM bd_campus_leads l LEFT JOIN users u ON l.assigned_to = u.id`;
    const params = [];
    if (status && status !== 'all') { query += ' WHERE l.status = ?'; params.push(status); }
    query += ' ORDER BY l.created_at DESC';
    const [leads] = await pool.query(query, params);
    res.json({ success: true, leads });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leads' });
  }
});

router.post('/leads', async (req, res) => {
  try {
    const { institution_name, contact_person, contact_email, contact_phone, city, deal_value, status, notes } = req.body;
    if (!institution_name) return res.status(400).json({ success: false, message: 'Institution name required' });
    const [result] = await pool.query(
      'INSERT INTO bd_campus_leads (institution_name, contact_person, contact_email, contact_phone, city, deal_value, status, notes, assigned_to) VALUES (?,?,?,?,?,?,?,?,?)',
      [institution_name, contact_person, contact_email, contact_phone, city, deal_value || 0, status || 'prospect', notes, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Lead created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating lead' });
  }
});

router.put('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { institution_name, contact_person, contact_email, contact_phone, city, deal_value, status, notes } = req.body;
    await pool.query(
      'UPDATE bd_campus_leads SET institution_name=?, contact_person=?, contact_email=?, contact_phone=?, city=?, deal_value=?, status=?, notes=? WHERE id=?',
      [institution_name, contact_person, contact_email, contact_phone, city, deal_value, status, notes, id]
    );
    res.json({ success: true, message: 'Lead updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating lead' });
  }
});

router.delete('/leads/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bd_campus_leads WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting lead' });
  }
});

// ==================== JOB POSTINGS ====================

const crypto = require('crypto');

router.get('/jobs', async (req, res) => {
  try {
    const [jobs] = await pool.query(`
      SELECT j.*, c.name as campus_name,
        (SELECT COUNT(*) FROM bd_applicants a WHERE a.job_id = j.id) as applicant_count
      FROM bd_job_postings j
      LEFT JOIN campuses c ON j.campus_id = c.id
      ORDER BY j.created_at DESC
    `);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching jobs' });
  }
});

router.post('/jobs', async (req, res) => {
  try {
    const { title, subject, campus_id, slots_available, experience_required, salary_range, description, deadline } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Job title required' });
    
    const token = crypto.randomBytes(24).toString('hex');
    
    const [result] = await pool.query(
      'INSERT INTO bd_job_postings (title, subject, campus_id, slots_available, experience_required, salary_range, description, deadline, invite_token) VALUES (?,?,?,?,?,?,?,?,?)',
      [title, subject, campus_id || null, slots_available || 1, experience_required, salary_range, description, deadline || null, token]
    );
    res.status(201).json({ success: true, message: 'Job posting created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating job' });
  }
});

router.put('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, campus_id, slots_available, experience_required, salary_range, description, deadline, status } = req.body;
    await pool.query(
      'UPDATE bd_job_postings SET title=?, subject=?, campus_id=?, slots_available=?, experience_required=?, salary_range=?, description=?, deadline=?, status=? WHERE id=?',
      [title, subject, campus_id || null, slots_available, experience_required, salary_range, description, deadline || null, status, id]
    );
    res.json({ success: true, message: 'Job updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating job' });
  }
});

router.delete('/jobs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bd_job_postings WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting job' });
  }
});

// ==================== APPLICANTS ====================

router.get('/applicants', async (req, res) => {
  try {
    const { job_id, status } = req.query;
    let query = `SELECT a.*, j.title as job_title FROM bd_applicants a LEFT JOIN bd_job_postings j ON a.job_id = j.id WHERE 1=1`;
    const params = [];
    if (job_id) { query += ' AND a.job_id = ?'; params.push(job_id); }
    if (status && status !== 'all') { query += ' AND a.status = ?'; params.push(status); }
    query += ' ORDER BY a.applied_at DESC';
    const [applicants] = await pool.query(query, params);
    res.json({ success: true, applicants });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching applicants' });
  }
});

router.post('/applicants', async (req, res) => {
  try {
    const { job_id, name, email, phone, experience_years, subjects, notes } = req.body;
    if (!name || !email || !job_id) return res.status(400).json({ success: false, message: 'Name, email, and job_id required' });
    const [result] = await pool.query(
      'INSERT INTO bd_applicants (job_id, name, email, phone, experience_years, subjects, notes) VALUES (?,?,?,?,?,?,?)',
      [job_id, name, email, phone, experience_years || 0, subjects, notes]
    );
    res.status(201).json({ success: true, message: 'Applicant added', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding applicant' });
  }
});

router.put('/applicants/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['applied', 'shortlisted', 'interviewed', 'hired', 'rejected'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    await pool.query('UPDATE bd_applicants SET status = ? WHERE id = ?', [status, id]);
    // If hired, increment slots_filled on the job
    if (status === 'hired') {
      const [[applicant]] = await pool.query('SELECT job_id FROM bd_applicants WHERE id = ?', [id]);
      if (applicant) await pool.query('UPDATE bd_job_postings SET slots_filled = slots_filled + 1 WHERE id = ?', [applicant.job_id]);
    }
    res.json({ success: true, message: `Applicant status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating applicant status' });
  }
});

router.delete('/applicants/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bd_applicants WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Applicant deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting applicant' });
  }
});

// ==================== BULK HIRES ====================

router.get('/bulk-hires', async (req, res) => {
  try {
    const [batches] = await pool.query(`
      SELECT b.*, c.name as campus_name FROM bd_bulk_hires b
      LEFT JOIN campuses c ON b.campus_id = c.id
      ORDER BY b.created_at DESC
    `);
    res.json({ success: true, batches });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bulk hires' });
  }
});

router.post('/bulk-hires', async (req, res) => {
  try {
    const { campus_id, batch_name, teacher_count, subject_areas, target_date, notes } = req.body;
    if (!batch_name || !teacher_count) return res.status(400).json({ success: false, message: 'Batch name and teacher count required' });
    const [result] = await pool.query(
      'INSERT INTO bd_bulk_hires (campus_id, batch_name, teacher_count, subject_areas, target_date, notes) VALUES (?,?,?,?,?,?)',
      [campus_id || null, batch_name, teacher_count, subject_areas, target_date || null, notes]
    );
    res.status(201).json({ success: true, message: 'Bulk hire batch created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating bulk hire' });
  }
});

router.put('/bulk-hires/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { campus_id, batch_name, teacher_count, subject_areas, target_date, status, notes } = req.body;
    await pool.query(
      'UPDATE bd_bulk_hires SET campus_id=?, batch_name=?, teacher_count=?, subject_areas=?, target_date=?, status=?, notes=? WHERE id=?',
      [campus_id || null, batch_name, teacher_count, subject_areas, target_date || null, status, notes, id]
    );
    res.json({ success: true, message: 'Batch updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating batch' });
  }
});

router.delete('/bulk-hires/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bd_bulk_hires WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Batch deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting batch' });
  }
});

// ==================== GLOBAL ACCESS (BD Agents can see all campuses) ====================

// Global platform stats breakdown
router.get('/global/stats', async (req, res) => {
  try {
    const [[{ totalCampuses }]] = await pool.query('SELECT COUNT(*) as totalCampuses FROM campuses');
    const [[{ totalStudents }]] = await pool.query("SELECT COUNT(*) as totalStudents FROM users WHERE role = 'student'");
    const [[{ totalTeachers }]] = await pool.query("SELECT COUNT(*) as totalTeachers FROM users WHERE role = 'teacher'");
    const [[{ totalClasses }]] = await pool.query('SELECT COUNT(*) as totalClasses FROM classes');
    const [[{ totalCourses }]] = await pool.query('SELECT COUNT(*) as totalCourses FROM courses');

    res.json({
      success: true,
      stats: { totalCampuses, totalStudents, totalTeachers, totalClasses, totalCourses }
    });
  } catch (error) {
    console.error('Global stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching global stats' });
  }
});

// Get all campuses with detailed metrics
router.get('/global/campuses', async (req, res) => {
  try {
    const [campuses] = await pool.query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.role = 'student') as student_count,
        (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.role = 'teacher') as teacher_count,
        (SELECT COUNT(*) FROM classes cl WHERE cl.campus_id = c.id) as class_count,
        (SELECT name FROM users u WHERE u.campus_id = c.id AND u.role = 'principal' LIMIT 1) as hod_name
      FROM campuses c
      ORDER BY c.name ASC
    `);
    res.json({ success: true, campuses });
  } catch (error) {
    console.error('Global campuses error:', error);
    res.status(500).json({ success: false, message: 'Error fetching global campuses' });
  }
});

// Get all teachers across all campuses
router.get('/global/teachers', async (req, res) => {
  try {
    const [teachers] = await pool.query(`
      SELECT u.id, u.name, u.email, u.created_at, c.name as campus_name
      FROM users u
      LEFT JOIN campuses c ON u.campus_id = c.id
      WHERE u.role = 'teacher'
      ORDER BY u.name ASC
    `);
    res.json({ success: true, teachers });
  } catch (error) {
    console.error('Global teachers error:', error);
    res.status(500).json({ success: false, message: 'Error fetching global teachers' });
  }
});

// Get all students across all campuses
router.get('/global/students', async (req, res) => {
  try {
    const [students] = await pool.query(`
      SELECT u.id, u.name, u.email, u.created_at, c.name as campus_name
      FROM users u
      LEFT JOIN campuses c ON u.campus_id = c.id
      WHERE u.role = 'student'
      ORDER BY u.name ASC
    `);
    res.json({ success: true, students });
  } catch (error) {
    console.error('Global students error:', error);
    res.status(500).json({ success: false, message: 'Error fetching global students' });
  }
});

// Get all classes across all campuses
router.get('/global/classes', async (req, res) => {
  try {
    const [classes] = await pool.query(`
      SELECT cl.*, c.name as campus_name, u.name as teacher_name
      FROM classes cl
      LEFT JOIN campuses c ON cl.campus_id = c.id
      LEFT JOIN users u ON cl.teacher_id = u.id
      ORDER BY cl.name, cl.section
    `);
    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching global classes' });
  }
});

module.exports = router;
