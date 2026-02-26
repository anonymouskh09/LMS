const { pool } = require('./config/database');
const { generateRollNumber } = require('./utils/rollNumber');

async function finalFix() {
  try {
    // 1. Clear all current roll numbers to avoid conflicts during repair
    console.log('Clearing all existing student roll numbers...');
    await pool.query('UPDATE users SET roll_number = NULL WHERE role = "student"');

    // 2. Fetch students who need roll numbers (which is all of them now)
    const [students] = await pool.query(
      'SELECT id, campus_id, semester FROM users WHERE role = "student" AND campus_id IS NOT NULL ORDER BY id ASC'
    );

    console.log(`Found ${students.length} students to process.`);

    for (const student of students) {
      const rollNumber = await generateRollNumber(student.campus_id, student.semester || 1);
      if (rollNumber) {
        await pool.query(
          'UPDATE users SET roll_number = ? WHERE id = ?',
          [rollNumber, student.id]
        );
        console.log(`✅ student ${student.id} (${student.campus_id}): ${rollNumber}`);
      }
    }

    console.log('--- FINAL REPAIR COMPLETE ---');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

finalFix();
