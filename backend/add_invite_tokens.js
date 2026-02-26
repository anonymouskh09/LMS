const { pool } = require('./config/database');
const crypto = require('crypto');

async function addInviteTokens() {
  console.log('Adding invite_token column to bd_job_postings...');
  try {
    await pool.query(`ALTER TABLE bd_job_postings ADD COLUMN invite_token VARCHAR(64) UNIQUE DEFAULT NULL`);
    console.log('✓ Column added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠ Column already exists, skipping');
    else throw e;
  }

  // Generate tokens for all existing jobs that don't have one
  const [jobs] = await pool.query('SELECT id FROM bd_job_postings WHERE invite_token IS NULL');
  for (const job of jobs) {
    const token = crypto.randomBytes(24).toString('hex');
    await pool.query('UPDATE bd_job_postings SET invite_token = ? WHERE id = ?', [token, job.id]);
    console.log(`✓ Token generated for job #${job.id}`);
  }
  console.log('\n✅ Done! All jobs now have invite tokens.');
  process.exit(0);
}

addInviteTokens().catch(e => { console.error(e); process.exit(1); });
