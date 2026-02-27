const { pool } = require('./config/database');

const createFeedbackTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                course_id INT DEFAULT NULL,
                lab_id INT DEFAULT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE
            )
        `;
        await pool.query(query);
        console.log('✅ Feedback table created or already exists');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating feedback table:', error);
        process.exit(1);
    }
};

createFeedbackTable();
