const { pool } = require('./config/database');

async function createLogsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS system_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      action VARCHAR(255),
      entity_type VARCHAR(100),
      entity_id INT,
      description TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `;

  try {
    await pool.query(query);
    console.log('✅ system_logs table created successfully');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    process.exit();
  }
}

createLogsTable();
