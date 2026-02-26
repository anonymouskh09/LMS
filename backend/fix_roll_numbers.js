const { pool } = require('./config/database');
const { generateRollNumber } = require('./utils/rollNumber');

async function fixMissingRollNumbers() {
  try {
    const [students] = await pool.query(
      'SELECT id, campus_id, semester FROM users WHERE role = "student" AND roll_number IS NULL AND campus_id IS NOT NULL'
    );

    console.log(`Found ${students.length} students with missing roll numbers.`);

    for (const student of students) {
      const rollNumber = await generateRollNumber(student.campus_id, student.semester || 1);
      if (rollNumber) {
        await pool.query(
          'UPDATE users SET roll_number = ? WHERE id = ?',
          [rollNumber, student.id]
        );
        console.log(`✅ Fixed student ${student.id}: ${rollNumber}`);
      } else {
        console.warn(`❌ Could not generate roll number for student ${student.id}`);
      }
    }

    console.log('--- Repair Complete ---');
  } catch (err) {
    console.error('Repair failed:', err);
  } finally {
    process.exit();
  }
}

fixMissingRollNumbers();
