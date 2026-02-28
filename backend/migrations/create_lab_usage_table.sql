CREATE TABLE IF NOT EXISTS lab_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    lab_name VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME DEFAULT NULL,
    time_spent INT DEFAULT 0, -- Time spent in minutes
    date DATE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);
