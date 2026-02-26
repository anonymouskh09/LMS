const { pool } = require('./config/database');

async function listTables() {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    console.log('Tables in university_lms:', JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

listTables();
