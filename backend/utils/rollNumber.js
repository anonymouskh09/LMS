const { pool } = require('../config/database');

/**
 * Generates a unique, sequential roll number for a student.
 * Format: [DEPT_CODE]-[SEM]-[YEAR]-[SEQ]
 * Example: CS-S1-25-001
 * 
 * @param {number} campusId - The department/campus ID
 * @param {number} semester - The current semester
 * @returns {Promise<string|null>} - The generated roll number or null if info is missing
 */
async function generateRollNumber(campusId, semester) {
  console.log(`[RollGen] Starting for Campus: ${campusId}, Sem: ${semester}`);
  if (!campusId || !semester) {
    console.log(`[RollGen] Failed: Missing ${!campusId ? 'campusId' : 'semester'}`);
    return null;
  }

  try {
    const [campusRows] = await pool.query(
      'SELECT dept_code FROM campuses WHERE id = ?',
      [campusId]
    );

    if (campusRows.length === 0 || !campusRows[0].dept_code) {
      console.warn(`⚠️ [RollGen] Failed: No dept_code found for campus_id ${campusId}`);
      return null;
    }

    const deptCode = campusRows[0].dept_code;
    const year = new Date().getFullYear().toString().slice(-2);
    const semLabel = `S${semester}`;
    const prefix = `${deptCode}-${semLabel}-${year}-`;

    // 2. Get the highest current sequence for this department, semester, and year
    const [lastRoll] = await pool.query(
      'SELECT roll_number FROM users WHERE roll_number LIKE ? ORDER BY roll_number DESC LIMIT 1',
      [`${prefix}%`]
    );

    let nextSeq = 1;
    if (lastRoll.length > 0 && lastRoll[0].roll_number) {
      const parts = lastRoll[0].roll_number.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    const sequence = nextSeq.toString().padStart(3, '0');
    const rollNumber = `${prefix}${sequence}`;
    console.log(`[RollGen] Successfully generated: ${rollNumber}`);
    return rollNumber;
  } catch (error) {
    console.error('[RollGen] Error generating roll number:', error);
    throw error;
  }
}

module.exports = { generateRollNumber };
