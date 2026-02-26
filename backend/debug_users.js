const { pool } = require('./config/database');

async function debugUsers() {
  try {
    const [users] = await pool.query('SELECT name, email, role, campus_id, is_approved, roll_number FROM users');
    console.log('All Users:', JSON.stringify(users, null, 2));

    const [campuses] = await pool.query('SELECT id, name, dept_code FROM campuses');
    console.log('Campuses:', JSON.stringify(campuses, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debugUsers();
