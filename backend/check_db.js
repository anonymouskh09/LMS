const { pool } = require('./config/database');

async function checkTimetables() {
  try {
    const [rows] = await pool.query('SELECT * FROM timetables');
    console.log('Timetable Entries:', JSON.stringify(rows, null, 2));
    
    const [teachers] = await pool.query('SELECT id, name, role FROM users WHERE role = "teacher"');
    console.log('Teachers:', JSON.stringify(teachers, null, 2));

    const [courses] = await pool.query('SELECT * FROM courses');
    console.log('Courses:', JSON.stringify(courses, null, 2));

    const [classes] = await pool.query('SELECT * FROM classes');
    console.log('Classes:', JSON.stringify(classes, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkTimetables();
