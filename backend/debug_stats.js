const { pool } = require('./config/database');

async function debugStats() {
  try {
    const [teachers] = await pool.query('SELECT id, name FROM users WHERE role = "teacher" AND name LIKE "%shaheryar%"');
    console.log('Target Teachers:', JSON.stringify(teachers, null, 2));

    if (teachers.length > 0) {
      for (const teacher of teachers) {
        console.log(`\nAnalyzing stats for: ${teacher.name} (ID: ${teacher.id})`);
        
        const [[{ total_courses }]] = await pool.query(
          'SELECT COUNT(*) as total_courses FROM courses WHERE teacher_id = ?',
          [teacher.id]
        );
        console.log('Courses:', total_courses);

        const [[{ total_students }]] = await pool.query(`
          SELECT COUNT(DISTINCT e.student_id) as total_students
          FROM enrollments e
          JOIN courses c ON e.course_id = c.id
          WHERE c.teacher_id = ? AND e.status = 'approved'
        `, [teacher.id]);
        console.log('Approved Students:', total_students);

        const [all_enrollments] = await pool.query(`
          SELECT e.id, e.status, u.name as student_name, c.title as course_title
          FROM enrollments e
          JOIN courses c ON e.course_id = c.id
          JOIN users u ON e.student_id = u.id
          WHERE c.teacher_id = ?
        `, [teacher.id]);
        console.log('All Enrollments:', JSON.stringify(all_enrollments, null, 2));

        const [[{ total_classes }]] = await pool.query(`
          SELECT COUNT(DISTINCT class_id) as total_classes
          FROM courses
          WHERE teacher_id = ?
        `, [teacher.id]);
        console.log('Classes:', total_classes);
      }
    } else {
      console.log('No teacher found with name containing "shaheryar"');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

debugStats();
