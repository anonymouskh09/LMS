const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'migrations', 'create_lab_usage_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Running migration: create_lab_usage_table.sql');
        await pool.query(sql);
        console.log('✅ lab_usage table created or already exists.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
