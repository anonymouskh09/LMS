const { pool } = require('./config/database');

async function debugData() {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, campus_id, semester, roll_number FROM users WHERE role = "student"');
    console.log('Students:', JSON.stringify(users, null, 2));

    const [campuses] = await pool.query('SELECT id, name, dept_code FROM campuses');
    console.log('Campuses:', JSON.stringify(campuses, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

debugData();
