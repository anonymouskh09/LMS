const fs = require('fs');
const path = require('path');
const { pool } = require('./config/database');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'FINANCE_PROGRESS_SCHEMA.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Remove comments
    sql = sql.replace(/--.*$/gm, '');
    
    // Split by semicolon and filter empty results
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.toUpperCase().startsWith('USE'));
    
    console.log(`--- Running Migration: ${queries.length} queries found ---`);
    
    for (const query of queries) {
      try {
        console.log(`Executing: ${query.substring(0, 30)}...`);
        await pool.query(query);
        console.log('✅ Success');
      } catch (err) {
        console.error(`❌ Error executing query:`);
        console.error(query);
        console.error(err.message);
      }
    }
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    process.exit();
  }
}

runMigration();
